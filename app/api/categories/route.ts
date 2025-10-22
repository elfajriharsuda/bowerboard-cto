import type { Category } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "../../../lib/prisma";
import { listCategories, type CategoryDto } from "../../../lib/sites";
import { normalizeLabel } from "../../../lib/labels";

const payloadSchema = z.object({
  name: z.string().transform((value, ctx) => {
    const normalized = normalizeLabel(value);
    if (!normalized) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Name must be between 1 and 64 characters" });
      return z.NEVER;
    }
    return normalized;
  }),
});

export async function GET() {
  try {
    const items = await listCategories();
    return NextResponse.json({ items, total: items.length }, { status: 200 });
  } catch (error) {
    console.error("Failed to load categories", error);
    return NextResponse.json({ error: "Failed to load categories" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const parsed = payloadSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", issues: parsed.error.issues }, { status: 400 });
  }

  const { name } = parsed.data;

  try {
    const existing = await prisma.category.findFirst({
      where: { name: { equals: name, mode: "insensitive" } },
      include: { _count: { select: { sites: true } } },
    });
    if (existing) {
      return NextResponse.json({ error: "Category already exists", category: toCategoryDto(existing) }, { status: 409 });
    }

    const created = await prisma.category.create({
      data: { name },
      include: { _count: { select: { sites: true } } },
    });
    return NextResponse.json(toCategoryDto(created), { status: 201 });
  } catch (error) {
    console.error("Failed to create category", error);
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
  }
}

function toCategoryDto(category: Category & { _count: { sites: number } }): CategoryDto {
  return {
    id: category.id,
    name: category.name,
    siteCount: category._count.sites,
  };
}
