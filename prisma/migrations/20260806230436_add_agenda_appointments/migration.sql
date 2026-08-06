-- CreateTable
CREATE TABLE "Appointment" (
    "id" TEXT NOT NULL,
    "quoteRequestId" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerEmail" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "vehicle" TEXT NOT NULL,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "notes" TEXT NOT NULL DEFAULT '',
    "confirmationSentAt" TIMESTAMP(3),
    "reminderSentAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "cancelledBy" TEXT,
    "cancellationReason" TEXT,
    "cancellationTokenHash" TEXT,
    "cancellationTokenExpiresAt" TIMESTAMP(3),
    "cancellationRequestedAt" TIMESTAMP(3),
    "cancellationEmailSentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgendaSettings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "weeklyHours" JSONB NOT NULL DEFAULT '{}',
    "defaultDurationMinutes" INTEGER NOT NULL DEFAULT 60,
    "halfDayDurationMinutes" INTEGER NOT NULL DEFAULT 240,
    "fullDayDurationMinutes" INTEGER NOT NULL DEFAULT 480,
    "bufferMinutes" INTEGER NOT NULL DEFAULT 15,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgendaSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkshopClosure" (
    "id" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "reason" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkshopClosure_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Appointment_quoteRequestId_key" ON "Appointment"("quoteRequestId");

-- CreateIndex
CREATE UNIQUE INDEX "Appointment_cancellationTokenHash_key" ON "Appointment"("cancellationTokenHash");

-- CreateIndex
CREATE INDEX "Appointment_startAt_idx" ON "Appointment"("startAt");

-- CreateIndex
CREATE INDEX "Appointment_status_idx" ON "Appointment"("status");

-- CreateIndex
CREATE UNIQUE INDEX "WorkshopClosure_date_key" ON "WorkshopClosure"("date");

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_quoteRequestId_fkey" FOREIGN KEY ("quoteRequestId") REFERENCES "QuoteRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
