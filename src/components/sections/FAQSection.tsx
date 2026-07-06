import { getPublishedFAQs } from "@/lib/faq-repo";
import FAQAccordion from "@/components/sections/FAQAccordion";

// Schema FAQPage généré depuis les mêmes questions que celles affichées : le
// contenu structuré reste toujours identique au contenu visible (exigence Google).
export default async function FAQSection() {
  const faqs = await getPublishedFAQs();
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };

  return (
    <section className="py-24" style={{ background: "#080808" }} aria-label="Foire aux questions">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <div className="max-w-4xl mx-auto px-6">
        <div className="mb-16 text-center">
          <div className="text-xs font-bold tracking-widest uppercase text-brand-400 mb-4">FAQ</div>
          <h2 className="font-oswald text-4xl md:text-5xl font-bold text-white uppercase tracking-wider mb-4">
            Questions fréquentes
          </h2>
          <p className="text-white/50 max-w-xl mx-auto">
            Tout ce que vous devez savoir sur la fabrication d&apos;échappements sur mesure en Alsace.
          </p>
        </div>

        <FAQAccordion items={faqs} />

        <div className="mt-12 text-center">
          <p className="text-white/40 mb-4">Vous ne trouvez pas la réponse à votre question ?</p>
          <a href="/contact" className="inline-flex items-center gap-2 text-sm font-bold tracking-widest uppercase text-brand-400 hover:text-brand-300 transition-colors">
            Contactez-nous directement →
          </a>
        </div>
      </div>
    </section>
  );
}
