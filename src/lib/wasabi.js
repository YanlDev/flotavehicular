import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3 = new S3Client({
  region: process.env.WASABI_REGION,
  endpoint: process.env.WASABI_ENDPOINT,
  credentials: {
    accessKeyId: process.env.WASABI_ACCESS_KEY_ID,
    secretAccessKey: process.env.WASABI_SECRET_ACCESS_KEY,
  },
  forcePathStyle: true,
});

const BUCKET = process.env.WASABI_BUCKET_NAME;

/**
 * Sube un archivo a Wasabi y retorna la URL publica y el key del objeto.
 * @param {Buffer} buffer - Contenido del archivo
 * @param {string} key - Ruta del objeto en el bucket (ej: "flota/ABC-123/placa.jpg")
 * @param {string} contentType - MIME type del archivo
 * @returns {Promise<{ url: string, key: string }>}
 */
export async function uploadFile(buffer, key, contentType) {
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      ACL: 'public-read',
    })
  );

  const url = `${process.env.WASABI_ENDPOINT}/${BUCKET}/${key}`;
  return { url, key };
}

/**
 * Elimina un archivo de Wasabi por su key.
 * @param {string} key
 */
export async function deleteFile(key) {
  await s3.send(
    new DeleteObjectCommand({
      Bucket: BUCKET,
      Key: key,
    })
  );
}

/**
 * Genera una URL prefirmada para subida directa desde el cliente (opcional).
 * @param {string} key
 * @param {string} contentType
 * @returns {Promise<string>}
 */
export async function getObject(key) {
  const command = new GetObjectCommand({ Bucket: BUCKET, Key: key });
  const response = await s3.send(command);
  return response;
}

export async function getPresignedUploadUrl(key, contentType) {
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: contentType,
  });

  return getSignedUrl(s3, command, { expiresIn: 300 });
}
