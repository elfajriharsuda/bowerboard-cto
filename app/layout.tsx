import "./globals.css";
import Link from "next/link";

export const metadata = {
  title: "Site Directory",
  description: "Discover curated sites with search, filter, and pagination.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="site-header">
          <div className="container header-inner">
            <Link href="/" className="brand">
              <span className="brand-logo" aria-hidden>
                🗂️
              </span>
              <span className="brand-title">Site Directory</span>
            </Link>
            <div className="header-actions">
              <Link className="btn btn-primary" href="#add-site" prefetch={false}>
                Add Site
              </Link>
            </div>
          </div>
        </header>
        <main className="container main-content">{children}</main>
        <footer className="site-footer">
          <div className="container">
            <span>© {new Date().getFullYear()} Site Directory</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
