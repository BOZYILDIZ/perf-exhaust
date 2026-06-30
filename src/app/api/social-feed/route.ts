import { NextResponse } from "next/server";
import { fetchSocialFeed } from "@/data/social-mock";

export const revalidate = 3600;

export async function GET() {
  try {
    const posts = await fetchSocialFeed();
    return NextResponse.json({ posts, source: "mock" });
  } catch {
    return NextResponse.json({ posts: [], error: "Feed unavailable" }, { status: 200 });
  }
}
