import { notFound } from "next/navigation";
import { isDbConfigured, getDb } from "@/lib/db";
import ServiceForm, { type ServiceFormValues } from "@/components/admin/ServiceForm";

export const dynamic = "force-dynamic";

export default async function EditServicePage({ params }: { params: Promise<{ id: string }> }) {
  if (!isDbConfigured()) notFound();
  const { id } = await params;
  const s = await getDb().service.findUnique({ where: { id } });
  if (!s) notFound();

  const initial: ServiceFormValues = {
    title: s.title,
    slug: s.slug,
    shortDescription: s.shortDescription,
    longDescription: s.longDescription,
    icon: s.icon,
    status: s.status === "published" ? "published" : "draft",
    sortOrder: s.sortOrder,
    seoTitle: s.seoTitle ?? "",
    seoDescription: s.seoDescription ?? "",
  };

  return (
    <div>
      <h1 className="text-2xl font-black text-white mb-8" style={{ fontFamily: "var(--font-oswald), sans-serif" }}>
        Modifier — {s.title}
      </h1>
      <ServiceForm initial={initial} serviceId={s.id} />
    </div>
  );
}
