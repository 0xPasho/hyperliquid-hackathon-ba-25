import { PrismaClient } from "@prisma/client";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);
const prisma = new PrismaClient();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
    console.log("\n========== Minting Tokens to All Database Users ==========\n");

    try {
        // Fetch all users with wallet addresses
        const users = await prisma.user.findMany({
            where: {
                walletAddress: {
                    not: null
                }
            },
            select: {
                id: true,
                walletAddress: true,
                name: true
            }
        });

        console.log(`Found ${users.length} users with wallet addresses\n`);

        if (users.length === 0) {
            console.log("No users with wallet addresses found. Exiting.\n");
            return;
        }

        // Get unique wallet addresses
        const uniqueAddresses = [...new Set(users.map(u => u.walletAddress).filter(Boolean))];
        console.log(`${uniqueAddresses.length} unique wallet addresses\n`);

        // Display all addresses
        console.log("Addresses to receive tokens:");
        uniqueAddresses.forEach((addr, i) => {
            const user = users.find(u => u.walletAddress === addr);
            console.log(`  ${i + 1}. ${addr} - ${user?.name || 'Unknown'}`);
        });
        console.log("");

        const contractsPath = path.join(__dirname, '../../contracts');
        const amount = process.argv[2] || '10000'; // Default 10,000 USDC

        console.log(`Minting ${amount} USDC to each address...\n`);
        console.log("========================================\n");

        let successCount = 0;
        let failCount = 0;

        // Mint to each address
        for (let i = 0; i < uniqueAddresses.length; i++) {
            const address = uniqueAddresses[i];
            const user = users.find(u => u.walletAddress === address);

            console.log(`[${i + 1}/${uniqueAddresses.length}] Minting to ${address} (${user?.name || 'Unknown'})...`);

            try {
                // Set environment variable for the script to read
                const env = { ...process.env, MINT_ADDRESS: address, MINT_AMOUNT: amount };
                const { stdout, stderr } = await execAsync(
                    `cd ${contractsPath} && MINT_ADDRESS=${address} MINT_AMOUNT=${amount} npx hardhat run scripts/mint-tokens.js --network baseSepolia`,
                    { maxBuffer: 1024 * 1024 * 10, env }
                );

                console.log(stdout);
                if (stderr) console.error(stderr);

                successCount++;
                console.log(`✅ Success\n`);
            } catch (error) {
                console.log(`❌ Failed: ${error.message}\n`);
                failCount++;
            }
        }

        console.log("========================================\n");
        console.log("Minting Summary:");
        console.log(`  Total addresses: ${uniqueAddresses.length}`);
        console.log(`  Successful: ${successCount}`);
        console.log(`  Failed: ${failCount}`);
        console.log(`  Amount per user: ${amount} USDC`);
        console.log(`  Total minted: ${successCount * parseFloat(amount)} USDC\n`);

    } catch (error) {
        console.error("❌ Error:", error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("\n❌ Error:", error.message);
        process.exit(1);
    });
