import { pipeline } from '@xenova/transformers'

// Custom helper executing embeddings inside your Node environment
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    // 1. Load the open-source pipeline natively on your system
    const extractor = await pipeline(
      'feature-extraction', 
      'Xenova/all-MiniLM-L6-v2'
    )

    // 2. Compute the vector values
    const output = await extractor(text, { 
      pooling: 'mean', 
      normalize: true 
    })

    // Extract raw numerical values out of the tensor array object
    const baseVector = Array.from(output.data) as number[]

    // 3. Pad the vector to match your Supabase column dimension size (1536)
    const targetLength = 1536
    const paddedVector = new Array(targetLength).fill(0)
    for (let i = 0; i < Math.min(baseVector.length, targetLength); i++) {
      paddedVector[i] = baseVector[i]
    }

    return paddedVector
  } catch (error) {
    console.error('Local Embedding Generation Failure:', error)
    throw new Error('Failed to compute vector analytics locally.')
  }
}