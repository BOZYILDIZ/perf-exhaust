import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { isDbConfigured } from "@/lib/db";
import { listWorkshopClosures, addWorkshopClosure } from "@/lib/agenda/settings";

function guardOrigin(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).host === req.nextUrl.host;
  } catch {
    return false;
  }
}

const bodySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reason: z.string().max(200).optional(),
});

export async function GET() {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  if (!isDbConfigured()) return NextResponse.json({ error: "Base de données non configurée (DATABASE_URL)." }, { status: 503 });
  const closures = await listWorkshopClosures();
  return NextResponse.json({ closures });
}

export async function POST(req: NextRequest) {
  try {
    if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    if (!guardOrigin(req)) return NextResponse.json({ error: "Origine invalide" }, { status: 403 });
    if (!isDbConfigured()) return NextResponse.json({ error: "Base de données non configurée (DATABASE_URL)." }, { status: 503 });

    const parsed = bodySchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "Données invalides" }, { status: 400 });

    await addWorkshopClosure(parsed.data.date, parsed.data.reason ?? "");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API/admin/agenda-closures POST]", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
