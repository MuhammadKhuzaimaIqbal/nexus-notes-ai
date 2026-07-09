'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createNote(title: string, content: string) {
  const supabase = await createClient()
  
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) throw new Error('Unauthorized')

  const { error } = await supabase.from('notes').insert([
    {
      title,
      content,
      user_id: user.id 
    }
  ])

  if (error) throw new Error(error.message)
  
  revalidatePath('/')
}

export async function updateNote(id: string, title: string, content: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('notes')
    .update({ title, content, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/')
}

export async function deleteNote(id: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('notes')
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/')
}