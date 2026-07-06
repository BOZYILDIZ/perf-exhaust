import FAQItemForm, { EMPTY_FAQ } from "@/components/admin/FAQItemForm";

export const dynamic = "force-dynamic";

export default function NewFAQPage() {
  return (
    <div>
      <h1 className="text-2xl font-black text-white mb-8" style={{ fontFamily: "var(--font-oswald), sans-serif" }}>
        Nouvelle question
      </h1>
      <FAQItemForm initial={EMPTY_FAQ} />
    </div>
  );
}
