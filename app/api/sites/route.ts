import { NextResponse } from "next/server";
import { filterAndPaginateSites } from "../../../lib/sites";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");
  const category = searchParams.get("category");
  const tag = searchParams.get("tag");
  const page = safeInt(searchParams.get("page"));
  const pageSize = safeInt(searchParams.get("pageSize"));

  const result = filterAndPaginateSites({ q, category, tag, page, pageSize });
  return NextResponse.json(result, { status: 200 });
}

function safeInt(v: string | null): number | null {
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) ? Math.round(n) : null;
}
