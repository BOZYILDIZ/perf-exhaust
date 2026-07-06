-- CreateTable
CREATE TABLE "QuoteRequest" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telephone" TEXT NOT NULL,
    "marque" TEXT NOT NULL,
    "modele" TEXT NOT NULL,
    "annee" TEXT NOT NULL,
    "motorisation" TEXT,
    "typeProjet" TEXT NOT NULL,
    "sonorite" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'new',
    "notes" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuoteRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteSettings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "businessName" TEXT NOT NULL DEFAULT 'PERF''EXHAUST',
    "phone" TEXT NOT NULL DEFAULT '+33636523058',
    "email" TEXT NOT NULL DEFAULT 'contact@perfexhaust.fr',
    "address" TEXT NOT NULL DEFAULT '30 Rue de Soufflenheim',
    "postalCode" TEXT NOT NULL DEFAULT '67480',
    "city" TEXT NOT NULL DEFAULT 'Rountzenheim-Auenheim',
    "instagramUrl" TEXT NOT NULL DEFAULT 'https://www.instagram.com/perfexhaust67/',
    "tiktokUrl" TEXT NOT NULL DEFAULT 'https://www.tiktok.com/@perfexhaust',
    "googleReviewsUrl" TEXT NOT NULL DEFAULT '',
    "shiftechUrl" TEXT NOT NULL DEFAULT 'https://www.shiftech.eu',
    "openingHours" TEXT NOT NULL DEFAULT 'Lun–Ven : 8h–18h (sur rendez-vous)',
    "legalForm" TEXT NOT NULL DEFAULT '',
    "siret" TEXT NOT NULL DEFAULT '882 838 667 00021',
    "publicationDirector" TEXT NOT NULL DEFAULT '',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Service" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "shortDescription" TEXT NOT NULL,
    "longDescription" TEXT NOT NULL DEFAULT '',
    "icon" TEXT NOT NULL DEFAULT 'wrench',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FAQItem" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "category" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FAQItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "QuoteRequest_status_createdAt_idx" ON "QuoteRequest"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Service_slug_key" ON "Service"("slug");

-- CreateIndex
CREATE INDEX "Service_status_sortOrder_idx" ON "Service"("status", "sortOrder");

-- CreateIndex
CREATE INDEX "FAQItem_status_sortOrder_idx" ON "FAQItem"("status", "sortOrder");

