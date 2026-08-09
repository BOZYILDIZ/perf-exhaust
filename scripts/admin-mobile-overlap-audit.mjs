// Audit de non-régression : détecte les chevauchements réels entre éléments
// interactifs visibles (button, a, input, select, textarea, [role="button"])
// et tout élément fixed/sticky (bottom nav, barres d'action, drawers, modales)
// sur les pages admin, à plusieurs largeurs mobile/tablette.
//
// Usage : node scripts/admin-mobile-overlap-audit.mjs
// Prérequis : serveur dev lancé (npm run dev), ADMIN_EMAIL/ADMIN_PASSWORD dans .env.local.
//
// Ce script distingue :
//  - un chevauchement cosmétique (quelques px, ombre/outline) → ignoré ;
//  - un chevauchement "bloquant" : le centre de l'élément gêné est capturé
//    par un AUTRE élément lors d'un elementFromPoint (clic réellement volé) ;
//  - un chevauchement "dégradé" : le centre reste correct, mais une part
//    significative (>25% de sa surface) de l'élément est recouverte —
//    toujours un vrai problème d'usage, moins radical qu'un vol de clic total.
//
// Simule aussi le pire cas de safe-area iOS (34px) en réécrivant
// --admin-safe-area-bottom via une feuille de style injectée, puisque
// Chromium headless résout toujours env(safe-area-inset-bottom) à 0.

import { chromium } from "playwright";
import fs from "node:fs";

const envText = fs.readFileSync(".env.local", "utf8");
const env = {};
for (const line of envText.split("\n")) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}

const BASE = process.env.AUDIT_BASE_URL || "http://localhost:3000";
const VIEWPORTS = [320, 360, 375, 390, 430, 768, 1024];
// Les seuils cosmétique/dégradé sont définis dans collectOverlaps() ci-dessous
// (dupliqués en dur là-bas : cette fonction s'exécute dans le navigateur via
// page.evaluate, sans fermeture possible sur ces constantes côté Node).

function ids(o) {
  return o;
}

const PAGES = (realIds) => [
  "/admin",
  "/admin/agenda",
  "/admin/devis",
  `/admin/devis/${realIds.quote}`,
  "/admin/realisations",
  "/admin/realisations/new",
  `/admin/realisations/${realIds.project}/edit`,
  "/admin/services",
  "/admin/services/new",
  `/admin/services/${realIds.service}/edit`,
  "/admin/faq",
  "/admin/faq/new",
  `/admin/faq/${realIds.faq}/edit`,
  "/admin/settings",
];

async function getRealIds() {
  const { PrismaClient } = await import("@prisma/client");
  const { PrismaPg } = await import("@prisma/adapter-pg");
  const prisma = new PrismaClient({ adapter: new PrismaPg(env.DATABASE_URL) });
  const [quote, service, project, faq] = await Promise.all([
    prisma.quoteRequest.findFirst({ orderBy: { createdAt: "desc" }, select: { id: true } }),
    prisma.service.findFirst({ select: { id: true } }),
    prisma.project.findFirst({ select: { id: true } }),
    prisma.fAQItem.findFirst({ select: { id: true } }),
  ]);
  await prisma.$disconnect();
  return ids({ quote: quote?.id, service: service?.id, project: project?.id, faq: faq?.id });
}

/** Exécuté dans la page (via page.evaluate) — aucune fermeture sur le module Node,
 *  donc les deux seuils sont redéfinis en dur ici (doivent rester synchronisés
 *  avec COSMETIC_PX_THRESHOLD / DEGRADED_AREA_RATIO ci-dessus). */
function collectOverlaps() {
  const COSMETIC_PX_THRESHOLD = 3;
  const DEGRADED_AREA_RATIO = 0.25;
  const SELECTOR = 'button, a, input, select, textarea, [role="button"]';
  const isVisible = (el) => {
    const r = el.getBoundingClientRect();
    if (r.width <= 0 || r.height <= 0) return false;
    const cs = getComputedStyle(el);
    if (cs.visibility === "hidden" || cs.display === "none" || Number(cs.opacity) === 0) return false;
    return true;
  };
  const isFixedContext = (el) => {
    let node = el;
    while (node && node !== document.body) {
      const pos = getComputedStyle(node).position;
      if (pos === "fixed" || pos === "sticky") return true;
      node = node.parentElement;
    }
    return false;
  };

  const all = [...document.querySelectorAll(SELECTOR)].filter(isVisible);
  const withMeta = all.map((el) => ({
    el,
    rect: el.getBoundingClientRect(),
    fixed: isFixedContext(el),
    label: (el.getAttribute("aria-label") || el.textContent || el.getAttribute("placeholder") || el.tagName).trim().slice(0, 50),
    tag: el.tagName,
  }));

  const findings = [];
  for (let i = 0; i < withMeta.length; i++) {
    for (let j = i + 1; j < withMeta.length; j++) {
      const a = withMeta[i];
      const b = withMeta[j];
      if (!a.fixed && !b.fixed) continue; // on ne s'intéresse qu'aux recouvrements impliquant un élément fixed/sticky
      if (a.el.contains(b.el) || b.el.contains(a.el)) continue; // parent/enfant, pas un vrai conflit

      const ox1 = Math.max(a.rect.left, b.rect.left);
      const ox2 = Math.min(a.rect.right, b.rect.right);
      const oy1 = Math.max(a.rect.top, b.rect.top);
      const oy2 = Math.min(a.rect.bottom, b.rect.bottom);
      const ow = ox2 - ox1;
      const oh = oy2 - oy1;
      if (ow <= COSMETIC_PX_THRESHOLD || oh <= COSMETIC_PX_THRESHOLD) continue;

      const overlapArea = ow * oh;
      const areaA = a.rect.width * a.rect.height;
      const areaB = b.rect.width * b.rect.height;
      const ratio = overlapArea / Math.min(areaA, areaB);

      const centerA = { x: a.rect.left + a.rect.width / 2, y: a.rect.top + a.rect.height / 2 };
      const centerB = { x: b.rect.left + b.rect.width / 2, y: b.rect.top + b.rect.height / 2 };
      // elementFromPoint renvoie null hors viewport — un centre hors écran n'est
      // "bloqué par rien", juste pas encore scrollé en vue : à ignorer ici, sous
      // peine de faux positifs massifs sur toute page plus haute qu'un écran.
      const inViewport = (p) => p.x >= 0 && p.x < window.innerWidth && p.y >= 0 && p.y < window.innerHeight;
      if (!inViewport(centerA) || !inViewport(centerB)) continue;
      const hitAtA = document.elementFromPoint(centerA.x, centerA.y);
      const hitAtB = document.elementFromPoint(centerB.x, centerB.y);
      const aBlocked = !(hitAtA === a.el || a.el.contains(hitAtA));
      const bBlocked = !(hitAtB === b.el || b.el.contains(hitAtB));

      let severity = "cosmetic";
      if (aBlocked || bBlocked) severity = "blocking";
      else if (ratio > DEGRADED_AREA_RATIO) severity = "degraded";
      else continue; // recouvrement réel mais mineur (<25%, centres non volés) — pas remonté

      findings.push({
        severity,
        a: { label: a.label, tag: a.tag, fixed: a.fixed, rect: a.rect },
        b: { label: b.label, tag: b.tag, fixed: b.fixed, rect: b.rect },
        overlapWidth: ow,
        overlapHeight: oh,
        overlapRatio: Math.round(ratio * 100),
        aBlocked,
        bBlocked,
      });
    }
  }
  return findings;
}

async function auditPage(page, url, viewport, safeArea) {
  await page.goto(`${BASE}${url}`, { waitUntil: "networkidle" });
  await page.addStyleTag({ content: `:root{--admin-safe-area-bottom:${safeArea}px}` });
  await page.waitForTimeout(250);

  const results = [];
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
  const isScrollable = await page.evaluate(() => document.documentElement.scrollHeight > window.innerHeight + 1);

  if (!isScrollable) {
    // Page courte : le seul état de repos pertinent est le haut (= la totalité
    // de la page). Sur une page plus haute que l'écran, vérifier "en haut" est
    // un faux problème : du contenu visible à moitié au pli n'est pas un bug,
    // c'est juste ce qu'on n'a pas encore fini de faire défiler.
    const findingsTop = await page.evaluate(collectOverlaps);
    results.push({ scroll: "top (page non scrollable)", findings: findingsTop });
  } else {
    // Pire cas réel et seul état de repos pertinent pour une page scrollable :
    // l'utilisateur a défilé aussi loin que possible.
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await page.waitForTimeout(200);
    const findingsBottom = await page.evaluate(collectOverlaps);
    results.push({ scroll: "bottom (page scrollable)", findings: findingsBottom });
  }

  return { overflow, results };
}

async function main() {
  const realIds = await getRealIds();
  const pages = PAGES(realIds);

  const browser = await chromium.launch();
  const loginCtx = await browser.newContext({ viewport: { width: 390, height: 800 } });
  const loginPage = await loginCtx.newPage();
  await loginPage.goto(`${BASE}/admin/login`, { waitUntil: "networkidle" });
  await loginPage.fill("#admin-email", env.ADMIN_EMAIL);
  await loginPage.fill("#admin-password", env.ADMIN_PASSWORD);
  await Promise.all([
    loginPage.waitForResponse((r) => r.url().includes("/api/admin/login")),
    loginPage.click('button[type="submit"]'),
  ]);
  await loginPage.waitForURL(`${BASE}/admin`, { timeout: 10000 }).catch(() => {});
  const storageState = await loginCtx.storageState();
  await loginCtx.close();

  const allFindings = [];
  let totalChecks = 0;

  for (const width of VIEWPORTS) {
    const context = await browser.newContext({ viewport: { width, height: 800 }, storageState });
    const page = await context.newPage();

    for (const url of pages) {
      for (const safeArea of [0, 34]) {
        totalChecks++;
        try {
          const { overflow, results } = await auditPage(page, url, width, safeArea);
          if (overflow) {
            allFindings.push({ url, width, safeArea, type: "overflow-horizontal" });
          }
          for (const r of results) {
            for (const f of r.findings) {
              allFindings.push({ url, width, safeArea, scroll: r.scroll, type: "element-overlap", ...f });
            }
          }
        } catch (err) {
          allFindings.push({ url, width, safeArea, type: "error", message: err.message.slice(0, 200) });
        }
      }
    }
    await context.close();
  }

  await browser.close();

  const blocking = allFindings.filter((f) => f.severity === "blocking");
  const degraded = allFindings.filter((f) => f.severity === "degraded");
  const overflow = allFindings.filter((f) => f.type === "overflow-horizontal");
  const errors = allFindings.filter((f) => f.type === "error");

  console.log(`\n=== AUDIT ADMIN MOBILE — ${totalChecks} combinaisons page×largeur×safe-area testées ===\n`);
  console.log(`Chevauchements BLOQUANTS (clic volé) : ${blocking.length}`);
  for (const f of blocking) {
    console.log(`  [${f.width}px, safe-area ${f.safeArea}px, scroll ${f.scroll}] ${f.url}\n    A="${f.a.label}" (${f.a.tag}${f.a.fixed ? ", fixed/sticky" : ""}) <-> B="${f.b.label}" (${f.b.tag}${f.b.fixed ? ", fixed/sticky" : ""}) — overlap ${f.overlapWidth.toFixed(0)}x${f.overlapHeight.toFixed(0)}px, aBlocked=${f.aBlocked}, bBlocked=${f.bBlocked}`);
  }
  console.log(`\nChevauchements DÉGRADÉS (>25% recouvert, centre intact) : ${degraded.length}`);
  for (const f of degraded) {
    console.log(`  [${f.width}px, safe-area ${f.safeArea}px, scroll ${f.scroll}] ${f.url}\n    A="${f.a.label}" <-> B="${f.b.label}" — ${f.overlapRatio}% recouvert`);
  }
  console.log(`\nDébordements horizontaux : ${overflow.length}`);
  for (const f of overflow) console.log(`  [${f.width}px, safe-area ${f.safeArea}px, scroll ${f.scroll}] ${f.url}`);
  console.log(`\nErreurs de navigation/exécution : ${errors.length}`);
  for (const f of errors) console.log(`  [${f.width}px] ${f.url} — ${f.message}`);

  console.log(`\n=== RÉSUMÉ : ${blocking.length} bloquant(s), ${degraded.length} dégradé(s), ${overflow.length} overflow, ${errors.length} erreur(s) ===`);
  process.exitCode = blocking.length > 0 || overflow.length > 0 ? 1 : 0;
}

main();
