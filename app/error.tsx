"use client";

export default function Error({ error, reset }: { error: Error & { digest?: string }, reset: () => void }) {
  return (
    <div className="state">
      <p style={{ margin: 0 }}>Something went wrong loading the homepage.</p>
      <p style={{ margin: "8px 0 0", fontSize: 14, color: "var(--muted)" }}>{error.message}</p>
      <div style={{ marginTop: 12 }}>
        <button className="btn" onClick={() => reset()}>Try again</button>
      </div>
    </div>
  );
}
