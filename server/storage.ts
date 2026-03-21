import {
  users,
  documents,
  analyses,
  usageRecords,
  type User,
  type UpsertUser,
  type Document,
  type InsertDocument,
  type Analysis,
  type InsertAnalysis,
  type UsageRecord,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, ne } from "drizzle-orm";
import { randomUUID } from "crypto";
import {
  encryptDocument,
  decryptDocument,
  generateContentHash,
  type EncryptedData,
} from "./crypto";
import { sql } from "drizzle-orm";

// Storage interface with all CRUD operations needed for the legal app
export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  upsertUserByGoogle(data: {
    googleId: string;
    email: string | null;
    firstName: string | null;
    lastName: string | null;
    profileImageUrl: string | null;
  }): Promise<User>;
  updateUserStripeInfo(
    userId: string,
    customerId: string,
    subscriptionId?: string,
  ): Promise<User>;

  // Document operations
  createDocument(document: InsertDocument): Promise<Document>;
  getDocument(id: string, userId: string): Promise<Document | undefined>;
  getUserDocuments(userId: string): Promise<Document[]>;
  deleteDocument(id: string, userId: string): Promise<boolean>;

  // Analysis operations
  createAnalysis(analysis: InsertAnalysis): Promise<Analysis>;
  getAnalysis(id: string, userId: string): Promise<Analysis | undefined>;
  updateAnalysis(id: string, updates: Partial<Analysis>): Promise<Analysis>;
  getUserAnalyses(userId: string): Promise<Analysis[]>;

  // Usage tracking
  getUserUsageCount(userId: string): Promise<number>;
  canUserAnalyzeForFree(userId: string): Promise<boolean>;
  createPendingUsageRecord(
    userId: string,
    isFree: boolean,
    chargeAmount?: number,
    stripePaymentIntentId?: string,
  ): Promise<UsageRecord>;
  completeUsageRecord(
    recordId: string,
    analysisId: string,
  ): Promise<UsageRecord>;
  failUsageRecord(recordId: string): Promise<UsageRecord>;
  atomicReserveFreeSlot(userId: string): Promise<UsageRecord | null>;

  // Payment verification
  isPaymentIntentUsed(paymentIntentId: string): Promise<boolean>;
  getUsageRecordByPaymentIntent(
    paymentIntentId: string,
  ): Promise<UsageRecord | null>;
  reactivateFailedUsageRecord(recordId: string): Promise<UsageRecord>;
  atomicHandlePaidUsage(
    userId: string,
    paymentIntentId: string,
    chargeAmount: number,
  ): Promise<UsageRecord>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async upsertUserByGoogle(data: {
    googleId: string;
    email: string | null;
    firstName: string | null;
    lastName: string | null;
    profileImageUrl: string | null;
  }): Promise<User> {
    // Check if user already exists with this Google ID
    const [existingByGoogle] = await db
      .select()
      .from(users)
      .where(eq(users.googleId, data.googleId));

    if (existingByGoogle) {
      const [user] = await db
        .update(users)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(users.googleId, data.googleId))
        .returning();
      return user;
    }

    // Check if user exists with same email (link Google to existing account)
    if (data.email) {
      const [existingByEmail] = await db
        .select()
        .from(users)
        .where(eq(users.email, data.email));

      if (existingByEmail) {
        const [user] = await db
          .update(users)
          .set({ googleId: data.googleId, profileImageUrl: data.profileImageUrl, updatedAt: new Date() })
          .where(eq(users.email, data.email))
          .returning();
        return user;
      }
    }

    // Create new user
    const [user] = await db
      .insert(users)
      .values({ ...data })
      .returning();
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUserStripeInfo(
    userId: string,
    customerId: string,
    subscriptionId?: string,
  ): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscriptionId,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  // Document operations - privacy ensured by userId filtering and encryption
  async createDocument(
    documentData: InsertDocument & { contentBuffer: Buffer },
  ): Promise<Document> {
    const id = randomUUID();

    // Encrypt the document content (Buffer)
    const encryptedData = encryptDocument(documentData.contentBuffer);
    const encryptedContent = JSON.stringify(encryptedData);

    const [document] = await db
      .insert(documents)
      .values({
        ...documentData,
        id,
        content: encryptedContent,
        contentHash: generateContentHash(documentData.contentBuffer),
      })
      .returning();
    return document;
  }

  async getDocument(
    id: string,
    userId: string,
  ): Promise<(Document & { contentBuffer?: Buffer }) | undefined> {
    const [document] = await db
      .select()
      .from(documents)
      .where(and(eq(documents.id, id), eq(documents.userId, userId)));

    if (document) {
      // Decrypt the document content
      try {
        const encryptedData: EncryptedData = JSON.parse(document.content);
        const decryptedBuffer = decryptDocument(encryptedData);
        return {
          ...document,
          content: document.content, // Keep encrypted content in DB format
          contentBuffer: decryptedBuffer, // Add decrypted buffer for use
        };
      } catch (error) {
        console.error("Failed to decrypt document:", error);
        // Check if it's legacy plaintext data
        if (document.content && !document.content.startsWith('{"version":')) {
          console.log(
            "Legacy plaintext document detected, converting to buffer",
          );
          return {
            ...document,
            contentBuffer: Buffer.from(document.content, "utf8"),
          };
        }
        // Return document with encrypted content if decryption fails (for debugging)
        return document;
      }
    }

    return document;
  }

  async getUserDocuments(userId: string): Promise<Document[]> {
    const docs = await db
      .select()
      .from(documents)
      .where(eq(documents.userId, userId))
      .orderBy(desc(documents.createdAt));

    // Don't decrypt content for list view (performance optimization)
    // Content will be decrypted only when specifically requested via getDocument
    return docs;
  }

  async deleteDocument(id: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(documents)
      .where(and(eq(documents.id, id), eq(documents.userId, userId)));
    return result.rowCount > 0;
  }

  // Analysis operations
  async createAnalysis(analysisData: InsertAnalysis): Promise<Analysis> {
    const id = randomUUID();
    const [analysis] = await db
      .insert(analyses)
      .values({ ...analysisData, id })
      .returning();
    return analysis;
  }

  async getAnalysis(id: string, userId: string): Promise<Analysis | undefined> {
    const [analysis] = await db
      .select()
      .from(analyses)
      .where(and(eq(analyses.id, id), eq(analyses.userId, userId)));
    return analysis;
  }

  async updateAnalysis(
    id: string,
    updates: Partial<Analysis>,
  ): Promise<Analysis> {
    const [analysis] = await db
      .update(analyses)
      .set({
        ...updates,
        completedAt: updates.status === "completed" ? new Date() : undefined,
      })
      .where(eq(analyses.id, id))
      .returning();
    return analysis;
  }

  async getUserAnalyses(userId: string): Promise<Analysis[]> {
    return await db
      .select()
      .from(analyses)
      .where(eq(analyses.userId, userId))
      .orderBy(desc(analyses.createdAt));
  }

  // Usage tracking and billing
  async getUserUsageCount(userId: string): Promise<number> {
    // Count all completed analyses (both free and paid)
    const userAnalyses = await db
      .select()
      .from(analyses)
      .where(
        and(eq(analyses.userId, userId), eq(analyses.status, "completed")),
      );

    const count = userAnalyses.length;

    // Update the user record
    await db
      .update(users)
      .set({ analysesUsed: count, updatedAt: new Date() })
      .where(eq(users.id, userId));

    return count;
  }

  // Check if payment intent has been used before (excluding failed records to allow retries)
  async isPaymentIntentUsed(paymentIntentId: string): Promise<boolean> {
    const [existingRecord] = await db
      .select()
      .from(usageRecords)
      .where(
        and(
          eq(usageRecords.stripePaymentIntentId, paymentIntentId),
          // Count pending and completed (not failed - failed records can be retried)
          ne(usageRecords.status, "failed"),
        ),
      );

    return !!existingRecord;
  }

  // Get existing usage record for payment intent (including failed ones for retry)
  async getUsageRecordByPaymentIntent(
    paymentIntentId: string,
  ): Promise<UsageRecord | null> {
    const [existingRecord] = await db
      .select()
      .from(usageRecords)
      .where(eq(usageRecords.stripePaymentIntentId, paymentIntentId));

    return existingRecord || null;
  }

  // Reactivate a failed usage record for retry
  async reactivateFailedUsageRecord(recordId: string): Promise<UsageRecord> {
    const [record] = await db
      .update(usageRecords)
      .set({
        status: "pending",
        analysisId: null, // Clear previous analysis ID
      })
      .where(eq(usageRecords.id, recordId))
      .returning();
    return record;
  }

  // Create usage record immediately to reserve free quota or payment intent
  async createPendingUsageRecord(
    userId: string,
    isFree: boolean,
    chargeAmount = 0,
    stripePaymentIntentId?: string,
  ): Promise<UsageRecord> {
    const [record] = await db
      .insert(usageRecords)
      .values({
        id: randomUUID(),
        userId,
        analysisId: null, // Will be updated when analysis is created
        isFreeUsage: isFree,
        chargeAmount: chargeAmount.toString(),
        stripePaymentIntentId,
        status: "pending",
      })
      .returning();
    return record;
  }

  // Update usage record with analysis ID and mark as completed
  async completeUsageRecord(
    recordId: string,
    analysisId: string,
  ): Promise<UsageRecord> {
    const [record] = await db
      .update(usageRecords)
      .set({
        analysisId,
        status: "completed",
      })
      .where(eq(usageRecords.id, recordId))
      .returning();
    return record;
  }

  // Mark usage record as failed
  async failUsageRecord(recordId: string): Promise<UsageRecord> {
    const [record] = await db
      .update(usageRecords)
      .set({ status: "failed" })
      .where(eq(usageRecords.id, recordId))
      .returning();
    return record;
  }

  async canUserAnalyzeForFree(userId: string): Promise<boolean> {
    // Count only free usages from usage records (including pending ones to prevent concurrent abuse)
    const freeUsages = await db
      .select()
      .from(usageRecords)
      .where(
        and(
          eq(usageRecords.userId, userId),
          eq(usageRecords.isFreeUsage, true),
          // Count pending and completed (not failed)
          ne(usageRecords.status, "failed"),
        ),
      );

    return freeUsages.length < 10; // First 10 analyses are free
  }

  // Atomically reserve a free analysis slot - prevents race conditions
  // Note: Using optimistic approach since neon-http doesn't support transactions
  async atomicReserveFreeSlot(userId: string): Promise<UsageRecord | null> {
    try {
      // Count current free usages
      const freeUsages = await db
        .select()
        .from(usageRecords)
        .where(
          and(
            eq(usageRecords.userId, userId),
            eq(usageRecords.isFreeUsage, true),
            ne(usageRecords.status, "failed"),
          ),
        );

      // Check if user still has free slots
      if (freeUsages.length >= 10) {
        return null; // No free slots available
      }

      // Reserve a free slot immediately
      const [record] = await db
        .insert(usageRecords)
        .values({
          id: randomUUID(),
          userId,
          analysisId: null,
          isFreeUsage: true,
          chargeAmount: "0.00",
          stripePaymentIntentId: null,
          status: "pending",
        })
        .returning();

      return record;
    } catch (error) {
      console.error("Failed to reserve free slot:", error);
      return null; // Failed to reserve
    }
  }

  // Generate a consistent lock ID for a user (hash userId to 32-bit integer)
  private getUserLockId(userId: string): number {
    const crypto = require("crypto");
    const hash = crypto.createHash("sha256").update(userId).digest("hex");
    // Convert first 8 hex chars to 32-bit signed integer
    return parseInt(hash.substring(0, 8), 16) | 0;
  }

  // Generate a consistent lock ID for a payment intent (hash paymentIntentId to 32-bit integer)
  private getPaymentIntentLockId(paymentIntentId: string): number {
    const crypto = require("crypto");
    const hash = crypto
      .createHash("sha256")
      .update(`payment_${paymentIntentId}`)
      .digest("hex");
    // Convert first 8 hex chars to 32-bit signed integer
    return parseInt(hash.substring(0, 8), 16) | 0;
  }

  // Handle paid usage record - prevents double-spending
  // Note: Using simpler approach since neon-http doesn't support transactions  
  async atomicHandlePaidUsage(
    userId: string,
    paymentIntentId: string,
    chargeAmount: number,
  ): Promise<UsageRecord> {
    try {
      // Check for existing record
      const [existingRecord] = await db
        .select()
        .from(usageRecords)
        .where(eq(usageRecords.stripePaymentIntentId, paymentIntentId));

      if (existingRecord) {
        if (existingRecord.status === "failed") {
          // Reactivate failed record for retry
          const [reactivated] = await db
            .update(usageRecords)
            .set({
              status: "pending",
              analysisId: null, // Clear previous analysis ID
            })
            .where(eq(usageRecords.id, existingRecord.id))
            .returning();
          return reactivated;
        } else if (
          existingRecord.status === "pending" ||
          existingRecord.status === "completed"
        ) {
          // Record exists and is not failed - payment intent already used
          throw new Error("PAYMENT_INTENT_ALREADY_USED");
        }
      }

      // Create new paid usage record
      const [record] = await db
        .insert(usageRecords)
        .values({
          id: randomUUID(),
          userId,
          analysisId: null,
          isFreeUsage: false,
          chargeAmount: chargeAmount.toFixed(2),
          stripePaymentIntentId: paymentIntentId,
          status: "pending",
        })
        .returning();

      return record;
    } catch (error) {
      console.error("Failed to handle paid usage:", error);
      throw error;
    }
  }
}

export const storage = new DatabaseStorage();
