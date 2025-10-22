import SearchFilters from "../components/SearchFilters";
import SiteCard from "../components/SiteCard";
import Pagination from "../components/Pagination";
import ResultsToolbar from "../components/ResultsToolbar";
import { filterAndPaginateSites, getAllCategories, getAllTags } from "../lib/sites";

export const revalidate = 0;

export default async function Home({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
  const q = toStr(searchParams.q);
  const category = toStr(searchParams.category);
  const tag = toStr(searchParams.tag);
  const page = toInt(searchParams.page) ?? 1;

  const [{ items, total, totalPages, page: currentPage }, categories, tags] = await Promise.all([
    filterAndPaginateSites({ q, category, tag, page }),
    getAllCategories(),
    getAllTags(),
  ]);

  return (
    <div>
      <SearchFilters categories={categories} tags={tags} />
      <ResultsToolbar total={total} />

      {items.length === 0 ? (
        <div className="state">
          <p style={{ margin: 0 }}>No sites match your filters.</p>
          <p style={{ margin: "8px 0 0", fontSize: 14 }}>
            Try adjusting your search or filters. You can also <a href="/add">add a new site</a>.
          </p>
        </div>
      ) : (
        <div>
          <section className="grid">
            {items.map((s) => (
              <SiteCard key={s.id} title={s.title} description={s.description} url={s.url} faviconUrl={s.faviconUrl} categories={s.categories} tags={s.tags} />
            ))}
          </section>
          <Pagination page={currentPage} totalPages={totalPages} />
        </div>
      )}

      <section id="add-site" style={{ marginTop: 32 }}>
        <div className="card">
          <h2 style={{ margin: 0 }}>Add a site</h2>
          <p className="card-desc">Have a great site to share? Click below to suggest it.</p>
          <a className="btn btn-primary" href="/add">Submit a site</a>
        </div>
      </section>
    </div>
  );
}

function toStr(v: string | string[] | undefined): string | null {
  if (!v) return null;
  return Array.isArray(v) ? v[0] : v;
}
function toInt(v: string | string[] | undefined): number | null {
  const s = toStr(v);
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? Math.round(n) : null;
}
