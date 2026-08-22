import {
  FileText, CreditCard, RefreshCw, FileSearch, CalendarPlus, CalendarClock, CalendarX,
  Car, Wrench, CheckCircle2, KeyRound, Mail, MailWarning, Star, Clock, PenLine,
} from "lucide-react";

export interface TimelineEvent {
  id: string;
  type: string;
  title: string;
  createdAt: string;
  actor: string | null;
}

const ICONS: Record<string, React.ElementType> = {
  QUOTE_REQUEST_CREATED: FileText,
  PENNYLANE_CUSTOMER_SYNCED: CreditCard,
  QUOTE_STATUS_CHANGED: RefreshCw,
  PENNYLANE_QUOTE_DETECTED: FileSearch,
  APPOINTMENT_CREATED: CalendarPlus,
  APPOINTMENT_RESCHEDULED: CalendarClock,
  APPOINTMENT_CANCELLED: CalendarX,
  VEHICLE_ARRIVED: Car,
  WORK_STARTED: Wrench,
  WORK_COMPLETED: CheckCircle2,
  VEHICLE_RETURNED: KeyRound,
  VEHICLE_READY_NOTIFICATION_SENT: Mail,
  VEHICLE_READY_NOTIFICATION_FAILED: MailWarning,
  WORKSHOP_STATUS_CORRECTED: PenLine,
  FOLLOWUP_SENT: Mail,
  REVIEW_REQUEST_SENT: Star,
};

/**
 * Timeline métier persistante — voir ActivityEvent (prisma/schema.prisma) et
 * src/lib/activity-events.ts. Purement de lecture : aucune action ici,
 * uniquement l'historique. Composant partagé, réutilisable sur la fiche
 * devis et (plus tard) la fiche client globale.
 */
export default function QuoteRequestTimeline({ events }: { events: TimelineEvent[] }) {
  if (events.length === 0) {
    return <p className="text-gray-600 text-sm italic">Aucun événement enregistré pour le moment.</p>;
  }

  return (
    <ol className="space-y-4">
      {events.map((e) => {
        const Icon = ICONS[e.type] ?? Clock;
        return (
          <li key={e.id} className="flex items-start gap-3">
            <div
              className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full mt-0.5"
              style={{ background: "rgba(18,102,234,0.1)", border: "1px solid rgba(18,102,234,0.2)" }}
              aria-hidden="true"
            >
              <Icon size={14} className="text-brand-400" />
            </div>
            <div className="min-w-0 flex-1 pt-1">
              <p className="text-gray-200 text-sm">{e.title}</p>
              <p className="text-gray-600 text-xs mt-0.5">
                {new Date(e.createdAt).toLocaleString("fr-FR", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                {e.actor === "customer" && " · client"}
                {e.actor === "system" && " · automatique"}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
