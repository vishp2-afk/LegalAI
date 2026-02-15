# Code Review: LegalAI

**Date:** 2026-02-14
**Reviewer:** Claude Code (Opus 4.6)
**Branch:** `claude/code-review-2GUzN`

## Overview

LegalAI is a full-stack legal document analysis platform (React + Express + PostgreSQL) that uses OpenAI for AI-powered contract review. The codebase is generally well-structured with clear separation of concerns, but several issues were identified across security, correctness, reliability, and code quality.

---

## CRITICAL Issues

### 1. Prompt Injection Vulnerability
**File:** `server/legalAnalysis.ts:60-113`

User-uploaded document content is interpolated directly into the LLM prompt with no sanitization:

```typescript
const analysisPrompt = `
...
Document: ${fileName}
Content: ${content}
...
`;
```

A malicious user could craft a document whose text content overrides the system prompt. The same issue exists in `generateQAResponse` (line 198-218).

**Impact:** Could cause the AI to return manipulated results, leak system prompt details, or produce harmful output.

**Fix:** Sanitize inputs and use delimiters to clearly separate user content from instructions.

---

### 2. Insecure Legacy Encryption in fileHandler.ts
**File:** `server/fileHandler.ts:65-78`

The `encryptContent` function uses a hardcoded fallback key, a static salt, and the deprecated `crypto.createCipher()` API:

```typescript
const secretKey = process.env.ENCRYPTION_KEY || 'fallback-key-for-dev-only-not-secure';
const key = crypto.scryptSync(secretKey, 'salt', 32);
const cipher = crypto.createCipher(algorithm, key);
```

The IV generated on line 70 is never used.

**Impact:** If this code path is invoked, documents would have weak, deterministic encryption.

**Fix:** Remove insecure encryption/decryption functions; use the proper implementation from `crypto.ts`.

---

### 3. Race Condition in Free Slot Reservation
**File:** `server/storage.ts:366-404`

`atomicReserveFreeSlot` performs a read-then-write without any locking or transaction:

```typescript
const freeUsages = await db.select()...  // read
if (freeUsages.length >= 10) { return null; }
const [record] = await db.insert(usageRecords)...  // write
```

**Impact:** Users could bypass the 10-free-analysis limit via concurrent requests.

**Fix:** Use a database-level CTE to atomically check-and-insert.

---

### 4. Race Condition in atomicHandlePaidUsage
**File:** `server/storage.ts:427-479`

Same TOCTOU (time-of-check-time-of-use) vulnerability as #3. The unique constraint on `stripePaymentIntentId` provides some protection but the flow can still produce inconsistent states.

**Fix:** Use a CTE-based atomic insert with conflict handling.

---

## HIGH Issues

### 5. Stripe API Version Cast to `any`
**File:** `server/routes.ts:18`

```typescript
apiVersion: '2025-08-27.basil' as any
```

Silences type checking; errors won't surface until runtime.

---

### 6. Unhandled Async Error in Analysis Pipeline
**File:** `server/routes.ts:241-261`

If `storage.updateAnalysis` or `storage.failUsageRecord` throws inside the `.catch()`, the error is silently swallowed. The analysis would stay in "processing" state forever.

---

### 7. updateAnalysis Lacks Authorization Check
**File:** `server/storage.ts:214-227`

`updateAnalysis` only filters by `id`, not by `userId`. Any internal bug could allow updating another user's analysis.

---

### 8. Binary Document Analysis is Broken
**File:** `server/crypto.ts:104-108`

For PDF/Word documents, `bufferToText` returns raw base64 which the LLM cannot meaningfully interpret. `fileHandler.ts` also has placeholder implementations.

**Impact:** Analysis of PDF and Word documents produces meaningless results.

---

### 9. documentId Param Not Validated as UUID
**File:** `server/routes.ts:120`

`documentId` is taken directly from the URL path without format validation. Could cause unhandled database errors.

---

## MEDIUM Issues

### 10. Default Query Behavior Throws on 401
**File:** `client/src/lib/queryClient.ts:47`

Default query function throws on 401, causing unhandled rejections for unauthenticated users.

### 11. useCheckout Calls Non-Existent Endpoint
**File:** `client/src/hooks/useCheckout.ts:14`

Calls `/api/billing/checkout` which doesn't exist. Available endpoint is `/api/billing/create-payment-intent`.

### 12. Hardcoded User Info in Header
**File:** `client/src/components/Header.tsx:93-94`

User dropdown always shows "Legal User" and "user@example.com" regardless of actual user.

### 13. Missing `credentials: 'include'` in useCheckout
**File:** `client/src/hooks/useCheckout.ts:14-23`

Session cookies won't be sent, causing 401 errors.

### 14. Dead Code: Lock ID Methods
**File:** `server/storage.ts:407-423`

`getUserLockId` and `getPaymentIntentLockId` are never called. They also use `require("crypto")` inconsistently.

### 15. getUserUsageCount Has Side Effects
**File:** `server/storage.ts:238-256`

This "getter" silently updates the `users` table every time it's called.

### 16. Analysis Type Mismatch Between Client and Server
**File:** `client/src/pages/AnalysisDetails.tsx:10-31`

Client expects flat fields (`riskScore`, `documentType`) but server stores nested JSON under `summary`.

### 17. response.json() Fragility
**File:** `client/src/hooks/useDocuments.ts:68-73`

Response body consumption pattern is fragile across error/success paths.

---

## LOW Issues

### 18. Upload Progress Never Updates
**File:** `client/src/components/DocumentUploader.tsx:25`

`setUploadProgress` is declared but never called. Progress bar always shows 0%.

### 19. No Pagination on Analyses Queries
**File:** `server/routes.ts:317-326`

`getUserAnalyses` returns all analyses without limit.

### 20. Missing Rate Limiting
No rate limiting on any API endpoint. Upload and analysis endpoints are vulnerable to abuse.

### 21. Error Handler Re-throws
**File:** `server/index.ts:54-60`

`throw err` after sending the response causes an unhandled exception crash.

### 22. No Test Coverage
Zero tests for a security-sensitive application handling legal documents and payments.

### 23. Full Page Reload for Navigation
**File:** `client/src/pages/Home.tsx:12-13`, `client/src/pages/Dashboard.tsx:267`

Uses `window.location.href` instead of client-side router.

### 24. Duplicate Multer Configuration
Multer is configured in both `routes.ts` (extension-based) and `fileHandler.ts` (MIME-based). Extension validation is easier to spoof.

---

## Summary

| Severity | Count |
|----------|-------|
| Critical | 4     |
| High     | 5     |
| Medium   | 8     |
| Low      | 7     |

## Fixes Applied

All critical, high, and most medium/low issues have been fixed in this branch. See commit history for details.
