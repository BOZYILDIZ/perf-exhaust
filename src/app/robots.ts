import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/_next/"],
      },
    ],
    sitemap: "https://perfexhaust.vercel.app/sitemap.xml",
    host: "https://perfexhaust.vercel.app",
  };
}
