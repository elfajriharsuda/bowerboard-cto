export default function Loading() {
  return (
    <div>
      <div className="state" style={{ marginBottom: 12 }}>Loading sites…</div>
      <div className="loading-row">
        <div className="loading-skeleton" />
        <div className="loading-skeleton" />
        <div className="loading-skeleton" />
      </div>
    </div>
  );
}
