"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

export type PaginationProps = {
  page: number;
  totalPages: number;
};

export default function Pagination({ page, totalPages }: PaginationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function pushPage(p: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(p));
    router.push(`${pathname}?${params.toString()}`);
  }

  if (totalPages <= 1) return null;

  const pages: number[] = makePageList(page, totalPages);

  return (
    <nav className="pagination" aria-label="Pagination">
      <button className="page-btn" onClick={() => pushPage(page - 1)} disabled={page <= 1}>Prev</button>
      {pages.map((p, idx) => (
        p === -1 ? (
          <span key={`gap-${idx}`} className="page-btn" aria-hidden>…</span>
        ) : (
          <button
            key={p}
            className="page-btn"
            aria-current={p === page ? "page" : undefined}
            onClick={() => pushPage(p)}
          >{p}</button>
        )
      ))}
      <button className="page-btn" onClick={() => pushPage(page + 1)} disabled={page >= totalPages}>Next</button>
    </nav>
  );
}

function makePageList(page: number, total: number): number[] {
  const pages: number[] = [];
  const window = 1;
  const start = Math.max(1, page - window);
  const end = Math.min(total, page + window);

  const push = (n: number) => pages.push(n);
  const gap = () => pages.push(-1);

  if (start > 1) {
    push(1);
    if (start > 2) gap();
  }

  for (let p = start; p <= end; p++) push(p);

  if (end < total) {
    if (end < total - 1) gap();
    push(total);
  }

  return pages;
}
