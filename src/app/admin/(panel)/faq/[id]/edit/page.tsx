import { notFound } from "next/navigation";
import { isDbConfigured, getDb } from "@/lib/db";
import FAQItemForm, { type FAQItemFormValues } from "@/components/admin/FAQItemForm";

export const dynamic = "force-dynamic";

export default async function EditFAQPage({ params }: { params: Promise<{ id: string }> }) {
  if (!isDbConfigured()) notFound();
  const { id } = await params;
  const f = await getDb().fAQItem.findUnique({ where: { id } });
  if (!f) notFound();

  const initial: FAQItemFormValues = {
    question: f.question,
    answer: f.answer,
    category: f.category ?? "",
    status: f.status === "published" ? "published" : "draft",
    sortOrder: f.sortOrder,
  };

  return (
    <div>
      <h1 className="text-2xl font-black text-white mb-8" style={{ fontFamily: "var(--font-oswald), sans-serif" }}>
        Modifier la question
      </h1>
      <FAQItemForm initial={initial} faqId={f.id} />
    </div>
  );
}
