import type {
  Category,
  Prisma,
  Site as SiteModel,
  SiteCategory,
  SiteTag,
  Tag,
} from "@prisma/client";
import { prisma } from "./prisma";
import { fetchSiteMetadata } from "./metadata";
import { uniqueNormalizedLabels } from "./labels";
import { normalizeUrl } from "./url";

export type Query = {
  q?: string | null;
  category?: string | null;
  tag?: string | null;
  page?: number | null;
  pageSize?: number | null;
};

export type PagedResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type SiteDto = {
  id: string;
  url: string;
  title: string;
  description: string;
  faviconUrl: string | null;
  imageUrl: string | null;
  lastFetchedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  categories: string[];
  tags: string[];
};

export type CategoryDto = {
  id: string;
  name: string;
  siteCount: number;
};

export type TagDto = {
  id: string;
  name: string;
  siteCount: number;
};

export type CreateSiteInput = {
  url: string;
  title?: string | null;
  description?: string | null;
  categories?: string[];
  tags?: string[];
};

export class SiteAlreadyExistsError extends Error {
  constructor(url: string) {
    super(`Site with URL ${url} already exists`);
    this.name = "SiteAlreadyExistsError";
  }
}

type SiteRecord = SiteModel & {
  categories: Array<SiteCategory & { category: Category }>;
  tags: Array<SiteTag & { tag: Tag }>;
};

type CategoryWithCount = Category & { _count: { sites: number } };

type TagWithCount = Tag & { _count: { sites: number } };

const DEFAULT_PAGE_SIZE = 12;
const MAX_PAGE_SIZE = 48;

export async function filterAndPaginateSites(query: Query): Promise<PagedResult<SiteDto>> {
  const pageSize = clamp(query.pageSize ?? DEFAULT_PAGE_SIZE, 1, MAX_PAGE_SIZE);
  const initialPage = Math.max(1, query.page ?? 1);
  const where = buildSiteWhere(query);

  const total = await prisma.site.count({ where });
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(initialPage, totalPages);
  const skip = (page - 1) * pageSize;

  const records = await prisma.site.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      categories: { include: { category: true } },
      tags: { include: { tag: true } },
    },
    skip,
    take: pageSize,
  });

  const items = records.map(normalizeSite);

  return { items, total, page, pageSize, totalPages };
}

export async function createSite(input: CreateSiteInput): Promise<SiteDto> {
  const normalizedUrl = normalizeUrl(input.url);
  if (!normalizedUrl) {
    throw new Error("Invalid URL");
  }

  const existing = await prisma.site.findUnique({ where: { url: normalizedUrl } });
  if (existing) {
    throw new SiteAlreadyExistsError(normalizedUrl);
  }

  const categories = uniqueNormalizedLabels(input.categories ?? []);
  const tags = uniqueNormalizedLabels(input.tags ?? []);

  const [metadata, categoryRecords, tagRecords] = await Promise.all([
    fetchSiteMetadata(normalizedUrl).catch(() => null),
    Promise.all(categories.map((name) => ensureCategory(name))),
    Promise.all(tags.map((name) => ensureTag(name))),
  ]);

  const now = new Date();
  const fallbackTitle = extractHostname(normalizedUrl);
  const title = chooseRequiredText([input.title, metadata?.title], fallbackTitle);
  const description = chooseOptionalText([input.description, metadata?.description]);

  const site = await prisma.site.create({
    data: {
      url: normalizedUrl,
      title,
      description: description ?? null,
      faviconUrl: metadata?.faviconUrl ?? null,
      imageUrl: metadata?.imageUrl ?? null,
      lastFetchedAt: metadata?.fetchedAt ?? now,
      categories: {
        create: categoryRecords.map((category) => ({ category: { connect: { id: category.id } } })),
      },
      tags: {
        create: tagRecords.map((tag) => ({ tag: { connect: { id: tag.id } } })),
      },
    },
    include: {
      categories: { include: { category: true } },
      tags: { include: { tag: true } },
    },
  });

  return normalizeSite(site);
}

export async function getAllCategories(): Promise<string[]> {
  const records = await prisma.category.findMany({
    orderBy: { name: "asc" },
    select: { name: true },
  });
  return records.map((record) => record.name);
}

export async function getAllTags(): Promise<string[]> {
  const records = await prisma.tag.findMany({
    orderBy: { name: "asc" },
    select: { name: true },
  });
  return records.map((record) => record.name);
}

export async function listCategories(): Promise<CategoryDto[]> {
  const records = await prisma.category.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { sites: true } } },
  });
  return records.map(normalizeCategory);
}

export async function listTags(): Promise<TagDto[]> {
  const records = await prisma.tag.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { sites: true } } },
  });
  return records.map(normalizeTag);
}

export function getInitials(label: string): string {
  const letters = label.replace(/[^a-zA-Z0-9 ]/g, " ").trim().split(/\s+/).slice(0, 2);
  if (letters.length === 0) return "?";
  if (letters.length === 1) return letters[0].charAt(0).toUpperCase();
  return letters[0].charAt(0).toUpperCase() + letters[1].charAt(0).toUpperCase();
}

function normalizeSite(record: SiteRecord): SiteDto {
  const categories = record.categories.map((entry) => entry.category.name).sort((a, b) => a.localeCompare(b));
  const tags = record.tags.map((entry) => entry.tag.name).sort((a, b) => a.localeCompare(b));
  return {
    id: record.id,
    url: record.url,
    title: record.title,
    description: record.description ?? "",
    faviconUrl: record.faviconUrl ?? null,
    imageUrl: record.imageUrl ?? null,
    lastFetchedAt: record.lastFetchedAt ?? null,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    categories,
    tags,
  };
}

function normalizeCategory(record: CategoryWithCount): CategoryDto {
  return {
    id: record.id,
    name: record.name,
    siteCount: record._count.sites,
  };
}

function normalizeTag(record: TagWithCount): TagDto {
  return {
    id: record.id,
    name: record.name,
    siteCount: record._count.sites,
  };
}

async function ensureCategory(name: string): Promise<Category> {
  const existing = await prisma.category.findFirst({
    where: { name: { equals: name, mode: "insensitive" } },
  });
  if (existing) {
    return existing;
  }
  return prisma.category.create({ data: { name } });
}

async function ensureTag(name: string): Promise<Tag> {
  const existing = await prisma.tag.findFirst({
    where: { name: { equals: name, mode: "insensitive" } },
  });
  if (existing) {
    return existing;
  }
  return prisma.tag.create({ data: { name } });
}

function chooseRequiredText(inputs: Array<string | null | undefined>, fallback: string): string {
  const selected = selectText(inputs);
  const normalizedFallback = cleanText(fallback) ?? fallback;
  return selected ?? normalizedFallback;
}

function chooseOptionalText(inputs: Array<string | null | undefined>): string | null {
  return selectText(inputs);
}

function selectText(inputs: Array<string | null | undefined>): string | null {
  for (const input of inputs) {
    const cleaned = cleanText(input);
    if (cleaned) return cleaned;
  }
  return null;
}

function cleanText(input: string | null | undefined): string | null {
  if (typeof input !== "string") return null;
  const value = input.replace(/\s+/g, " ").trim();
  return value || null;
}

function extractHostname(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

function buildSiteWhere(query: Query): Prisma.SiteWhereInput {
  const where: Prisma.SiteWhereInput = {};
  const orConditions: Prisma.SiteWhereInput[] = [];
  const q = cleanText(query.q);
  if (q) {
    orConditions.push(
      { title: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
      { url: { contains: q, mode: "insensitive" } },
    );
  }
  if (orConditions.length) {
    where.OR = orConditions;
  }

  const category = cleanText(query.category);
  if (category) {
    where.categories = {
      some: { category: { name: { equals: category, mode: "insensitive" } } },
    };
  }

  const tag = cleanText(query.tag);
  if (tag) {
    where.tags = {
      some: { tag: { name: { equals: tag, mode: "insensitive" } } },
    };
  }
  return where;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
