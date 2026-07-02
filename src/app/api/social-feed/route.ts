import { NextResponse } from "next/server";
import { SOCIAL_LINKS, featuredPosts } from "@/data/social";

export const revalidate = 3600;

/**
 * Expose la configuration sociale manuelle (aucun scraping, aucune API tierce).
 * `featuredPosts` est alimenté à la main dans src/data/social.ts.
 * Point d'extension futur : brancher ici les APIs officielles Instagram/TikTok
 * (voir docs/PRODUCTION_CHECKLIST.md).
 */
export async function GET() {
  return NextResponse.json({
    profiles: SOCIAL_LINKS,
    posts: featuredPosts,
    source: "manual",
  });
}
