import Link from "next/link";
import { Plus, FileText, Eye, PencilLine, Database, CheckSquare, Square } from "lucide-react";
import { isDbConfigured, getDb } from "@/lib/db";
import { featuredPosts } from "@/data/social";

export const dynamic = "force-dynamic";

function StatCard({ label, value, accent, href }: { label: string; value: number | string; accent?: boolean; href?: string }) {
  const isNumeric = typeof value === "number";
  const content = (
    <div
      className="p-5 border h-full overflow-hidden"
      style={{
        background: accent ? "rgba(18,102,234,0.06)" : "#0f0f0f",
        borderColor: accent ? "rgba(18,102,234,0.3)" : "#1e1e1e",
      }}
    >
      <div
        className={`font-black text-white truncate ${isNumeric ? "text-3xl" : "text-lg"}`}
        style={{ fontFamily: "var(--font-oswald), sans-serif" }}
      >
        {value}
      </div>
      <div className="text-gray-500 text-xs uppercase tracking-wider mt-1">{label}</div>
    </div>
  );
  return href ? <Link href={href} className="block hover:-translate-y-0.5 transition-transform">{content}</Link> : content;
}

export default async function AdminDashboard() {
  if (!isDbConfigured()) {
    return (
      <div>
        <h1 className="text-2xl font-black text-white mb-6" style={{ fontFamily: "var(--font-oswald), sans-serif" }}>Dashboard</h1>
        <div className="p-6 border border-brand-500/30 bg-brand-500/5 max-w-2xl">
          <div className="flex items-start gap-3">
            <Database size={20} className="text-brand-400 flex-shrink-0 mt-0.5" />
            <div>
              <h2 className="text-white font-bold mb-2">Base de données non configurée</h2>
              <p className="text-gray-400 text-sm leading-relaxed">
                Le site public fonctionne actuellement sur les données statiques
                (<code className="text-brand-400">src/data/projects.ts</code>). Pour activer la gestion des
                réalisations depuis cet admin&nbsp;: définissez <code className="text-brand-400">DATABASE_URL</code>{" "}
                (PostgreSQL — Neon ou Vercel Postgres), lancez{" "}
                <code className="text-brand-400">npx prisma migrate deploy</code> puis{" "}
                <code className="text-brand-400">npm run db:seed</code> pour importer les 15 réalisations
                existantes. Voir <code className="text-brand-400">docs/MAINTENANCE.md</code>.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const db = getDb();
  const [
    published, drafts, latest,
    newQuotes, contactedQuotes, inProgressQuotes, completedQuotesCount, totalQuotes,
    publishedServices, publishedFaqs,
    lastProject, lastService, lastFaq, lastQuote, settingsRow,
    projectsWithRealImage,
  ] = await Promise.all([
    db.project.count({ where: { status: "published" } }),
    db.project.count({ where: { status: "draft" } }),
    db.project.findMany({
      orderBy: { updatedAt: "desc" },
      take: 6,
      select: { id: true, slug: true, vehicule: true, prestation: true, status: true, updatedAt: true },
    }),
    db.quoteRequest.count({ where: { status: "new" } }),
    db.quoteRequest.count({ where: { status: "contacted" } }),
    db.quoteRequest.count({ where: { status: "in_progress" } }),
    db.quoteRequest.count({ where: { status: "completed" } }),
    db.quoteRequest.count(),
    db.service.count({ where: { status: "published" } }),
    db.fAQItem.count({ where: { status: "published" } }),
    db.project.findFirst({ orderBy: { updatedAt: "desc" }, select: { updatedAt: true } }),
    db.service.findFirst({ orderBy: { updatedAt: "desc" }, select: { updatedAt: true } }),
    db.fAQItem.findFirst({ orderBy: { updatedAt: "desc" }, select: { updatedAt: true } }),
    db.quoteRequest.findFirst({ orderBy: { updatedAt: "desc" }, select: { updatedAt: true } }),
    db.siteSettings.findUnique({ where: { id: "singleton" } }),
    db.project.findFirst({ where: { imagePrincipale: { not: null } }, select: { id: true } }),
  ]);

  const inProgressTotal = contactedQuotes + inProgressQuotes;
  const lastModified = [lastProject?.updatedAt, lastService?.updatedAt, lastFaq?.updatedAt, lastQuote?.updatedAt]
    .filter((d): d is Date => Boolean(d))
    .sort((a, b) => b.getTime() - a.getTime())[0];

  const checklist = [
    { label: "Ajouter les vraies photos des réalisations", done: Boolean(projectsWithRealImage) },
    { label: "Configurer Vercel Blob (upload d'images)", done: Boolean(process.env.BLOB_READ_WRITE_TOKEN) },
    { label: "Ajouter le lien des avis Google", done: Boolean(settingsRow?.googleReviewsUrl) },
    { label: "Vérifier les mentions légales (SIRET, forme juridique, responsable de publication)", done: Boolean(settingsRow?.siret && settingsRow?.legalForm && settingsRow?.publicationDirector) },
    { label: "Ajouter des posts sociaux (Instagram / TikTok)", done: featuredPosts.length > 0 },
    { label: "Tester le formulaire de demande de devis en conditions réelles", done: totalQuotes > 0 },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <h1 className="text-2xl font-black text-white" style={{ fontFamily: "var(--font-oswald), sans-serif" }}>Dashboard</h1>
        <Link
          href="/admin/realisations/new"
          className="inline-flex items-center gap-2 px-5 py-3 text-xs font-bold tracking-widest uppercase text-white"
          style={{ background: "linear-gradient(135deg, #1266ea, #0d54c8)" }}
        >
          <Plus size={14} /> Ajouter une réalisation
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
        <StatCard label="Réalisations publiées" value={published} accent href="/admin/realisations" />
        <StatCard label="Brouillons" value={drafts} href="/admin/realisations" />
        <StatCard label="Nouvelles demandes" value={newQuotes} accent={newQuotes > 0} href="/admin/devis" />
        <StatCard label="Devis en cours" value={inProgressTotal} href="/admin/devis" />
        <StatCard label="Devis terminés" value={completedQuotesCount} href="/admin/devis" />
        <StatCard label="Services publiés" value={publishedServices} href="/admin/services" />
        <StatCard label="FAQ publiée" value={publishedFaqs} href="/admin/faq" />
        <StatCard
          label="Dernière modification"
          value={lastModified ? lastModified.toLocaleDateString("fr-FR") : "—"}
        />
      </div>

      <h2 className="text-white font-bold text-sm tracking-widest uppercase mb-4">Dernières modifications</h2>
      <div className="border" style={{ borderColor: "#1e1e1e" }}>
        {latest.length === 0 && (
          <p className="p-5 text-gray-500 text-sm">
            Aucune réalisation en base. Lancez <code className="text-brand-400">npm run db:seed</code> pour importer
            les 15 réalisations existantes, ou créez-en une.
          </p>
        )}
        {latest.map((p, i) => (
          <div
            key={p.id}
            className="flex flex-wrap items-center gap-3 px-4 py-3"
            style={{ background: i % 2 ? "#0d0d0d" : "#0f0f0f", borderTop: i ? "1px solid #1a1a1a" : "none" }}
          >
            <FileText size={15} className="text-gray-600 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <span className="text-white text-sm font-medium">{p.vehicule}</span>
              <span className="text-gray-600 text-xs ml-2">{p.prestation}</span>
            </div>
            <span
              className={`text-xs font-bold px-2 py-0.5 uppercase tracking-wider ${
                p.status === "published" ? "text-green-400 bg-green-500/10" : "text-yellow-400 bg-yellow-500/10"
              }`}
            >
              {p.status === "published" ? "Publié" : "Brouillon"}
            </span>
            <span className="text-gray-600 text-xs hidden sm:block">
              {p.updatedAt.toLocaleDateString("fr-FR")}
            </span>
            <Link href={`/admin/realisations/${p.id}/edit`} className="text-brand-400 hover:text-brand-300 p-1" aria-label={`Modifier ${p.vehicule}`}>
              <PencilLine size={15} />
            </Link>
            <a href={`/realisations/${p.slug}`} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-white p-1" aria-label={`Voir ${p.vehicule} sur le site`}>
              <Eye size={15} />
            </a>
          </div>
        ))}
      </div>

      <h2 className="text-white font-bold text-sm tracking-widest uppercase mb-4 mt-10">À faire avant livraison finale</h2>
      <div className="border max-w-2xl" style={{ borderColor: "#1e1e1e" }}>
        {checklist.map((item, i) => (
          <div
            key={item.label}
            className="flex items-center gap-3 px-4 py-3"
            style={{ background: i % 2 ? "#0d0d0d" : "#0f0f0f", borderTop: i ? "1px solid #1a1a1a" : "none" }}
          >
            {item.done ? (
              <CheckSquare size={16} className="text-green-400 flex-shrink-0" aria-hidden="true" />
            ) : (
              <Square size={16} className="text-gray-600 flex-shrink-0" aria-hidden="true" />
            )}
            <span className={`text-sm ${item.done ? "text-gray-500 line-through" : "text-gray-300"}`}>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
