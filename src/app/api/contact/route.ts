import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Resend } from "resend";

const schema = z.object({
  nom: z.string().min(2),
  email: z.string().email(),
  sujet: z.string().min(2),
  message: z.string().min(10),
});

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Données invalides" }, { status: 400 });
    }
    const { nom, email, sujet, message } = parsed.data;

    if (resend) {
      await resend.emails.send({
        from: "PERF'EXHAUST <noreply@perfexhaust.fr>",
        to: process.env.BUSINESS_EMAIL || "contact@perfexhaust.fr",
        subject: `Message contact — ${sujet}`,
        html: `<p><strong>De:</strong> ${nom} (${email})</p><p><strong>Sujet:</strong> ${sujet}</p><p>${message}</p>`,
      });
    } else {
      console.log("[EMAIL MOCK] Contact:", { nom, email, sujet, message });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
