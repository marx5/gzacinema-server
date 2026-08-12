const Minio = require('minio');
const multer = require('multer');
require('dotenv').config();

const minioClient = new Minio.Client({
    endPoint: process.env.MINIO_ENDPOINT || '',
    port: parseInt(process.env.MINIO_PORT, 10) || 9000,
    useSSL: process.env.MINIO_USE_SSL === 'true',
    accessKey: process.env.MINIO_ACCESS_KEY || '',
    secretKey: process.env.MINIO_SECRET_KEY || '',
});

const bucketName = process.env.MINIO_BUCKET || '';

const initBucket = async () => {
    try {
        const exists = await minioClient.bucketExists(bucketName);
        if (!exists) {
            await minioClient.makeBucket(bucketName);
            console.log(`Bucket '${bucketName}' created.`);

            const policy = {
                Version: '2012-10-17',
                Statement: [
                    {
                        Effect: 'Allow',
                        Principal: { AWS: ['*'] },
                        Action: ['s3:GetObject'],
                        Resource: [`arn:aws:s3:::${bucketName}/*`],
                    },
                ],
            };
            await minioClient.setBucketPolicy(bucketName, JSON.stringify(policy));
        }
    } catch (err) {
        console.error('MinIO Init Bucket Error:', err);
    }
};

initBucket();

const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }
});

const uploadToMinio = async (fileBuffer, folder, filename, mimetype) => {
    const objectName = `${folder}/${filename}`;
    await minioClient.putObject(bucketName, objectName, fileBuffer, fileBuffer.length, {
        'Content-Type': mimetype || 'image/jpeg',
    });

    const publicUrlBase = process.env.MINIO_PUBLIC_URL || '';
    return `${publicUrlBase}/${objectName}`;
};

const deleteFromMinio = async (objectName) => {
    try {
        await minioClient.removeObject(bucketName, objectName);
    } catch (err) {
        console.error('Error deleting object from MinIO:', err);
    }
};

module.exports = { minioClient, upload, uploadToMinio, deleteFromMinio };
