export default function ResultsToolbar({ total }: { total: number }) {
  return (
    <div className="toolbar">
      <div className="results-count">{total.toLocaleString()} results</div>
      <a href="#add-site" className="btn">Add Site</a>
    </div>
  );
}
