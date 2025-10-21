-- Create tables
CREATE TABLE IF NOT EXISTS "Site" (
  "id" text PRIMARY KEY,
  "url" text NOT NULL UNIQUE,
  "title" text NOT NULL,
  "description" text,
  "faviconUrl" text,
  "imageUrl" text,
  "lastFetchedAt" timestamptz,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "Category" (
  "id" text PRIMARY KEY,
  "name" text NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS "Tag" (
  "id" text PRIMARY KEY,
  "name" text NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS "SiteCategory" (
  "siteId" text NOT NULL,
  "categoryId" text NOT NULL,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "SiteCategory_pkey" PRIMARY KEY ("siteId", "categoryId"),
  CONSTRAINT "SiteCategory_siteId_fkey"
    FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "SiteCategory_categoryId_fkey"
    FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "SiteTag" (
  "siteId" text NOT NULL,
  "tagId" text NOT NULL,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "SiteTag_pkey" PRIMARY KEY ("siteId", "tagId"),
  CONSTRAINT "SiteTag_siteId_fkey"
    FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "SiteTag_tagId_fkey"
    FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Indexes for search/filter performance
CREATE INDEX IF NOT EXISTS "Site_title_idx" ON "Site" ("title");
CREATE INDEX IF NOT EXISTS "Site_description_idx" ON "Site" ("description");
CREATE INDEX IF NOT EXISTS "Site_title_description_idx" ON "Site" ("title", "description");

CREATE INDEX IF NOT EXISTS "SiteCategory_categoryId_idx" ON "SiteCategory" ("categoryId");
CREATE INDEX IF NOT EXISTS "SiteCategory_siteId_idx" ON "SiteCategory" ("siteId");

CREATE INDEX IF NOT EXISTS "SiteTag_tagId_idx" ON "SiteTag" ("tagId");
CREATE INDEX IF NOT EXISTS "SiteTag_siteId_idx" ON "SiteTag" ("siteId");

-- Optional: Trigram GIN index to accelerate full-text-like search on title/description
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS "Site_title_description_trgm_gin_idx"
  ON "Site" USING GIN ((coalesce("title", '') || ' ' || coalesce("description", '')) gin_trgm_ops);
