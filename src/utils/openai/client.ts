import { pipeline, env } from '@xenova/transformers'

// 1. CRITICAL OVERRIDES FOR VERCEL DEPLOYMENT
// Force the library to skip loading native C++ binaries entirely
env.backends.setPriority(['wasm', 'cpu']) 
env.backends.onnx.wasm.numThreads = 1

// Tell the library NOT to try and run local filesystem checks for native ONNX runtime on the Vercel server
env.allowLocalModels = false

export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    // 2. Initialize the model securely
    const extractor = await pipeline(
      'feature-extraction', 
      'Xenova/all-MiniLM-L6-v2'
    )

    // 3. Compute vector values
    const output = await extractor(text, { 
      pooling: 'mean', 
      normalize: true 
    })

    // Convert raw numerical tensor values to a standard array
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