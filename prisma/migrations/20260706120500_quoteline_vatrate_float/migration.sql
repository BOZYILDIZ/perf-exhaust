-- QuoteLine.vatRate doit accepter les taux français non entiers (5.5 %, 2.1 %) en plus de 20/10/0.
ALTER TABLE "QuoteLine" ALTER COLUMN "vatRate" DROP DEFAULT;
ALTER TABLE "QuoteLine" ALTER COLUMN "vatRate" TYPE DOUBLE PRECISION;
ALTER TABLE "QuoteLine" ALTER COLUMN "vatRate" SET DEFAULT 20;
