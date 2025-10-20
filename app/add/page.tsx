export const metadata = {
  title: "Add Site • Site Directory",
};

export default function AddSitePage() {
  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Add a site</h1>
      <p className="card-desc">Suggest a new site to include in the directory. This is a placeholder page; the form will be implemented next.</p>

      <section style={{ marginTop: 16 }}>
        <div className="card">
          <div style={{ display: "grid", gap: 12 }}>
            <label style={{ display: "grid", gap: 6 }}>
              <span>Site URL</span>
              <input className="input" type="url" placeholder="https://example.com" />
            </label>
            <label style={{ display: "grid", gap: 6 }}>
              <span>Title</span>
              <input className="input" type="text" placeholder="Awesome Site" />
            </label>
            <label style={{ display: "grid", gap: 6 }}>
              <span>Description</span>
              <textarea className="input" rows={4} placeholder="What is this site about?" />
            </label>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button className="btn" type="button">Cancel</button>
              <button className="btn btn-primary" type="button">Submit</button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
