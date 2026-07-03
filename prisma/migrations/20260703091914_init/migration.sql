-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "vehicule" TEXT NOT NULL,
    "marque" TEXT NOT NULL,
    "modele" TEXT NOT NULL,
    "annee" TEXT NOT NULL,
    "prestation" TEXT NOT NULL,
    "categorie" TEXT,
    "tags" JSONB NOT NULL DEFAULT '[]',
    "sonoriteTag" TEXT NOT NULL,
    "filterTags" JSONB NOT NULL DEFAULT '[]',
    "description" TEXT NOT NULL,
    "descriptionComplete" TEXT NOT NULL,
    "objectifsClient" TEXT NOT NULL DEFAULT '',
    "modificationsRealisees" TEXT NOT NULL DEFAULT '',
    "materiaux" TEXT NOT NULL DEFAULT '',
    "resultatSonore" TEXT NOT NULL DEFAULT '',
    "dureeProjet" TEXT,
    "difficulte" TEXT,
    "ctaCustom" TEXT,
    "imagePrincipale" TEXT,
    "imageAlt" TEXT,
    "galerie" JSONB NOT NULL DEFAULT '[]',
    "videoUrl" TEXT,
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "ogImage" TEXT,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "date" TEXT NOT NULL DEFAULT '',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "publishedAt" TIMESTAMP(3),

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Project_slug_key" ON "Project"("slug");

-- CreateIndex
CREATE INDEX "Project_status_sortOrder_idx" ON "Project"("status", "sortOrder");
