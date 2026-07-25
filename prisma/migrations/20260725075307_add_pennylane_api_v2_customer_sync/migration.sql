-- AlterTable
ALTER TABLE "QuoteRequest" ADD COLUMN     "pennylaneAmbiguousCandidates" JSONB,
ADD COLUMN     "pennylaneCustomerLastSyncAt" TIMESTAMP(3),
ADD COLUMN     "pennylaneCustomerSyncError" TEXT,
ADD COLUMN     "pennylaneCustomerSyncStatus" TEXT DEFAULT 'PENDING',
ADD COLUMN     "pennylaneCustomerSyncedAt" TIMESTAMP(3),
ADD COLUMN     "pennylaneCustomerType" TEXT,
ADD COLUMN     "pennylaneFinancialsSyncedAt" TIMESTAMP(3),
ADD COLUMN     "pennylaneInvoicesCache" JSONB,
ADD COLUMN     "pennylaneQuotesCache" JSONB;
