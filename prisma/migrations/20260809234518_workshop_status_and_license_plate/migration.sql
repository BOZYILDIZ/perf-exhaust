/*
  Warnings:

  - You are about to drop the column `vehicleReadyNotificationSentAt` on the `QuoteRequest` table. All the data in the column will be lost.

  IMPORTANT — historique de cette migration (2026-08-10) :
  Ce fichier a été généré via `prisma migrate dev --create-only`, ce qui a eu
  un effet de bord non voulu : la commande a d'abord appliqué la migration
  PRÉCÉDENTE (20260809223347_workshop_pipeline_v1, jusque-là volontairement
  non appliquée) contre la base Neon partagée, avant de générer celle-ci.
  `--create-only` ne protège que la migration en cours de création, pas les
  migrations déjà en attente dans l'historique — comportement non anticipé.
  Le remapping de données de cette migration précédente (QuoteRequest.status:
  new→NOUVELLE, completed→TERMINE) a été corrigé manuellement (UPDATE ciblé,
  hors `prisma migrate`) pour restaurer la compatibilité avec le code alors
  déployé sur `main`. Les colonnes additives de cette migration précédente
  (Appointment.workshopStatus/photosAvant/photosApres, QuoteRequest.licensePlate/
  followupStage/lastFollowupSentAt/vehicleReadyNotificationSentAt/
  reviewRequestSentAt, les 7 champs SiteSettings, la table ActivityEvent)
  N'ONT PAS été retirées — voir le rapport de la Phase C pour le détail complet.

  CETTE migration-ci (workshop_status_and_license_plate) reste NON appliquée
  et ne doit pas l'être avant le merge/déploiement validé — `vehicleReadyNotificationSentAt`
  existe donc encore réellement dans Neon tant qu'elle n'aura pas été jouée.
*/
-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN     "licensePlate" TEXT,
ADD COLUMN     "vehicleReadyNotifiedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "QuoteRequest" DROP COLUMN "vehicleReadyNotificationSentAt";
