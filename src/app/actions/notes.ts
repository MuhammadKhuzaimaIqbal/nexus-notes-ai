'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function uploadAttachment(formData: FormData) {
  const supabase = await createClient()
  const file = formData.get('file') as File
  if (!file) return null

  const fileExt = file.name.split('.').pop()
  const fileName = `${Math.random()}-${Date.now()}.${fileExt}`

  const { data, error } = await supabase.storage
    .from('note-attachments') 
    .upload(fileName, file)

  if (error) throw new Error('Upload failed: ' + error.message)

  const { data: { publicUrl } } = supabase.storage
    .from('note-attachments')
    .getPublicUrl(fileName)

  return publicUrl
}

export async function createNote(title: string, content: string, imageUrl?: string | null) {
  const supabase = await createClient()
  
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) throw new Error('Unauthorized')

  const { error } = await supabase.from('notes').insert([
    {
      title,
      content,
      user_id: user.id,
      image_url: imageUrl 
    }
  ])

  if (error) throw new Error(error.message)
  revalidatePath('/')
}

export async function updateNote(id: string, title: string, content: string, imageUrl?: string | null) {
  const supabase = await createClient()

  const updateData: any = { 
    title, 
    content, 
    updated_at: new Date().toISOString() 
  }

  if (imageUrl !== undefined) {
    updateData.image_url = imageUrl
  }

  const { error } = await supabase
    .from('notes')
    .update(updateData)
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