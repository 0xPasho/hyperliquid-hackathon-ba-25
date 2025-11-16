#!/usr/bin/env ts-node
/**
 * Test MinIO Upload
 *
 * This script tests the MinIO upload functionality by creating
 * a simple test image and uploading it.
 *
 * Usage: npx ts-node scripts/test-upload.ts
 */

import { uploadFile } from "../src/lib/storage";
import { createCanvas } from "canvas";

async function testUpload() {
    try {
        console.log("========================================");
        console.log("Testing MinIO Image Upload");
        console.log("========================================\n");

        // Create a simple test image using canvas
        console.log("[1/3] Creating test image...");
        const canvas = createCanvas(400, 300);
        const ctx = canvas.getContext("2d");

        // Draw a simple gradient background
        const gradient = ctx.createLinearGradient(0, 0, 400, 300);
        gradient.addColorStop(0, "#667eea");
        gradient.addColorStop(1, "#764ba2");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 400, 300);

        // Add text
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 30px Arial";
        ctx.textAlign = "center";
        ctx.fillText("MinIO Test Upload", 200, 150);

        ctx.font = "20px Arial";
        ctx.fillText(new Date().toISOString(), 200, 180);

        // Convert to buffer
        const imageBuffer = canvas.toBuffer("image/png");
        console.log(`✅ Test image created (${imageBuffer.length} bytes)\n`);

        // Test upload to headers folder
        console.log("[2/3] Uploading test image to 'headers' folder...");
        const headerResult = await uploadFile(imageBuffer, "image/png", "headers");
        if (!headerResult.success) {
            throw new Error(`Header upload failed: ${headerResult.error}`);
        }
        console.log(`✅ Upload successful!`);
        console.log(`   URL: ${headerResult.url}\n`);

        // Test upload to thumbnails folder
        console.log("[3/3] Uploading test image to 'thumbnails' folder...");
        const thumbnailResult = await uploadFile(imageBuffer, "image/png", "thumbnails");
        if (!thumbnailResult.success) {
            throw new Error(`Thumbnail upload failed: ${thumbnailResult.error}`);
        }
        console.log(`✅ Upload successful!`);
        console.log(`   URL: ${thumbnailResult.url}\n`);

        console.log("========================================");
        console.log("✅ All tests passed!");
        console.log("========================================");
        console.log("\nUploaded images:");
        console.log(`  Header:    ${headerResult.url}`);
        console.log(`  Thumbnail: ${thumbnailResult.url}`);
        console.log("\nYou can access these URLs in your browser to verify the upload.");
        console.log("========================================\n");

        process.exit(0);
    } catch (error) {
        console.error("\n========================================");
        console.error("❌ Upload test failed!");
        console.error("========================================");
        console.error(error);
        process.exit(1);
    }
}

// Run the test
testUpload();
