/*
  Phase E — lien Réalisation ↔ rendez-vous atelier ("Créer une réalisation à
  partir de ce RDV", voir src/lib/agenda/realisation-draft.ts).

  Fichier écrit à la main (mkdir + écriture directe), PAS via
  `prisma migrate dev` — règle absolue depuis l'incident de la Phase B/C.

  CETTE migration reste NON appliquée. Elle doit être jouée APRÈS les trois
  migrations précédentes (workshop_status_and_license_plate,
  vehicle_ready_notification_reliability, phase_d_automations), dans cet ordre.

  Objet : Project.sourceAppointmentId (nullable, unique) — au plus une
  réalisation par rendez-vous, onDelete SetNull (une réalisation déjà publiée
  survit à la suppression éventuelle du rendez-vous source).
*/
-- AlterTable
ALTER TABLE "Project" ADD COLUMN "sourceAppointmentId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Project_sourceAppointmentId_key" ON "Project"("sourceAppointmentId");

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_sourceAppointmentId_fkey" FOREIGN KEY ("sourceAppointmentId") REFERENCES "Appointment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
