"use server"

export async function uploadImageToCloudinaryAction(base64Image: string, folder: string = "products") {
  try {
    console.log("[v0] Starting Cloudinary upload...")
    
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME
    const apiKey = process.env.CLOUDINARY_API_KEY
    const apiSecret = process.env.CLOUDINARY_API_SECRET

    if (!cloudName || !apiKey || !apiSecret) {
      throw new Error("Cloudinary credentials not configured")
    }

    const timestamp = Math.round(Date.now() / 1000)
    
    // Create signature using Web Crypto API
    const stringToSign = `folder=lookali/${folder}&timestamp=${timestamp}${apiSecret}`
    const encoder = new TextEncoder()
    const data = encoder.encode(stringToSign)
    const hashBuffer = await crypto.subtle.digest('SHA-1', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const signature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

    // Prepare form data
    const formData = new FormData()
    formData.append('file', base64Image)
    formData.append('folder', `lookali/${folder}`)
    formData.append('timestamp', timestamp.toString())
    formData.append('api_key', apiKey)
    formData.append('signature', signature)

    // Upload to Cloudinary
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    )

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error?.message || 'Upload failed')
    }

    const result = await response.json()
    console.log("[v0] Cloudinary upload successful:", result.secure_url)

    return {
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
    }
  } catch (error: any) {
    console.error("[v0] Error uploading to Cloudinary:", error.message)
    return {
      success: false,
      error: error.message || "Erro ao fazer upload da imagem",
    }
  }
}

export async function deleteImageFromCloudinaryAction(publicId: string) {
  try {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME
    const apiKey = process.env.CLOUDINARY_API_KEY
    const apiSecret = process.env.CLOUDINARY_API_SECRET

    if (!cloudName || !apiKey || !apiSecret) {
      throw new Error("Cloudinary credentials not configured")
    }

    const timestamp = Math.round(Date.now() / 1000)
    
    const stringToSign = `public_id=${publicId}&timestamp=${timestamp}${apiSecret}`
    const encoder = new TextEncoder()
    const data = encoder.encode(stringToSign)
    const hashBuffer = await crypto.subtle.digest('SHA-1', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const signature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

    const formData = new FormData()
    formData.append('public_id', publicId)
    formData.append('timestamp', timestamp.toString())
    formData.append('api_key', apiKey)
    formData.append('signature', signature)

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`,
      {
        method: 'POST',
        body: formData,
      }
    )

    if (!response.ok) {
      throw new Error('Delete failed')
    }

    return { success: true }
  } catch (error: any) {
    console.error("[v0] Error deleting from Cloudinary:", error)
    return {
      success: false,
      error: error.message || "Erro ao deletar imagem",
    }
  }
}
