import Link from "next/link";
import { getInitials } from "../lib/sites";

export type SiteCardProps = {
  title: string;
  description: string;
  url: string;
  faviconUrl?: string;
  categories: string[];
  tags: string[];
};

export default function SiteCard({ title, description, url, faviconUrl, categories, tags }: SiteCardProps) {
  const hostname = (() => { try { return new URL(url).hostname; } catch { return url; } })();
  const favicon = faviconUrl || `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`;
  return (
    <article className="card">
      <div className="card-head">
        <div className="favicon" aria-hidden>
          {favicon ? <img src={favicon} alt="" width={28} height={28} style={{ width: 28, height: 28, borderRadius: 6 }} /> : getInitials(title)}
        </div>
        <div>
          <div className="card-title">{title}</div>
          <div className="card-subtitle" style={{ color: "var(--muted)", fontSize: 12 }}>{hostname}</div>
        </div>
      </div>
      <p className="card-desc">{description}</p>
      <div className="chips">
        {categories.map((c) => (
          <span className="chip" key={c}>📂 {c}</span>
        ))}
        {tags.map((t) => (
          <span className="chip" key={t}># {t}</span>
        ))}
      </div>
      <div>
        <Link className="btn" href={url} target="_blank" rel="noreferrer">Visit ↗</Link>
      </div>
    </article>
  );
}
