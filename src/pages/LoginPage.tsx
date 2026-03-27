import { Navigate } from 'react-router-dom'
import { signInWithLogto } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export default function LoginPage() {
  const { session, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <span className="text-gray-500 text-sm">Loading...</span>
      </div>
    )
  }

  if (session) {
    return <Navigate to="/users" replace />
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">User Management</h1>
        <p className="text-sm text-gray-500 mb-8">Sign in to manage your users</p>
        <button
          onClick={() => void signInWithLogto()}
          className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          Sign in with Logto
        </button>
      </div>
    </div>
  )
}
