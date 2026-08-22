-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN     "photosApres" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "photosAvant" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "workshopStatus" TEXT;

-- AlterTable
ALTER TABLE "QuoteRequest" ADD COLUMN     "followupStage" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lastFollowupSentAt" TIMESTAMP(3),
ADD COLUMN     "licensePlate" TEXT,
ADD COLUMN     "reviewRequestSentAt" TIMESTAMP(3),
ADD COLUMN     "vehicleReadyNotificationSentAt" TIMESTAMP(3),
ALTER COLUMN "status" SET DEFAULT 'NOUVELLE';

-- AlterTable
ALTER TABLE "SiteSettings" ADD COLUMN     "followupAutomationEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "followupDelay1Days" INTEGER NOT NULL DEFAULT 3,
ADD COLUMN     "followupDelay2Days" INTEGER NOT NULL DEFAULT 7,
ADD COLUMN     "reminder1hEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "reminder24hEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "reviewRequestDelayHours" INTEGER NOT NULL DEFAULT 24,
ADD COLUMN     "reviewRequestEnabled" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "ActivityEvent" (
    "id" TEXT NOT NULL,
    "quoteRequestId" TEXT,
    "appointmentId" TEXT,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "metadata" JSONB,
    "actor" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ActivityEvent_quoteRequestId_createdAt_idx" ON "ActivityEvent"("quoteRequestId", "createdAt");

-- CreateIndex
CREATE INDEX "ActivityEvent_appointmentId_createdAt_idx" ON "ActivityEvent"("appointmentId", "createdAt");

-- AddForeignKey
ALTER TABLE "ActivityEvent" ADD CONSTRAINT "ActivityEvent_quoteRequestId_fkey" FOREIGN KEY ("quoteRequestId") REFERENCES "QuoteRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityEvent" ADD CONSTRAINT "ActivityEvent_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- DataMigration: remap QuoteRequest.status legacy values to the new commercial
-- pipeline. Mapping validated with the product owner (2026-08-10) — "in_progress"
-- had no reliable finer-grained meaning, mapped to DEVIS_EN_PREPARATION as the
-- least-arbitrary choice. Any row already holding a new-pipeline value (there
-- are none yet, this only ever runs once) is left untouched by the WHERE clause.
UPDATE "QuoteRequest" SET "status" = 'NOUVELLE' WHERE "status" = 'new';
UPDATE "QuoteRequest" SET "status" = 'A_CONTACTER' WHERE "status" = 'contacted';
UPDATE "QuoteRequest" SET "status" = 'DEVIS_EN_PREPARATION' WHERE "status" = 'in_progress';
UPDATE "QuoteRequest" SET "status" = 'TERMINE' WHERE "status" = 'completed';
UPDATE "QuoteRequest" SET "status" = 'ARCHIVE' WHERE "status" = 'archived';
