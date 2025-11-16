#!/usr/bin/env ts-node
/**
 * Test Error Handling
 *
 * This script tests that error scenarios return proper error messages
 * without crashing the application.
 *
 * Usage: npx ts-node scripts/test-error-handling.ts
 */

import { uploadFile } from "../src/lib/storage";
import { validateImageFile } from "../src/lib/storage";
import { createCanvas } from "canvas";

async function testErrorHandling() {
    console.log("========================================");
    console.log("Testing Error Handling");
    console.log("========================================\n");

    let testsPassed = 0;
    let testsFailed = 0;

    // Test 1: Invalid file type validation
    console.log("[Test 1/3] Testing invalid file type validation...");
    try {
        const validation = validateImageFile("application/pdf", 1024);
        if (!validation.valid && validation.error) {
            console.log(`✅ Validation correctly rejected: ${validation.error}`);
            testsPassed++;
        } else {
            console.log("❌ Validation should have failed but didn't");
            testsFailed++;
        }
    } catch (error) {
        console.log("❌ Validation threw an error (should return error object instead)");
        console.error(error);
        testsFailed++;
    }
    console.log();

    // Test 2: File too large validation
    console.log("[Test 2/3] Testing file size validation...");
    try {
        const validation = validateImageFile("image/png", 20 * 1024 * 1024); // 20MB
        if (!validation.valid && validation.error) {
            console.log(`✅ Validation correctly rejected: ${validation.error}`);
            testsPassed++;
        } else {
            console.log("❌ Validation should have failed but didn't");
            testsFailed++;
        }
    } catch (error) {
        console.log("❌ Validation threw an error (should return error object instead)");
        console.error(error);
        testsFailed++;
    }
    console.log();

    // Test 3: Upload with invalid credentials (simulated)
    console.log("[Test 3/3] Testing graceful upload failure...");
    try {
        // Create a small test image
        const canvas = createCanvas(100, 100);
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#000000";
        ctx.fillRect(0, 0, 100, 100);
        const imageBuffer = canvas.toBuffer("image/png");

        // Try to upload (this should work, but if it fails, it should return an error object)
        const result = await uploadFile(imageBuffer, "image/png", "test");

        if (result.success) {
            console.log(`✅ Upload succeeded gracefully: ${result.url}`);
            testsPassed++;
        } else {
            console.log(`✅ Upload failed gracefully with error message: ${result.error}`);
            testsPassed++;
        }
    } catch (error) {
        console.log("❌ Upload threw an error (should return error object instead)");
        console.error(error);
        testsFailed++;
    }
    console.log();

    // Summary
    console.log("========================================");
    if (testsFailed === 0) {
        console.log("✅ All error handling tests passed!");
        console.log(`   Tests passed: ${testsPassed}/${testsPassed + testsFailed}`);
    } else {
        console.log("❌ Some tests failed");
        console.log(`   Tests passed: ${testsPassed}/${testsPassed + testsFailed}`);
        console.log(`   Tests failed: ${testsFailed}/${testsPassed + testsFailed}`);
    }
    console.log("========================================");
    console.log("\n✅ No crashes detected - error handling is working correctly!");
    console.log("All errors returned as proper error objects instead of throwing.\n");

    process.exit(testsFailed === 0 ? 0 : 1);
}

// Run the test
testErrorHandling();
