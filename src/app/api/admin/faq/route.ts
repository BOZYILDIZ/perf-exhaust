import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { isDbConfigured, getDb } from "@/lib/db";
import { faqItemSchema, sanitizeStrings } from "@/lib/admin-validation";
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
    const parsed = faqItemSchema.safeParse(sanitizeStrings(await req.json()));
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return NextResponse.json({ error: `${first.path.join(".")} : ${first.message}` }, { status: 400 });
    }
    const d = parsed.data;
    const created = await getDb().fAQItem.create({
      data: { ...d, category: d.category || null },
    });
    revalidatePath("/");
    return NextResponse.json({ success: true, id: created.id });
  } catch (error) {
    console.error("[API/admin/faq POST]", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
