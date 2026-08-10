/*
  Correctif fiabilité — notification client "véhicule prêt" (2026-08-10).

  Fichier écrit à la main (mkdir + écriture directe), PAS via
  `prisma migrate dev` — règle absolue depuis l'incident de la Phase B/C
  (voir 20260809234518_workshop_status_and_license_plate/migration.sql) :
  aucune commande `prisma migrate dev/deploy` contre la base Neon partagée.

  CETTE migration reste NON appliquée, comme la précédente
  (20260809234518_workshop_status_and_license_plate), qui doit être jouée
  AVANT celle-ci (elle crée Appointment.vehicleReadyNotifiedAt, que cette
  migration ne fait que compléter).

  Objet : sépare la "réservation d'un essai d'envoi" de la "confirmation d'un
  envoi réellement réussi", pour permettre un nouvel essai après un échec
  Resend sans jamais risquer un double envoi (voir
  src/lib/agenda/workshop-actions.ts § attemptVehicleReadyNotification et
  src/lib/agenda/workshop-status.ts § canAttemptVehicleReadyNotification).
*/
-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN     "vehicleReadyNotificationInProgress" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "vehicleReadyNotificationLastAttemptAt" TIMESTAMP(3),
ADD COLUMN     "vehicleReadyNotificationLastError" TEXT;
