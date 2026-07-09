'use client'
import { createClient } from '@/utils/supabase/client'

export default function LoginPage() {
  const supabase = createClient()

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      alert('Error logging in: ' + error.message)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900">
      <div className="p-8 bg-black rounded-xl shadow-md text-center max-w-sm w-full">
        <h1 className="text-2xl font-bold mb-2 text-gray-600">Welcome to Notes App</h1>
        <p className="text-gray-800 mb-6 text-sm">Please sign in to manage your personal notes.</p>
        
        <button
  onClick={handleGoogleLogin}
className="inline-flex items-center justify-center gap-3 px-4 py-2 border border-gray-900 rounded-lg shadow-sm text-sm font-medium text-gray-900 bg-gray-500 hover:bg-gray-600 hover:text-black-600 transition-colors duration-200 cursor-pointer">

  Sign in with Google
</button>
      </div>
    </div>
  )
}