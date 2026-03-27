-- ============================================================
-- 1. PROFILES TABLE
-- ============================================================
create table public.profiles (
  id          uuid        references auth.users on delete cascade not null primary key,
  email       text        unique not null,
  full_name   text,
  avatar_url  text,
  role        text        not null default 'user'
                          check (role in ('user', 'admin')),
  created_at  timestamptz default now() not null,
  updated_at  timestamptz default now() not null
);

create index profiles_email_idx on public.profiles (email);

-- ============================================================
-- 2. ROW LEVEL SECURITY
-- ============================================================
alter table public.profiles enable row level security;
alter table public.profiles force row level security;

-- SELECT: any authenticated user can read all profiles
create policy "profiles_select_authenticated"
  on public.profiles
  for select
  to authenticated
  using (true);

-- UPDATE: a user may only update their own row
create policy "profiles_update_own"
  on public.profiles
  for update
  to authenticated
  using      ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- INSERT/DELETE: blocked from clients; handled by trigger/RPC
create policy "profiles_insert_deny"
  on public.profiles
  for insert
  to authenticated
  with check (false);

create policy "profiles_delete_deny"
  on public.profiles
  for delete
  to authenticated
  using (false);

-- ============================================================
-- 3. AUTO-CREATE PROFILE ON SIGN-UP
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- 4. AUTO-UPDATE updated_at
-- ============================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

-- ============================================================
-- 5. ADMIN DELETE FUNCTION (SECURITY DEFINER)
-- Deletes from auth.users; CASCADE handles profiles row.
-- ============================================================
create or replace function public.delete_user(user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  calling_role text;
begin
  select role into calling_role
  from public.profiles
  where id = (select auth.uid());

  if calling_role <> 'admin' then
    raise exception 'Insufficient privileges: admin role required';
  end if;

  if user_id = (select auth.uid()) then
    raise exception 'Cannot delete your own account';
  end if;

  delete from auth.users where id = user_id;
end;
$$;

grant execute on function public.delete_user(uuid) to authenticated;

-- ============================================================
-- 6. TABLE GRANTS
-- ============================================================
grant usage on schema public to authenticated;
grant select, update on public.profiles to authenticated;
