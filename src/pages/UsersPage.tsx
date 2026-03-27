import { useState, useEffect, useCallback } from 'react'
import { supabase, type Profile } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import UserModal, { type UserFormData } from '../components/UserModal'

export default function UsersPage() {
  const { user } = useAuth()
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editTarget, setEditTarget] = useState<Profile | null>(null)
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null)

  const fetchProfiles = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: true })

    if (error) {
      setError(error.message)
    } else {
      setProfiles(data)
      setCurrentProfile(data.find((p) => p.id === user?.id) ?? null)
    }
    setIsLoading(false)
  }, [user?.id])

  useEffect(() => {
    void fetchProfiles()
  }, [fetchProfiles])

  const isAdmin = currentProfile?.role === 'admin'

  const handleUpdate = async (formData: UserFormData) => {
    if (!editTarget) return
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: formData.full_name || null, role: formData.role })
      .eq('id', editTarget.id)
    if (error) throw new Error(error.message)
    await fetchProfiles()
  }

  const handleDelete = async (profile: Profile) => {
    if (!confirm(`Delete user "${profile.email}"? This cannot be undone.`)) return
    const { error } = await supabase.rpc('delete_user', { user_id: profile.id })
    if (error) {
      setError(error.message)
      return
    }
    await fetchProfiles()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Users</h1>
        <span className="text-sm text-gray-400">{profiles.length} total</span>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-12 text-gray-500 text-sm">Loading users...</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Full Name</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Role</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Created</th>
                {isAdmin && (
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {profiles.map((profile) => (
                <tr key={profile.id} className="border-b border-gray-100 last:border-0">
                  <td className="px-4 py-3 text-gray-900">
                    {profile.email}
                    {profile.id === user?.id && (
                      <span className="ml-2 text-xs text-gray-400">(you)</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{profile.full_name ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                        profile.role === 'admin'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {profile.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(profile.created_at).toLocaleDateString()}
                  </td>
                  {isAdmin && (
                    <td className="px-4 py-3 text-right space-x-3">
                      <button
                        onClick={() => setEditTarget(profile)}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Edit
                      </button>
                      {profile.id !== user?.id && (
                        <button
                          onClick={() => void handleDelete(profile)}
                          className="text-red-600 hover:text-red-800 font-medium"
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editTarget && (
        <UserModal
          profile={editTarget}
          onSave={handleUpdate}
          onClose={() => setEditTarget(null)}
        />
      )}
    </div>
  )
}
