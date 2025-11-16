import { PrismaClient } from "@prisma/client";

class Database {
  private static instance: Database;
  private prisma: PrismaClient;

  private constructor() {
    this.prisma = new PrismaClient({
      log: ["query", "info", "warn", "error"],
    });
  }

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  public async connect(): Promise<void> {
    try {
      console.log("Connecting to PostgreSQL...");
      await this.prisma.$connect();
      console.log("✅ PostgreSQL connected successfully");
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error("❌ Failed to connect to PostgreSQL:", error.message);
      } else {
        console.error("❌ Failed to connect to PostgreSQL:", error);
      }
      process.exit(1);
    }
  }

  public async disconnect(): Promise<void> {
    try {
      await this.prisma.$disconnect();
      console.log("✅ PostgreSQL disconnected successfully");
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error("❌ Error disconnecting from PostgreSQL:", error.message);
      } else {
        console.error("❌ Error disconnecting from PostgreSQL:", error);
      }
    }
  }

  public getClient(): PrismaClient {
    return this.prisma;
  }
}

export default Database;
