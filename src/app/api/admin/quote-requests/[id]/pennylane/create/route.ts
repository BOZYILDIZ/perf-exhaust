import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { isDbConfigured, getDb } from "@/lib/db";
import { isPennylaneConfigured, createOrFindCustomer, createQuote, mapVatRateToPennylane } from "@/lib/pennylane/client";
import { PennylaneError } from "@/lib/pennylane/types";

type Ctx = { params: Promise<{ id: string }> };

function guardOrigin(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).host === req.nextUrl.host;
  } catch {
    return false;
  }
}

/**
 * Crée le devis Pennylane correspondant à une demande de devis — toujours
 * déclenché explicitement par un clic admin sur /admin/devis/[id], jamais
 * automatiquement à la réception du formulaire public (voir mission /
 * docs/MAINTENANCE.md § "Intégration Pennylane").
 */
export async function POST(req: NextRequest, ctx: Ctx) {
  try {
    if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    if (!guardOrigin(req)) return NextResponse.json({ error: "Origine invalide" }, { status: 403 });
    if (!isDbConfigured()) return NextResponse.json({ error: "Base de données non configurée (DATABASE_URL)." }, { status: 503 });
    if (!isPennylaneConfigured()) {
      return NextResponse.json({ error: "Pennylane non configuré (PENNYLANE_API_KEY absente)." }, { status: 503 });
    }

    const { id } = await ctx.params;
    const db = getDb();
    const quoteRequest = await db.quoteRequest.findUnique({
      where: { id },
      include: { lines: { orderBy: { sortOrder: "asc" } } },
    });
    if (!quoteRequest) return NextResponse.json({ error: "Demande introuvable" }, { status: 404 });

    // Garde-fous — reflètent exactement les mêmes règles que le bouton "Créer" côté UI.
    if (!quoteRequest.nom.trim() || !quoteRequest.prenom.trim()) {
      return NextResponse.json({ error: "Nom du client manquant." }, { status: 422 });
    }
    if (!quoteRequest.email.trim()) {
      return NextResponse.json({ error: "Email du client manquant." }, { status: 422 });
    }
    if (quoteRequest.lines.length === 0) {
      return NextResponse.json({ error: "Aucune ligne de devis — ajoutez au moins une ligne avant l'envoi." }, { status: 422 });
    }
    const missingPrice = quoteRequest.lines.some((l) => l.unitPriceCents <= 0);
    if (missingPrice) {
      return NextResponse.json({ error: "Toutes les lignes doivent avoir un prix unitaire renseigné avant l'envoi à Pennylane." }, { status: 422 });
    }

    try {
      // Le client Pennylane est mis en cache sur la demande pour qu'un nouvel essai après échec
      // du devis ne recrée pas un doublon de client.
      let customerId: number;
      if (quoteRequest.pennylaneCustomerId) {
        customerId = Number(quoteRequest.pennylaneCustomerId);
      } else {
        const { customer } = await createOrFindCustomer({
          name: `${quoteRequest.prenom} ${quoteRequest.nom}`,
          email: quoteRequest.email,
          phone: quoteRequest.telephone,
        });
        customerId = customer.id;
        await db.quoteRequest.update({ where: { id }, data: { pennylaneCustomerId: String(customerId) } });
      }

      const today = new Date();
      const deadline = new Date(today);
      deadline.setDate(deadline.getDate() + 30);
      const isoDate = (d: Date) => d.toISOString().slice(0, 10);

      const quote = await createQuote({
        date: isoDate(today),
        deadline: isoDate(deadline),
        customer_id: customerId,
        external_reference: quoteRequest.id,
        pdf_invoice_subject: `Devis — ${quoteRequest.marque} ${quoteRequest.modele}`,
        invoice_lines: quoteRequest.lines.map((line) => ({
          label: line.description,
          quantity: line.quantity,
          raw_currency_unit_price: (line.unitPriceCents / 100).toFixed(2),
          vat_rate: mapVatRateToPennylane(line.vatRate),
          unit: "unité",
        })),
      });

      const updated = await db.quoteRequest.update({
        where: { id },
        data: {
          pennylaneQuoteId: String(quote.id),
          pennylaneQuoteNumber: typeof quote.number === "string" ? quote.number : null,
          pennylaneQuoteUrl: typeof quote.public_url === "string" ? quote.public_url : (typeof quote.url === "string" ? quote.url : null),
          pennylaneSyncStatus: "draft",
          pennylaneSyncError: null,
          pennylaneSyncedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        pennylaneQuoteId: updated.pennylaneQuoteId,
        pennylaneQuoteNumber: updated.pennylaneQuoteNumber,
        pennylaneQuoteUrl: updated.pennylaneQuoteUrl,
        pennylaneSyncStatus: updated.pennylaneSyncStatus,
      });
    } catch (err) {
      const adminMessage = err instanceof PennylaneError ? err.toAdminMessage() : "Erreur inattendue lors de la communication avec Pennylane.";
      console.error("[API/admin/pennylane/create] Échec synchronisation Pennylane", {
        quoteRequestId: id,
        status: err instanceof PennylaneError ? err.status : undefined,
        code: err instanceof PennylaneError ? err.code : undefined,
      });
      await db.quoteRequest.update({
        where: { id },
        data: { pennylaneSyncStatus: "failed", pennylaneSyncError: adminMessage, pennylaneSyncedAt: new Date() },
      });
      return NextResponse.json({ success: false, error: adminMessage }, { status: 502 });
    }
  } catch (error) {
    console.error("[API/admin/pennylane/create]", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
