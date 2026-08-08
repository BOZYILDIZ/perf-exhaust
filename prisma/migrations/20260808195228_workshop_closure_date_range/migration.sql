-- Migration sûre en 3 étapes : ajout additif (colonnes nullables), backfill
-- des données existantes (une ancienne fermeture d'un jour devient une
-- plage startDate=endDate=ancienne date, reason -> label), puis
-- durcissement des contraintes et suppression des anciennes colonnes.
-- Fonctionne que la table soit vide ou contienne des lignes réelles.

-- Étape 1 : colonnes additives, nullables pour l'instant
ALTER TABLE "WorkshopClosure" ADD COLUMN "label" TEXT;
ALTER TABLE "WorkshopClosure" ADD COLUMN "startDate" TEXT;
ALTER TABLE "WorkshopClosure" ADD COLUMN "endDate" TEXT;
ALTER TABLE "WorkshopClosure" ADD COLUMN "notes" TEXT NOT NULL DEFAULT '';
ALTER TABLE "WorkshopClosure" ADD COLUMN "updatedAt" TIMESTAMP(3);

-- Étape 2 : backfill des lignes existantes (compatibilité ascendante)
UPDATE "WorkshopClosure"
SET "label" = COALESCE("reason", ''),
    "startDate" = "date",
    "endDate" = "date",
    "updatedAt" = "createdAt";

-- Étape 3 : durcissement des contraintes maintenant que tout est renseigné
ALTER TABLE "WorkshopClosure" ALTER COLUMN "label" SET NOT NULL;
ALTER TABLE "WorkshopClosure" ALTER COLUMN "label" SET DEFAULT '';
ALTER TABLE "WorkshopClosure" ALTER COLUMN "startDate" SET NOT NULL;
ALTER TABLE "WorkshopClosure" ALTER COLUMN "endDate" SET NOT NULL;
ALTER TABLE "WorkshopClosure" ALTER COLUMN "updatedAt" SET NOT NULL;

-- Étape 4 : suppression de l'ancien index unique et des anciennes colonnes
DROP INDEX IF EXISTS "WorkshopClosure_date_key";
ALTER TABLE "WorkshopClosure" DROP COLUMN "date";
ALTER TABLE "WorkshopClosure" DROP COLUMN "reason";

-- Étape 5 : index pour les requêtes par plage
CREATE INDEX "WorkshopClosure_startDate_endDate_idx" ON "WorkshopClosure"("startDate", "endDate");
