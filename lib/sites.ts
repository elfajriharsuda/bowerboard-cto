import { SITES, type Site } from "../data/sites";

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

export function getAllCategories(): string[] {
  const set = new Set<string>();
  for (const s of SITES) for (const c of s.categories) set.add(c);
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

export function getAllTags(): string[] {
  const set = new Set<string>();
  for (const s of SITES) for (const t of s.tags) set.add(t);
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

export function filterAndPaginateSites(query: Query): PagedResult<Site> {
  const q = (query.q ?? "").trim().toLowerCase();
  const category = (query.category ?? "").trim().toLowerCase();
  const tag = (query.tag ?? "").trim().toLowerCase();
  const pageSize = Math.max(1, Math.min(48, query.pageSize ?? 9));
  const page = Math.max(1, query.page ?? 1);

  let filtered = SITES;

  if (q) {
    filtered = filtered.filter((s) =>
      s.title.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q) ||
      s.url.toLowerCase().includes(q)
    );
  }
  if (category) {
    filtered = filtered.filter((s) => s.categories.some((c) => c.toLowerCase() === category));
  }
  if (tag) {
    filtered = filtered.filter((s) => s.tags.some((t) => t.toLowerCase() === tag));
  }

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const items = filtered.slice(start, start + pageSize);

  return {
    items,
    total,
    page: safePage,
    pageSize,
    totalPages,
  };
}

export function getInitials(label: string): string {
  const letters = label.replace(/[^a-zA-Z0-9 ]/g, " ").trim().split(/\s+/).slice(0, 2);
  if (letters.length === 0) return "?";
  if (letters.length === 1) return letters[0].charAt(0).toUpperCase();
  return letters[0].charAt(0).toUpperCase() + letters[1].charAt(0).toUpperCase();
}
