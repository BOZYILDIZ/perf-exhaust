import ServiceForm, { EMPTY_SERVICE } from "@/components/admin/ServiceForm";

export const dynamic = "force-dynamic";

export default function NewServicePage() {
  return (
    <div>
      <h1 className="text-2xl font-black text-white mb-8" style={{ fontFamily: "var(--font-oswald), sans-serif" }}>
        Nouveau service
      </h1>
      <ServiceForm initial={EMPTY_SERVICE} />
    </div>
  );
}
