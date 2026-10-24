import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import sharp from 'sharp'

const accountId = process.env.R2_ACCOUNT_ID
const accessKeyId = process.env.R2_ACCESS_KEY_ID
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY
const bucket = process.env.R2_BUCKET_NAME
const publicUrl = process.env.R2_PUBLIC_URL // e.g. https://pub-xxxx.r2.dev (no trailing slash)

const configured = Boolean(accountId && accessKeyId && secretAccessKey && bucket && publicUrl)

const client = configured
  ? new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId, secretAccessKey },
    })
  : null

export function storageConfigured() {
  return configured
}

// Every upload is resized down and re-encoded as WebP before it reaches R2 —
// a phone photo that comes in at several MB typically lands well under 500KB,
// with no visible quality loss at the sizes these images are shown at.
export async function uploadImage(buffer, key, { maxWidth } = {}) {
  if (!client) {
    throw new Error('Billede-upload er ikke konfigureret endnu (mangler R2-miljøvariabler).')
  }

  const optimized = await sharp(buffer)
    .rotate() // auto-orient using the photo's EXIF data, then strip metadata
    .resize({ width: maxWidth, withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer()

  const webpKey = key.replace(/\.[^./]+$/, '.webp')
  await client.send(new PutObjectCommand({ Bucket: bucket, Key: webpKey, Body: optimized, ContentType: 'image/webp' }))
  return `${publicUrl}/${webpKey}`
}

export async function deleteImage(url) {
  if (!client || !url.startsWith(publicUrl)) return
  const key = url.slice(publicUrl.length + 1)
  await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key })).catch(() => {})
}
