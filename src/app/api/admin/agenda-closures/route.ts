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
  label: z.string().min(1, "Nom / motif requis").max(200),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date de début invalide"),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date de fin invalide"),
  notes: z.string().max(2000).optional(),
}).refine((v) => v.endDate >= v.startDate, { message: "La date de fin doit être postérieure ou égale à la date de début", path: ["endDate"] });

export async function GET() {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  if (!isDbConfigured()) return NextResponse.json({ error: "Base de données non configurée (DATABASE_URL)." }, { status: 503 });
  const closures = await listWorkshopClosures();
  return NextResponse.json({ closures });
}

/** Crée une fermeture — une seule ligne pour toute la plage, jamais un enregistrement par jour (voir schema.prisma § WorkshopClosure). */
export async function POST(req: NextRequest) {
  try {
    if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    if (!guardOrigin(req)) return NextResponse.json({ error: "Origine invalide" }, { status: 403 });
    if (!isDbConfigured()) return NextResponse.json({ error: "Base de données non configurée (DATABASE_URL)." }, { status: 503 });

    const parsed = bodySchema.safeParse(await req.json());
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return NextResponse.json({ error: first.message }, { status: 400 });
    }

    const closure = await addWorkshopClosure(parsed.data);
    return NextResponse.json({ success: true, closure });
  } catch (error) {
    console.error("[API/admin/agenda-closures POST]", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
