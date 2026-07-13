'use server'

import { createClient } from '@/utils/supabase/server'
import { redis } from '@/utils/redis/client' 
import { revalidatePath } from 'next/cache'

async function getCacheKey(supabase: any) {
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) throw new Error('Unauthorized')
  return `user:notes:${user.id}`
}

export async function uploadAttachment(formData: FormData) {
  const supabase = await createClient()
  const file = formData.get('file') as File
  if (!file) return null
c
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

  const cacheKey = `user:notes:${user.id}`
  await redis.del(cacheKey)
  console.log('Cache cleared after creating a note.')

  revalidatePath('/')
}

export async function updateNote(id: string, title: string, content: string, imageUrl?: string | null) {
  const supabase = await createClient()

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) throw new Error('Unauthorized')

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

  const cacheKey = `user:notes:${user.id}`
  await redis.del(cacheKey)
  console.log('Cache cleared after updating a note.')

  revalidatePath('/')
}

export async function deleteNote(id: string) {
  const supabase = await createClient()

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('notes')
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)

  const cacheKey = `user:notes:${user.id}`
  await redis.del(cacheKey)
  console.log(' Cache cleared after deleting a note.')

  revalidatePath('/')
}