import { S3Client, PutObjectCommand, DeleteObjectCommand, CreateBucketCommand, HeadBucketCommand, PutBucketPolicyCommand } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

const MINIO_ENDPOINT = process.env.MINIO_ENDPOINT || "https://minio-qgc4cw0skkokog884wkcwggw.178.156.170.225.sslip.io";
const MINIO_ACCESS_KEY = process.env.MINIO_ACCESS_KEY || "Nkv8K3odxwoJIBOU";
const MINIO_SECRET_KEY = process.env.MINIO_SECRET_KEY || "hss0Aw9UzWenN2jVi6xDiAjTwlsklv9Y";
const BUCKET_NAME = process.env.MINIO_BUCKET_NAME || "degu-projects";

// Initialize S3 client for MinIO
const s3Client = new S3Client({
    endpoint: MINIO_ENDPOINT,
    region: "us-east-1", // MinIO doesn't care about region, but SDK requires it
    credentials: {
        accessKeyId: MINIO_ACCESS_KEY,
        secretAccessKey: MINIO_SECRET_KEY,
    },
    forcePathStyle: true, // Required for MinIO
});

// Initialize bucket on startup
let bucketInitialized = false;

async function initializeBucket(): Promise<{ success: boolean; error?: string }> {
    if (bucketInitialized) return { success: true };

    try {
        console.log(`[MinIO] Checking if bucket "${BUCKET_NAME}" exists...`);

        // Check if bucket exists
        try {
            await s3Client.send(new HeadBucketCommand({ Bucket: BUCKET_NAME }));
            console.log(`[MinIO] ✅ Bucket "${BUCKET_NAME}" already exists`);
        } catch (error: any) {
            if (error.name === "NotFound" || error.$metadata?.httpStatusCode === 404) {
                // Bucket doesn't exist, create it
                console.log(`[MinIO] Creating bucket "${BUCKET_NAME}"...`);
                await s3Client.send(new CreateBucketCommand({ Bucket: BUCKET_NAME }));
                console.log(`[MinIO] ✅ Bucket "${BUCKET_NAME}" created successfully`);
            } else {
                console.error("[MinIO] ❌ Error checking bucket:", error);
                return {
                    success: false,
                    error: `Failed to check bucket: ${error.message || 'Unknown error'}`
                };
            }
        }

        // Set bucket policy to allow public read access
        const bucketPolicy = {
            Version: "2012-10-17",
            Statement: [
                {
                    Effect: "Allow",
                    Principal: "*",
                    Action: ["s3:GetObject"],
                    Resource: [`arn:aws:s3:::${BUCKET_NAME}/*`]
                }
            ]
        };

        console.log(`[MinIO] Setting public read policy on bucket "${BUCKET_NAME}"...`);
        await s3Client.send(new PutBucketPolicyCommand({
            Bucket: BUCKET_NAME,
            Policy: JSON.stringify(bucketPolicy)
        }));
        console.log(`[MinIO] ✅ Bucket policy set successfully`);

        bucketInitialized = true;
        console.log(`[MinIO] ✅ MinIO storage initialized successfully`);
        console.log(`[MinIO] Endpoint: ${MINIO_ENDPOINT}`);
        console.log(`[MinIO] Bucket: ${BUCKET_NAME}`);
        return { success: true };
    } catch (error: any) {
        console.error("[MinIO] ❌ Failed to initialize bucket:", error);
        return {
            success: false,
            error: `Failed to initialize MinIO storage: ${error.message || 'Unknown error'}`
        };
    }
}

/**
 * Upload a file to MinIO storage
 * @param file - File buffer
 * @param mimeType - MIME type of the file
 * @param folder - Folder in bucket (e.g., "headers", "thumbnails")
 * @returns Result object with success status and URL or error message
 */
export async function uploadFile(
    file: Buffer,
    mimeType: string,
    folder: string
): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
        // Ensure bucket is initialized
        const initResult = await initializeBucket();
        if (!initResult.success) {
            console.error("[MinIO] Failed to initialize bucket:", initResult.error);
            return {
                success: false,
                error: initResult.error || "Failed to initialize storage"
            };
        }

        // Generate unique filename
        const fileExtension = getFileExtension(mimeType);
        const fileName = `${folder}/${crypto.randomUUID()}.${fileExtension}`;

        console.log(`[MinIO] Uploading file: ${fileName}`);

        // Upload to MinIO
        const upload = new Upload({
            client: s3Client,
            params: {
                Bucket: BUCKET_NAME,
                Key: fileName,
                Body: file,
                ContentType: mimeType,
                // Note: ACL not used, bucket policy handles public access
            },
        });

        await upload.done();

        // Return public URL
        const publicUrl = `${MINIO_ENDPOINT}/${BUCKET_NAME}/${fileName}`;
        console.log(`[MinIO] ✅ File uploaded successfully: ${publicUrl}`);
        return {
            success: true,
            url: publicUrl
        };
    } catch (error: any) {
        console.error("[MinIO] ❌ Upload failed:", error);
        return {
            success: false,
            error: `Failed to upload file: ${error.message || 'Unknown error'}`
        };
    }
}

/**
 * Delete a file from MinIO storage
 * @param fileUrl - Full URL of the file
 * @returns Result object with success status or error message
 */
export async function deleteFile(fileUrl: string): Promise<{ success: boolean; error?: string }> {
    try {
        // Extract key from URL
        const url = new URL(fileUrl);
        const key = url.pathname.replace(`/${BUCKET_NAME}/`, "");

        await s3Client.send(
            new DeleteObjectCommand({
                Bucket: BUCKET_NAME,
                Key: key,
            })
        );

        console.log(`[MinIO] ✅ File deleted successfully: ${key}`);
        return { success: true };
    } catch (error: any) {
        console.error("[MinIO] ❌ Delete failed:", error);
        return {
            success: false,
            error: `Failed to delete file: ${error.message || 'Unknown error'}`
        };
    }
}

/**
 * Get file extension from MIME type
 */
function getFileExtension(mimeType: string): string {
    const mimeMap: Record<string, string> = {
        "image/jpeg": "jpg",
        "image/jpg": "jpg",
        "image/png": "png",
        "image/gif": "gif",
        "image/webp": "webp",
        "image/svg+xml": "svg",
    };

    return mimeMap[mimeType] || "jpg";
}

/**
 * Validate image file
 */
export function validateImageFile(mimeType: string, size: number): { valid: boolean; error?: string } {
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!allowedTypes.includes(mimeType)) {
        return {
            valid: false,
            error: "Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.",
        };
    }

    if (size > maxSize) {
        return {
            valid: false,
            error: "File size exceeds 10MB limit.",
        };
    }

    return { valid: true };
}
