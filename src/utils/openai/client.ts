import { pipeline, env } from '@xenova/transformers'

// 1. CRITICAL OVERRIDES FOR VERCEL DEPLOYMENT
// Disable local filesystem models so it fetches them via CDN safely in production
env.allowLocalModels = false

// Configure the ONNX Runtime WASM threads
if (env.backends?.onnx?.wasm) {
  env.backends.onnx.wasm.numThreads = 1
}

export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    // 2. Load the open-source pipeline natively on your system
    const extractor = await pipeline(
      'feature-extraction', 
      'Xenova/all-MiniLM-L6-v2'
    )

    // 3. Compute the vector values
    const output = await extractor(text, { 
      pooling: 'mean', 
      normalize: true 
    })

    // Extract raw numerical values out of the tensor array object
    const baseVector = Array.from(output.data) as number[]

    // 4. Pad the vector to match your Supabase column dimension size (1536)
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