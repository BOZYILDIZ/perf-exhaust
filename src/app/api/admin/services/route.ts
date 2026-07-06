import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { isDbConfigured, getDb } from "@/lib/db";
import { serviceSchema, sanitizeStrings } from "@/lib/admin-validation";
import { revalidatePath } from "next/cache";

function guardOrigin(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).host === req.nextUrl.host;
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    if (!guardOrigin(req)) return NextResponse.json({ error: "Origine invalide" }, { status: 403 });
    if (!isDbConfigured()) {
      return NextResponse.json({ error: "Base de données non configurée (DATABASE_URL)." }, { status: 503 });
    }
    const parsed = serviceSchema.safeParse(sanitizeStrings(await req.json()));
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return NextResponse.json({ error: `${first.path.join(".")} : ${first.message}` }, { status: 400 });
    }
    const d = parsed.data;
    const db = getDb();
    const exists = await db.service.findUnique({ where: { slug: d.slug }, select: { id: true } });
    if (exists) return NextResponse.json({ error: "Ce slug existe déjà" }, { status: 409 });

    const created = await db.service.create({
      data: { ...d, seoTitle: d.seoTitle || null, seoDescription: d.seoDescription || null },
    });
    revalidatePath("/services");
    revalidatePath("/");
    return NextResponse.json({ success: true, id: created.id, slug: created.slug });
  } catch (error) {
    console.error("[API/admin/services POST]", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
