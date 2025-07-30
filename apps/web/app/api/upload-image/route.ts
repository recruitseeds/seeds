import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { type NextRequest, NextResponse } from 'next/server'

const s3Client = new S3Client({
  region: 'auto',
  endpoint: process.env.CLOUDFLARE_R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
  },
})

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('image') as File

    if (!file) {
      return NextResponse.json({ error: 'No image file uploaded' }, { status: 400 })
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const uniqueFilename = generateUniqueFilename(file.name)
    const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME!
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: `uploads/${uniqueFilename}`,
      Body: buffer,
      ContentType: file.type,
    })

    await s3Client.send(command)

    const imageUrl = `${process.env.CLOUDFLARE_R2_PUBLIC_URL}/uploads/${uniqueFilename}`

    return NextResponse.json({ imageUrl }, { status: 200 })
  } catch (error) {
    console.error('Error uploading image:', error)
    return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 })
  }
}

function generateUniqueFilename(originalFilename: string): string {
  const timestamp = Date.now()
  const randomString = Math.random().toString(36).substring(2, 12)
  const extension = originalFilename.split('.').pop()
  return `${timestamp}-${randomString}.${extension}`
}
