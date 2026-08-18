import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE } from "@/lib/admin-auth";

function guardOrigin(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).host === req.nextUrl.host;
  } catch {
    return false;
  }
}

/** Pas d'isAdminAuthenticated ici (le logout doit fonctionner même sur une session déjà expirée) — mais guardOrigin() reste nécessaire pour éviter un logout forcé cross-site (CSRF). */
export async function POST(req: NextRequest) {
  if (!guardOrigin(req)) return NextResponse.json({ error: "Origine invalide" }, { status: 403 });
  const res = NextResponse.json({ success: true });
  res.cookies.set(ADMIN_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
  return res;
}
