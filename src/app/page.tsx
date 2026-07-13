import { createClient } from '@/utils/supabase/server'
import { redis } from '@/utils/redis/client' 
import { redirect } from 'next/navigation'
import NotesDashboard from './components/NotesDashboard'

export default async function HomePage() {
  const supabase = await createClient()

  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    redirect('/login')
  }

  const cacheKey = `user:notes:${user.id}`
  let notes: any[] | null = null

  try {
    const cachedNotes = await redis.get<any[]>(cacheKey)

    if (cachedNotes) {
      console.log('Redis Cache HIT! Loaded notes instantly.')
      notes = cachedNotes
    } else {
      console.log('Redis Cache MISS! Fetching from Supabase...')
      
      const { data: supabaseNotes } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      notes = supabaseNotes || []

      await redis.set(cacheKey, notes, { ex: 3600 })
      console.log('Saved fetched notes to Redis cache.')
    }
  } catch (redisError) {
    console.error('Redis Error, falling back to Supabase:', redisError)
    const { data: supabaseNotes } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    notes = supabaseNotes || []
  }

  return (
    <main className="min-h-screen bg-gray-900 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <header className="flex justify-between items-center mb-8 bg-gray-500 p-4 rounded-xl shadow-sm">
          <div>
            <h1 className="text-xl font-bold text-gray-900">My Personal Notes</h1>
            <p className="text-sm text-gray-800">Logged in as: {user.email}</p>
          </div>
          <form action={async () => {
            'use server'
            const supabase = await createClient()
            await supabase.auth.signOut()
            redirect('/login')
          }}>
            <button className="px-4 py-2 text-sm bg-gray-900 text-red-400 rounded-lg hover:bg-gray-800 hover:text-red-600 transition">
              Sign Out
            </button>
          </form>
        </header>

        <NotesDashboard initialNotes={notes || []} />
      </div>
    </main>
  )
}