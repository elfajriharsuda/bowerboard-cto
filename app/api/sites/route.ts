import { NextResponse } from "next/server";
import { z } from "zod";
import { createSite, filterAndPaginateSites, SiteAlreadyExistsError, type Query } from "../../../lib/sites";
import { normalizeUrl } from "../../../lib/url";
import { normalizeLabel } from "../../../lib/labels";

const labelSchema = z.string().transform((value, ctx) => {
  const normalized = normalizeLabel(value);
  if (!normalized) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Label must be between 1 and 64 characters" });
    return z.NEVER;
  }
  return normalized;
});

const titleSchema = z
  .string()
  .max(256, "Title must be 256 characters or fewer")
  .optional()
  .transform((value) => {
    if (typeof value !== "string") return undefined;
    const trimmed = value.replace(/\s+/g, " ").trim();
    return trimmed || undefined;
  });

const descriptionSchema = z
  .string()
  .max(2048, "Description must be 2048 characters or fewer")
  .optional()
  .transform((value) => {
    if (typeof value !== "string") return undefined;
    const trimmed = value.replace(/\s+/g, " ").trim();
    return trimmed || undefined;
  });

const urlSchema = z.string().min(1).transform((value, ctx) => {
  const normalized = normalizeUrl(value);
  if (!normalized) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Invalid URL" });
    return z.NEVER;
  }
  return normalized;
});

const createSiteSchema = z.object({
  url: urlSchema,
  title: titleSchema,
  description: descriptionSchema,
  categories: z.array(labelSchema).optional().default([]),
  tags: z.array(labelSchema).optional().default([]),
});

export async function GET(request: Request) {
  try {
    const query = parseQuery(request);
    const result = await filterAndPaginateSites(query);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("Failed to load sites", error);
    return NextResponse.json({ error: "Failed to load sites" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const parsed = createSiteSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", issues: parsed.error.issues }, { status: 400 });
  }

  try {
    const site = await createSite(parsed.data);
    const response = NextResponse.json(site, { status: 201 });
    response.headers.set("Location", site.url);
    return response;
  } catch (error) {
    if (error instanceof SiteAlreadyExistsError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    console.error("Failed to create site", error);
    return NextResponse.json({ error: "Failed to create site" }, { status: 500 });
  }
}

function parseQuery(request: Request): Query {
  const { searchParams } = new URL(request.url);
  return {
    q: toOptionalString(searchParams.get("q")),
    category: toOptionalString(searchParams.get("category")),
    tag: toOptionalString(searchParams.get("tag")),
    page: safeInt(searchParams.get("page")),
    pageSize: safeInt(searchParams.get("pageSize")),
  };
}

function toOptionalString(value: string | null): string | null {
  if (value === null) return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function safeInt(value: string | null): number | null {
  if (!value) return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  return Math.round(parsed);
}
