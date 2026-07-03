import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyCredentials, createSessionToken, sessionCookieOptions, ADMIN_COOKIE, isAdminConfigured } from "@/lib/admin-auth";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const schema = z.object({ email: z.string().email(), password: z.string().min(1) });

export async function POST(req: NextRequest) {
  try {
    if (!isAdminConfigured()) {
      return NextResponse.json(
        { error: "Admin non configuré : définissez ADMIN_EMAIL, ADMIN_PASSWORD et ADMIN_SECRET." },
        { status: 503 }
      );
    }
    // Rate-limit dédié au login : 5 tentatives / minute / IP
    if (!checkRateLimit(`login:${getClientIp(req)}`, 5, 60_000)) {
      return NextResponse.json({ error: "Trop de tentatives. Réessayez dans une minute." }, { status: 429 });
    }
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Identifiants invalides" }, { status: 400 });
    }
    if (!verifyCredentials(parsed.data.email, parsed.data.password)) {
      return NextResponse.json({ error: "Email ou mot de passe incorrect" }, { status: 401 });
    }
    const res = NextResponse.json({ success: true });
    res.cookies.set(ADMIN_COOKIE, createSessionToken(), sessionCookieOptions());
    return res;
  } catch (error) {
    console.error("[API/admin/login]", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
