"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export type SearchFiltersProps = {
  categories: string[];
  tags: string[];
};

export default function SearchFilters({ categories, tags }: SearchFiltersProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const [category, setCategory] = useState(searchParams.get("category") ?? "");
  const [tag, setTag] = useState(searchParams.get("tag") ?? "");

  useEffect(() => {
    setQ(searchParams.get("q") ?? "");
    setCategory(searchParams.get("category") ?? "");
    setTag(searchParams.get("tag") ?? "");
  }, [searchParams]);

  const allCategories = useMemo(() => ["", ...categories], [categories]);
  const allTags = useMemo(() => ["", ...tags], [tags]);

  function apply(next: Record<string, string | number | undefined>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(next)) {
      if (v === undefined || v === "") params.delete(k);
      else params.set(k, String(v));
    }
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    apply({ q, category, tag });
  }

  function clearAll() {
    router.push(pathname);
  }

  return (
    <form onSubmit={onSubmit} className="controls-bar">
      <div className="controls-row">
        <input
          className="input"
          placeholder="Search sites..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          name="q"
          aria-label="Search"
        />
        <div className="filter-group">
          <label className="filter-label" htmlFor="category">Category</label>
          <select id="category" className="input" value={category} onChange={(e) => apply({ category: e.target.value || undefined })}>
            {allCategories.map((c) => (
              <option key={c} value={c}>{c || "All"}</option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <label className="filter-label" htmlFor="tag">Tag</label>
          <select id="tag" className="input" value={tag} onChange={(e) => apply({ tag: e.target.value || undefined })}>
            {allTags.map((t) => (
              <option key={t} value={t}>{t || "All"}</option>
            ))}
          </select>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <button type="button" className="btn" onClick={clearAll}>Reset</button>
          <button type="submit" className="btn btn-primary">Search</button>
        </div>
      </div>
    </form>
  );
}
