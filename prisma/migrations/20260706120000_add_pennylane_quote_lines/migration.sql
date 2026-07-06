
-- AlterTable
ALTER TABLE "QuoteRequest" ADD COLUMN     "pennylaneCustomerId" TEXT,
ADD COLUMN     "pennylaneQuoteId" TEXT,
ADD COLUMN     "pennylaneQuoteNumber" TEXT,
ADD COLUMN     "pennylaneQuoteUrl" TEXT,
ADD COLUMN     "pennylaneSyncError" TEXT,
ADD COLUMN     "pennylaneSyncStatus" TEXT DEFAULT 'not_configured',
ADD COLUMN     "pennylaneSyncedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "QuoteLine" (
    "id" TEXT NOT NULL,
    "quoteRequestId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPriceCents" INTEGER NOT NULL DEFAULT 0,
    "vatRate" INTEGER NOT NULL DEFAULT 20,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuoteLine_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "QuoteLine_quoteRequestId_sortOrder_idx" ON "QuoteLine"("quoteRequestId", "sortOrder");

-- AddForeignKey
ALTER TABLE "QuoteLine" ADD CONSTRAINT "QuoteLine_quoteRequestId_fkey" FOREIGN KEY ("quoteRequestId") REFERENCES "QuoteRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

