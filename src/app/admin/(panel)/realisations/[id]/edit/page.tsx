import { notFound } from "next/navigation";
import { isDbConfigured, getDb } from "@/lib/db";
import ProjectForm, { type ProjectFormValues } from "@/components/admin/ProjectForm";

export const dynamic = "force-dynamic";

export default async function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  if (!isDbConfigured()) notFound();
  const { id } = await params;
  const p = await getDb().project.findUnique({ where: { id } });
  if (!p) notFound();

  const initial: ProjectFormValues = {
    slug: p.slug,
    status: p.status === "published" ? "published" : "draft",
    vehicule: p.vehicule,
    marque: p.marque,
    modele: p.modele,
    annee: p.annee,
    prestation: p.prestation,
    categorie: p.categorie ?? "",
    tags: Array.isArray(p.tags) ? (p.tags as string[]) : [],
    sonoriteTag: p.sonoriteTag,
    filterTags: Array.isArray(p.filterTags) ? (p.filterTags as string[]) : [],
    description: p.description,
    descriptionComplete: p.descriptionComplete,
    objectifsClient: p.objectifsClient,
    modificationsRealisees: p.modificationsRealisees,
    materiaux: p.materiaux,
    resultatSonore: p.resultatSonore,
    dureeProjet: p.dureeProjet ?? "",
    difficulte: p.difficulte ?? "",
    ctaCustom: p.ctaCustom ?? "",
    imagePrincipale: p.imagePrincipale ?? "",
    imageAlt: p.imageAlt ?? "",
    galerie: Array.isArray(p.galerie) ? (p.galerie as ProjectFormValues["galerie"]) : [],
    videoUrl: p.videoUrl ?? "",
    seoTitle: p.seoTitle ?? "",
    seoDescription: p.seoDescription ?? "",
    ogImage: p.ogImage ?? "",
    featured: p.featured,
    date: p.date,
    sortOrder: p.sortOrder,
  };

  return (
    <div>
      <h1 className="text-2xl font-black text-white mb-8" style={{ fontFamily: "var(--font-oswald), sans-serif" }}>
        Modifier — {p.vehicule}
      </h1>
      <ProjectForm initial={initial} projectId={p.id} blobConfigured={Boolean(process.env.BLOB_READ_WRITE_TOKEN)} />
    </div>
  );
}
