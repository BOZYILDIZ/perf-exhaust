/*
  Phase D — automatisations commerciales (rappels, relances, avis Google).

  Fichier écrit à la main (mkdir + écriture directe), PAS via
  `prisma migrate dev` — règle absolue depuis l'incident de la Phase B/C.

  CETTE migration reste NON appliquée. Elle doit être jouée APRÈS les deux
  migrations précédentes (20260809234518_workshop_status_and_license_plate,
  20260810091500_vehicle_ready_notification_reliability), dans cet ordre.

  Objet :
   - QuoteRequest.reviewRequestSentAt (Phase B) est déplacé vers
     Appointment.reviewRequestSentAt, pour fonctionner aussi sur un RDV
     manuel (même raisonnement que vehicleReadyNotifiedAt en Phase C).
   - QuoteRequest.quoteSentAt : nouvel horodatage du passage à DEVIS_ENVOYE,
     base de calcul des relances commerciales (src/lib/quote-followup.ts).
   - Appointment.vehicleReturnedAt : nouvel horodatage du passage à RESTITUE,
     base de calcul du délai avant demande d'avis (src/lib/agenda/review-request.ts).
*/
-- AlterTable
ALTER TABLE "QuoteRequest" DROP COLUMN "reviewRequestSentAt",
ADD COLUMN     "quoteSentAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN     "vehicleReturnedAt" TIMESTAMP(3),
ADD COLUMN     "reviewRequestSentAt" TIMESTAMP(3);
