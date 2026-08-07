-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN     "reminder1hSentAt" TIMESTAMP(3),
ADD COLUMN     "reminder24hSentAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "AgendaBlock" (
    "id" TEXT NOT NULL,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "category" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "notes" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgendaBlock_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AgendaBlock_startAt_idx" ON "AgendaBlock"("startAt");
