import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { projects, getProjectBySlug } from "@/data/projects";
import { ArrowLeft, ArrowRight, Car, Calendar, Wrench } from "lucide-react";

interface Props { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const project = getProjectBySlug(slug);
  if (!project) return { title: "Projet introuvable" };
  return {
    title: `${project.vehicule} — ${project.prestation}`,
    description: project.description,
  };
}

export default async function ProjectDetailPage({ params }: Props) {
  const { slug } = await params;
  const project = getProjectBySlug(slug);
  if (!project) notFound();

  const currentIndex = projects.findIndex((p) => p.slug === slug);
  const prev = currentIndex > 0 ? projects[currentIndex - 1] : null;
  const next = currentIndex < projects.length - 1 ? projects[currentIndex + 1] : null;

  return (
    <div className="pt-20" style={{ background: "#080808" }}>
      {/* Back */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <Link href="/realisations" className="inline-flex items-center gap-2 text-gray-500 hover:text-orange-400 transition-colors text-sm">
          <ArrowLeft size={14} /> Retour aux réalisations
        </Link>
      </div>

      {/* Hero */}
      <div className="max-w-7xl mx-auto px-6 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Image */}
          <div
            className="aspect-video flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #141414, #1a1a1a)", border: "1px solid #1e1e1e" }}
          >
            <div className="flex flex-col items-center gap-3 text-gray-600">
              <Car size={64} />
              <span className="text-sm font-medium">{project.vehicule}</span>
              <span className="text-xs text-gray-700">Photo à venir</span>
            </div>
          </div>

          {/* Info */}
          <div>
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="text-xs font-bold tracking-wider uppercase text-orange-400 px-3 py-1" style={{ background: "rgba(249,115,22,0.1)", border: "1px solid rgba(249,115,22,0.25)" }}>
                {project.sonoriteTag}
              </span>
              {project.tags.map((tag) => (
                <span key={tag} className="text-xs font-bold tracking-wider uppercase text-gray-400 px-3 py-1" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
                  {tag}
                </span>
              ))}
            </div>

            <h1 className="font-black text-white mb-2" style={{ fontFamily: "Oswald, sans-serif", fontSize: "clamp(2rem, 5vw, 3.5rem)", lineHeight: "1" }}>
              {project.vehicule}
            </h1>

            <div className="flex items-center gap-6 mb-6 text-sm text-gray-500">
              <div className="flex items-center gap-2"><Calendar size={14} />{project.annee}</div>
              <div className="flex items-center gap-2"><Wrench size={14} />{project.prestation}</div>
            </div>

            <p className="text-gray-300 text-base leading-relaxed mb-6">{project.descriptionComplete}</p>

            <div className="space-y-4">
              <InfoBlock title="Objectifs client" content={project.objectifsClient} />
              <InfoBlock title="Modifications réalisées" content={project.modificationsRealisees} />
              <InfoBlock title="Matériaux utilisés" content={project.materiaux} />
              <InfoBlock title="Résultat sonore" content={project.resultatSonore} accent />
            </div>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link
                href="/rendez-vous"
                className="flex-1 text-center py-4 text-sm font-bold tracking-widest uppercase text-black"
                style={{
                  background: "linear-gradient(135deg, #f97316, #ea580c)",
                  clipPath: "polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))",
                }}
              >
                Je veux un projet similaire
              </Link>
              <Link href="/contact" className="flex-1 text-center py-4 text-sm font-bold tracking-widest uppercase text-white border border-white/20 hover:border-orange-500 hover:text-orange-400 transition-all">
                Contacter l&apos;atelier
              </Link>
            </div>
          </div>
        </div>

        {/* Gallery avant/apres */}
        {project.images.length > 0 && (
          <div className="mt-12">
            <h2 className="text-xl font-black text-white mb-6" style={{ fontFamily: "Oswald, sans-serif" }}>Galerie</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {project.images.map((img, i) => (
                <div
                  key={i}
                  className="aspect-video flex flex-col items-center justify-center gap-2"
                  style={{ background: "linear-gradient(135deg, #141414, #1a1a1a)", border: "1px solid #1e1e1e" }}
                >
                  <Car size={32} className="text-gray-700" />
                  <span className="text-xs text-gray-600 capitalize">{img.type}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Navigation entre projets */}
      <div style={{ borderTop: "1px solid #141414" }}>
        <div className="max-w-7xl mx-auto px-6 py-8 flex items-center justify-between gap-4">
          {prev ? (
            <Link href={`/realisations/${prev.slug}`} className="flex items-center gap-3 text-gray-400 hover:text-orange-400 transition-colors group">
              <ArrowLeft size={16} />
              <div>
                <div className="text-xs text-gray-600 uppercase tracking-wider">Précédent</div>
                <div className="text-sm font-bold" style={{ fontFamily: "Oswald, sans-serif" }}>{prev.vehicule}</div>
              </div>
            </Link>
          ) : <div />}
          {next ? (
            <Link href={`/realisations/${next.slug}`} className="flex items-center gap-3 text-gray-400 hover:text-orange-400 transition-colors text-right group">
              <div>
                <div className="text-xs text-gray-600 uppercase tracking-wider">Suivant</div>
                <div className="text-sm font-bold" style={{ fontFamily: "Oswald, sans-serif" }}>{next.vehicule}</div>
              </div>
              <ArrowRight size={16} />
            </Link>
          ) : <div />}
        </div>
      </div>
    </div>
  );
}

function InfoBlock({ title, content, accent }: { title: string; content: string; accent?: boolean }) {
  return (
    <div className="p-4 border" style={{ background: accent ? "rgba(249,115,22,0.04)" : "#0f0f0f", borderColor: accent ? "rgba(249,115,22,0.2)" : "#1a1a1a" }}>
      <p className="text-xs font-bold tracking-widest uppercase mb-1" style={{ color: accent ? "#f97316" : "#6b7280" }}>{title}</p>
      <p className="text-gray-300 text-sm leading-relaxed">{content}</p>
    </div>
  );
}
