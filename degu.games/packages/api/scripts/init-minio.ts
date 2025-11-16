#!/usr/bin/env ts-node
/**
 * MinIO Bucket Initialization Script
 *
 * This script creates the bucket and sets up the proper policies
 * for public read access to uploaded images.
 *
 * Usage: npx ts-node scripts/init-minio.ts
 */

import { S3Client, CreateBucketCommand, HeadBucketCommand, PutBucketPolicyCommand } from "@aws-sdk/client-s3";
import dotenv from "dotenv";

dotenv.config();

const MINIO_ENDPOINT = process.env.MINIO_ENDPOINT || "https://minio-qgc4cw0skkokog884wkcwggw.178.156.170.225.sslip.io";
const MINIO_ACCESS_KEY = process.env.MINIO_ACCESS_KEY || "Nkv8K3odxwoJIBOU";
const MINIO_SECRET_KEY = process.env.MINIO_SECRET_KEY || "hss0Aw9UzWenN2jVi6xDiAjTwlsklv9Y";
const BUCKET_NAME = process.env.MINIO_BUCKET_NAME || "degu-projects";

// Initialize S3 client for MinIO
const s3Client = new S3Client({
    endpoint: MINIO_ENDPOINT,
    region: "us-east-1",
    credentials: {
        accessKeyId: MINIO_ACCESS_KEY,
        secretAccessKey: MINIO_SECRET_KEY,
    },
    forcePathStyle: true,
});

async function initializeBucket() {
    try {
        console.log("========================================");
        console.log("MinIO Bucket Initialization");
        console.log("========================================");
        console.log(`Endpoint: ${MINIO_ENDPOINT}`);
        console.log(`Bucket: ${BUCKET_NAME}`);
        console.log(`Access Key: ${MINIO_ACCESS_KEY}`);
        console.log("========================================\n");

        // Step 1: Check if bucket exists
        console.log(`[1/3] Checking if bucket "${BUCKET_NAME}" exists...`);
        let bucketExists = false;

        try {
            await s3Client.send(new HeadBucketCommand({ Bucket: BUCKET_NAME }));
            bucketExists = true;
            console.log(`✅ Bucket "${BUCKET_NAME}" already exists\n`);
        } catch (error: any) {
            if (error.name === "NotFound" || error.$metadata?.httpStatusCode === 404) {
                console.log(`ℹ️  Bucket "${BUCKET_NAME}" does not exist, will create it\n`);
            } else {
                console.error("❌ Error checking bucket:", error.message);
                throw error;
            }
        }

        // Step 2: Create bucket if it doesn't exist
        if (!bucketExists) {
            console.log(`[2/3] Creating bucket "${BUCKET_NAME}"...`);
            try {
                await s3Client.send(new CreateBucketCommand({ Bucket: BUCKET_NAME }));
                console.log(`✅ Bucket "${BUCKET_NAME}" created successfully\n`);
            } catch (error: any) {
                console.error("❌ Error creating bucket:", error.message);
                throw error;
            }
        } else {
            console.log(`[2/3] Skipping bucket creation (already exists)\n`);
        }

        // Step 3: Set bucket policy for public read access
        console.log(`[3/3] Setting public read policy on bucket "${BUCKET_NAME}"...`);
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

        try {
            await s3Client.send(new PutBucketPolicyCommand({
                Bucket: BUCKET_NAME,
                Policy: JSON.stringify(bucketPolicy)
            }));
            console.log(`✅ Bucket policy set successfully\n`);
        } catch (error: any) {
            console.error("❌ Error setting bucket policy:", error.message);
            throw error;
        }

        console.log("========================================");
        console.log("✅ MinIO initialization completed!");
        console.log("========================================");
        console.log(`\nYou can now upload images to the bucket.`);
        console.log(`Public URL format: ${MINIO_ENDPOINT}/${BUCKET_NAME}/<folder>/<filename>`);
        console.log(`\nAvailable folders:`);
        console.log(`  - headers/     (for project header images)`);
        console.log(`  - thumbnails/  (for project thumbnail images)`);
        console.log("========================================\n");

        process.exit(0);
    } catch (error) {
        console.error("\n========================================");
        console.error("❌ MinIO initialization failed!");
        console.error("========================================");
        console.error(error);
        process.exit(1);
    }
}

// Run the initialization
initializeBucket();
