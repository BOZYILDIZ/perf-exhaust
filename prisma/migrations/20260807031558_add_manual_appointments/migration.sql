-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN     "customerAddress" TEXT,
ADD COLUMN     "motorisation" TEXT,
ADD COLUMN     "pennylaneCustomerId" TEXT,
ADD COLUMN     "pennylaneCustomerType" TEXT,
ADD COLUMN     "rearDiffuser" TEXT,
ADD COLUMN     "vehicleNotes" TEXT NOT NULL DEFAULT '',
ALTER COLUMN "quoteRequestId" DROP NOT NULL,
ALTER COLUMN "customerEmail" DROP NOT NULL;
