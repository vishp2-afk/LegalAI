import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import { usageRecords } from "@shared/schema";
import { eq, and, ne } from "drizzle-orm";

import multer from 'multer';
import { analyzeLegalDocument } from './legalAnalysis';
import { isAuthenticated } from './replitAuth';
import { generateContentHash, bufferToText } from './crypto';
import Stripe from 'stripe';
import express from 'express';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil' as Stripe.LatestApiVersion
});

// Configure multer for file uploads (MIME-type validation)
const allowedMimeTypes = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
];
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 1,
  },
  fileFilter: (_req, file, cb) => {
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOC, DOCX, and TXT files are allowed.'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication route to check current user status
  app.get('/api/auth/me', async (req, res) => {
    try {
      if (req.user && (req.user as any).claims?.sub) {
        // Get user from database using the authenticated user's ID
        const userId = (req.user as any).claims.sub;
        const dbUser = await storage.getUser(userId);
        
        if (dbUser) {
          res.json({
            isAuthenticated: true,
            user: dbUser
          });
        } else {
          // User doesn't exist in DB, return minimal info
          res.json({
            isAuthenticated: true,
            user: {
              id: userId,
              email: (req.user as any).claims.email,
              firstName: (req.user as any).claims.first_name,
              lastName: (req.user as any).claims.last_name,
              analysesUsed: 0
            }
          });
        }
      } else {
        // User is not authenticated
        res.json({
          isAuthenticated: false,
          user: null
        });
      }
    } catch (error) {
      console.error('Error in /api/auth/me:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Document upload endpoint (always allow upload, payment check happens at analysis)
  app.post('/api/documents/upload', isAuthenticated, upload.single('document'), async (req, res) => {
    try {
      const userId = (req.user as any).claims.sub;
      const file = req.file;
      
      if (!file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      // Store document with encryption (preserve binary data)
      const contentBuffer = file.buffer;
      const document = await storage.createDocument({
        userId,
        fileName: file.originalname,
        fileType: file.mimetype,
        fileSize: file.size,
        content: '', // Placeholder, actual content stored encrypted
        contentBuffer: contentBuffer, // Actual content as Buffer
        contentHash: generateContentHash(contentBuffer),
        isPublic: false // Always private
      });

      res.json({ 
        success: true, 
        document: {
          id: document.id,
          fileName: document.fileName,
          fileSize: document.fileSize,
          createdAt: document.createdAt
        }
      });
    } catch (error) {
      console.error('Error uploading document:', error);
      res.status(500).json({ error: 'Failed to upload document' });
    }
  });

  // Start document analysis (free or paid)
  app.post('/api/documents/:documentId/analyze', isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).claims.sub;
      const { documentId } = req.params;
      const { paymentIntentId } = req.body; // Optional payment intent for paid analyses

      // Validate documentId format (UUID)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(documentId)) {
        return res.status(400).json({ error: 'Invalid document ID format' });
      }

      // Verify document belongs to user
      const document = await storage.getDocument(documentId, userId);
      if (!document) {
        return res.status(404).json({ error: 'Document not found' });
      }

      // ATOMIC FREE RESERVATION: Try to reserve a free slot first
      let usageRecord = await storage.atomicReserveFreeSlot(userId);
      let isFreeAnalysis = !!usageRecord;
      let chargeAmount = 0;

      if (!isFreeAnalysis) {
        // Paid analysis required
        if (!paymentIntentId) {
          return res.status(402).json({ 
            error: 'Free analysis limit reached. Payment required.',
            requiresPayment: true 
          });
        }

        // Verify payment intent is successful and valid
        try {
          const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
          
          // Comprehensive payment validation
          if (paymentIntent.status !== 'succeeded') {
            return res.status(402).json({ 
              error: 'Payment not confirmed. Please complete payment first.',
              requiresPayment: true 
            });
          }
          
          if (paymentIntent.amount !== 1000) {
            return res.status(400).json({ error: 'Invalid payment amount' });
          }
          
          if (paymentIntent.currency !== 'usd') {
            return res.status(400).json({ error: 'Invalid payment currency' });
          }
          
          if (paymentIntent.metadata.userId !== userId) {
            return res.status(403).json({ error: 'Payment intent does not belong to this user' });
          }
          
          if (paymentIntent.metadata.type !== 'document_analysis') {
            return res.status(400).json({ error: 'Invalid payment type' });
          }
          
          // Check if payment intent has already been used
          const isUsed = await storage.isPaymentIntentUsed(paymentIntentId);
          if (isUsed) {
            return res.status(400).json({ error: 'Payment intent has already been used' });
          }
          
          // Verify customer matches user's Stripe customer ID
          const user = await storage.getUser(userId);
          if (user?.stripeCustomerId && paymentIntent.customer !== user.stripeCustomerId) {
            return res.status(403).json({ error: 'Payment customer does not match user' });
          }
          
          isFreeAnalysis = false;
          chargeAmount = 10.00;
        } catch (stripeError) {
          console.error('Error verifying payment intent:', stripeError);
          return res.status(402).json({ 
            error: 'Invalid payment. Please try again.',
            requiresPayment: true 
          });
        }
      }

      if (!isFreeAnalysis) {
        // Handle paid usage record atomically to prevent concurrent retry race conditions
        try {
          usageRecord = await storage.atomicHandlePaidUsage(userId, paymentIntentId!, chargeAmount);
          console.log('Handled paid usage for payment intent:', paymentIntentId);
        } catch (dbError) {
          console.error('Failed to handle paid usage record:', dbError);
          if ((dbError as any).message === 'PAYMENT_INTENT_ALREADY_USED') {
            return res.status(400).json({ error: 'Payment intent has already been used' });
          }
          if (paymentIntentId && (dbError as any).code === '23505') { // Unique constraint violation
            return res.status(400).json({ error: 'Payment intent has already been used' });
          }
          return res.status(500).json({ error: 'Failed to reserve analysis slot' });
        }
      }

      // Create analysis record with error cleanup
      let analysis;
      try {
        analysis = await storage.createAnalysis({
          userId,
          documentId,
          status: 'processing',
          summary: null,
          risks: null,
          highlights: null,
          qaMessages: null,
          isFree: isFreeAnalysis,
          amountCharged: chargeAmount.toString()
        });

        // Update usage record with analysis ID
        if (usageRecord) {
          await storage.completeUsageRecord(usageRecord.id, analysis.id);
        }
      } catch (analysisError) {
        console.error('Failed to create analysis:', analysisError);
        // Clean up usage record on failure
        if (usageRecord) {
          await storage.failUsageRecord(usageRecord.id);
        }
        return res.status(500).json({ error: 'Failed to create analysis' });
      }

      // Start analysis asynchronously (convert buffer to text for analysis)
      bufferToText(document.contentBuffer!, document.fileType)
        .then((textContent) => analyzeLegalDocument(textContent, document.fileName))
        .then(async (result) => {
          await storage.updateAnalysis(analysis.id, {
            status: 'completed',
            summary: result.summary as any,
            risks: result.risks as any,
            highlights: result.highlights as any,
            qaMessages: result.qaMessages as any
          });
          
          // Sync user's cached usage count
          await storage.syncUserUsageCount(userId);
        })
        .catch(async (error: any) => {
          console.error('Analysis failed:', error);
          try {
            await storage.updateAnalysis(analysis.id, { status: 'failed' });
            if (usageRecord) {
              await storage.failUsageRecord(usageRecord.id);
            }
          } catch (cleanupError) {
            console.error('Failed to clean up after analysis error:', cleanupError);
          }
        });

      res.json({ 
        success: true, 
        analysisId: analysis.id,
        status: 'processing',
        isFree: isFreeAnalysis,
        amountCharged: chargeAmount
      });
    } catch (error) {
      console.error('Error starting analysis:', error);
      res.status(500).json({ error: 'Failed to start analysis' });
    }
  });

  // Get analysis status and results
  app.get('/api/analyses/:analysisId', isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).claims.sub;
      const { analysisId } = req.params;

      const analysis = await storage.getAnalysis(analysisId, userId);
      if (!analysis) {
        return res.status(404).json({ error: 'Analysis not found' });
      }

      res.json(analysis);
    } catch (error) {
      console.error('Error fetching analysis:', error);
      res.status(500).json({ error: 'Failed to fetch analysis' });
    }
  });

  // Get user's documents
  app.get('/api/documents', isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).claims.sub;
      const documents = await storage.getUserDocuments(userId);
      
      // Don't return document content for privacy
      const sanitizedDocuments = documents.map(doc => ({
        id: doc.id,
        fileName: doc.fileName,
        fileType: doc.fileType,
        fileSize: doc.fileSize,
        createdAt: doc.createdAt
      }));

      res.json(sanitizedDocuments);
    } catch (error) {
      console.error('Error fetching documents:', error);
      res.status(500).json({ error: 'Failed to fetch documents' });
    }
  });

  // Get user's analyses
  app.get('/api/analyses', isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).claims.sub;
      const analyses = await storage.getUserAnalyses(userId);
      res.json(analyses);
    } catch (error) {
      console.error('Error fetching analyses:', error);
      res.status(500).json({ error: 'Failed to fetch analyses' });
    }
  });

  // Stripe billing endpoints
  
  // Create payment intent for document analysis
  app.post('/api/billing/create-payment-intent', isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).claims.sub;
      const userEmail = (req.user as any).claims.email;
      
      // Check if user already has a Stripe customer
      let user = await storage.getUser(userId);
      let customerId = user?.stripeCustomerId;
      
      if (!customerId) {
        // Create new Stripe customer
        const customer = await stripe.customers.create({
          email: userEmail,
          metadata: {
            userId: userId
          }
        });
        customerId = customer.id;
        
        // Update user with Stripe customer ID
        if (user) {
          await storage.updateUserStripeInfo(userId, customerId);
        } else {
          // Create user record if doesn't exist
          await storage.upsertUser({
            id: userId,
            email: userEmail,
            firstName: (req.user as any).claims.first_name,
            lastName: (req.user as any).claims.last_name,
            stripeCustomerId: customerId
          });
        }
      }
      
      // Create payment intent for $10 analysis
      const paymentIntent = await stripe.paymentIntents.create({
        amount: 1000, // $10.00 in cents
        currency: 'usd',
        customer: customerId,
        metadata: {
          userId: userId,
          type: 'document_analysis'
        },
        automatic_payment_methods: {
          enabled: true
        }
      });
      
      res.json({
        clientSecret: paymentIntent.client_secret,
        amount: 1000
      });
    } catch (error) {
      console.error('Error creating payment intent:', error);
      res.status(500).json({ error: 'Failed to create payment intent' });
    }
  });
  
  // Webhook handler is now registered in index.ts before express.json() and exported below
  
  // Get user's billing info and usage
  app.get('/api/billing/usage', isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).claims.sub;
      
      // Get user's current usage count
      const usageCount = await storage.getUserUsageCount(userId);
      const canAnalyzeForFree = await storage.canUserAnalyzeForFree(userId);
      
      // Count free analyses used from usage records (excluding failed)
      const freeAnalysesUsed = await db.select().from(usageRecords)
        .where(and(
          eq(usageRecords.userId, userId), 
          eq(usageRecords.isFreeUsage, true),
          ne(usageRecords.status, 'failed')
        ));
      
      res.json({
        analysesUsed: usageCount,
        freeAnalysesUsed: freeAnalysesUsed.length,
        freeAnalysesRemaining: canAnalyzeForFree ? (10 - freeAnalysesUsed.length) : 0,
        canAnalyzeForFree,
        totalAnalyses: usageCount,
        pricePerAnalysis: 10.00
      });
    } catch (error) {
      console.error('Error fetching billing usage:', error);
      res.status(500).json({ error: 'Failed to fetch usage information' });
    }
  });

  // Health check route
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  const httpServer = createServer(app);

  return httpServer;
}

// Stripe webhook handler (exported for use in index.ts)
export async function handleStripeWebhook(req: any, res: any) {
  const sig = req.headers['stripe-signature'] as string;
  
  if (!sig) {
    console.error('Missing Stripe signature');
    return res.status(400).send('Missing Stripe signature');
  }
  
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error('Missing STRIPE_WEBHOOK_SECRET environment variable');
    return res.status(500).send('Webhook configuration error');
  }
  
  let event: Stripe.Event;
  
  try {
    // Verify webhook signature for security
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return res.status(400).send(`Webhook Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }
  
  // Handle the event
  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('Payment succeeded:', paymentIntent.id, 'for customer:', paymentIntent.customer);
        
        // Validate this is for document analysis
        if (paymentIntent.metadata?.type === 'document_analysis') {
          console.log('Document analysis payment confirmed:', paymentIntent.id);
        }
        break;
        
      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object as Stripe.PaymentIntent;
        console.log('Payment failed:', failedPayment.id, 'reason:', failedPayment.last_payment_error?.message);
        break;
        
      case 'payment_intent.canceled':
        const canceledPayment = event.data.object as Stripe.PaymentIntent;
        console.log('Payment canceled:', canceledPayment.id);
        break;
        
      default:
        console.log(`Unhandled event type ${event.type}`);
    }
    
    // Return 2xx to acknowledge receipt
    res.json({ received: true });
  } catch (error) {
    console.error('Error handling webhook:', error);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
}
