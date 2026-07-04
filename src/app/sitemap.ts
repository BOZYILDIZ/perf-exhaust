import { MetadataRoute } from "next";
import { getPublishedProjects } from "@/lib/projects-repo";

const BASE_URL = "https://perfexhaust.vercel.app";

// Le sitemap est « cached by default » (doc Next : metadata routes) et ignore
// revalidate/revalidatePath — force-dynamic garantit qu'il reflète toujours les
// publications/suppressions admin. Coût : une requête DB par crawl, négligeable.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const projects = await getPublishedProjects();
  const projectUrls = projects.map((p) => ({
    url: `${BASE_URL}/realisations/${p.slug}`,
    lastModified: new Date(p.date),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${BASE_URL}/realisations`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE_URL}/rendez-vous`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE_URL}/services`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/a-propos`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/contact`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    ...projectUrls,
  ];
}
