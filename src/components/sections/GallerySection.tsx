import Link from "next/link";
import { projects } from "@/data/projects";
import SectionTitle from "@/components/ui/SectionTitle";
import ProjectCard from "@/components/ui/ProjectCard";
import { ArrowRight } from "lucide-react";

const featured = projects.filter((p) => p.featured).slice(0, 6);

export default function GallerySection() {
  return (
    <section className="py-24" style={{ background: "#080808" }}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-16">
          <SectionTitle
            label="Nos réalisations"
            title="Projets<br/>récents"
            subtitle="15 projets showcasés. Chaque véhicule, un son unique fabriqué sur mesure dans notre atelier."
          />
          <Link
            href="/realisations"
            className="inline-flex items-center gap-2 text-sm font-bold tracking-widest uppercase text-brand-400 hover:text-brand-300 transition-colors flex-shrink-0"
          >
            Voir tout <ArrowRight size={14} />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {featured.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/realisations"
            className="inline-flex items-center gap-3 px-8 py-4 text-sm font-bold tracking-widest uppercase text-white border border-white/20 hover:border-brand-500 hover:text-brand-400 transition-all hover:-translate-y-0.5"
          >
            Voir les 15 réalisations <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </section>
  );
}
