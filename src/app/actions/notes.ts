'use server'

import { createClient } from '@/utils/supabase/server'
import { redis } from '@/utils/redis/client' 
import { generateEmbedding } from '@/utils/openai/client' 
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

  // 2. Combine text and generate vector embedding via OpenAI
  const combinedText = `Title: ${title}\nContent: ${content}`
  const embedding = await generateEmbedding(combinedText)

  const { error } = await supabase.from('notes').insert([
    {
      title,
      content,
      user_id: user.id,
      image_url: imageUrl,
      embedding // 3. Save the vector array to Supabase!
    }
  ])

  if (error) throw new Error(error.message)

  const cacheKey = `user:notes:${user.id}`
  await redis.del(cacheKey)
  console.log('🧹 Cache cleared after creating a note.')

  revalidatePath('/')
}

export async function updateNote(id: string, title: string, content: string, imageUrl?: string | null) {
  const supabase = await createClient()

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) throw new Error('Unauthorized')

  // 4. Regenerate vector embedding on update so the AI data doesn't become stale
  const combinedText = `Title: ${title}\nContent: ${content}`
  const embedding = await generateEmbedding(combinedText)

  const updateData: any = { 
    title, 
    content, 
    embedding, // 5. Include the fresh embedding vector
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
  console.log('🧹 Cache cleared after updating a note.')

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

export async function searchNotes(queryText: string) {
  const supabase = await createClient()

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) throw new Error('Unauthorized')

  if (!queryText.trim()) return null

  // 1. Generate an embedding vector for the search query text!
  const queryEmbedding = await generateEmbedding(queryText)

  // 2. Call our custom PostgreSQL function using Supabase RPC
  const { data: matchedNotes, error } = await supabase.rpc('match_notes', {
    query_embedding: queryEmbedding,
    match_threshold: 0.2, // Minimum matching score (0 to 1). Notes above 20% match will show up
    match_count: 10,      // Max number of matching notes to return
    filter_user_id: user.id
  })

  if (error) throw new Error(error.message)
  return matchedNotes
}