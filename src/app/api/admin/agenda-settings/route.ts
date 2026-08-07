import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { isDbConfigured } from "@/lib/db";
import { getAgendaSettings, saveAgendaSettings } from "@/lib/agenda/settings";
import { WEEKDAY_KEYS } from "@/lib/agenda/types";

function guardOrigin(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).host === req.nextUrl.host;
  } catch {
    return false;
  }
}

const timeOrEmpty = z.union([z.string().regex(/^\d{2}:\d{2}$/), z.literal("")]);

const dayHoursSchema = z.object({
  enabled: z.boolean(),
  morningStart: timeOrEmpty,
  morningEnd: timeOrEmpty,
  afternoonStart: timeOrEmpty,
  afternoonEnd: timeOrEmpty,
});

const weeklyHoursSchema = z.object(
  Object.fromEntries(WEEKDAY_KEYS.map((k) => [k, dayHoursSchema])) as Record<(typeof WEEKDAY_KEYS)[number], typeof dayHoursSchema>
);

const bodySchema = z.object({
  weeklyHours: weeklyHoursSchema,
  defaultDurationMinutes: z.number().int().positive().max(24 * 60),
  halfDayDurationMinutes: z.number().int().positive().max(24 * 60),
  fullDayDurationMinutes: z.number().int().positive().max(24 * 60),
  bufferMinutes: z.number().int().min(0).max(240),
});

export async function GET() {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  if (!isDbConfigured()) return NextResponse.json({ error: "Base de données non configurée (DATABASE_URL)." }, { status: 503 });
  const settings = await getAgendaSettings();
  return NextResponse.json({ settings });
}

export async function PUT(req: NextRequest) {
  try {
    if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    if (!guardOrigin(req)) return NextResponse.json({ error: "Origine invalide" }, { status: 403 });
    if (!isDbConfigured()) return NextResponse.json({ error: "Base de données non configurée (DATABASE_URL)." }, { status: 503 });

    const parsed = bodySchema.safeParse(await req.json());
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return NextResponse.json({ error: `${first.path.join(".")} : ${first.message}` }, { status: 400 });
    }
    await saveAgendaSettings(parsed.data);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API/admin/agenda-settings PUT]", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
