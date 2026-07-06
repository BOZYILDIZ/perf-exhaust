import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { isDbConfigured } from "@/lib/db";
import { siteSettingsSchema, sanitizeStrings } from "@/lib/admin-validation";
import { saveSiteSettings } from "@/lib/settings-repo";
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

export async function PUT(req: NextRequest) {
  try {
    if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    if (!guardOrigin(req)) return NextResponse.json({ error: "Origine invalide" }, { status: 403 });
    if (!isDbConfigured()) {
      return NextResponse.json({ error: "Base de données non configurée (DATABASE_URL)." }, { status: 503 });
    }
    const parsed = siteSettingsSchema.safeParse(sanitizeStrings(await req.json()));
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return NextResponse.json({ error: `${first.path.join(".")} : ${first.message}` }, { status: 400 });
    }
    const d = parsed.data;
    await saveSiteSettings({
      businessName: d.businessName,
      phone: d.phone,
      email: d.email,
      address: d.address,
      postalCode: d.postalCode,
      city: d.city,
      instagramUrl: d.instagramUrl || "",
      tiktokUrl: d.tiktokUrl || "",
      googleReviewsUrl: d.googleReviewsUrl || "",
      shiftechUrl: d.shiftechUrl || "",
      openingHours: d.openingHours,
      legalForm: d.legalForm || "",
      siret: d.siret || "",
      publicationDirector: d.publicationDirector || "",
    });
    // Les paramètres sont lus par quasiment toutes les pages publiques (layout, contact, mentions légales...)
    revalidatePath("/", "layout");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API/admin/settings PUT]", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
