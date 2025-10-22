import type { Tag } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "../../../lib/prisma";
import { listTags, type TagDto } from "../../../lib/sites";
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
    const items = await listTags();
    return NextResponse.json({ items, total: items.length }, { status: 200 });
  } catch (error) {
    console.error("Failed to load tags", error);
    return NextResponse.json({ error: "Failed to load tags" }, { status: 500 });
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
    const existing = await prisma.tag.findFirst({
      where: { name: { equals: name, mode: "insensitive" } },
      include: { _count: { select: { sites: true } } },
    });
    if (existing) {
      return NextResponse.json({ error: "Tag already exists", tag: toTagDto(existing) }, { status: 409 });
    }

    const created = await prisma.tag.create({
      data: { name },
      include: { _count: { select: { sites: true } } },
    });
    return NextResponse.json(toTagDto(created), { status: 201 });
  } catch (error) {
    console.error("Failed to create tag", error);
    return NextResponse.json({ error: "Failed to create tag" }, { status: 500 });
  }
}

function toTagDto(tag: Tag & { _count: { sites: number } }): TagDto {
  return {
    id: tag.id,
    name: tag.name,
    siteCount: tag._count.sites,
  };
}
