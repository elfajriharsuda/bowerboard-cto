import { NextResponse } from "next/server";
import { fetchSiteMetadata, MetadataFetchError } from "../../../lib/metadata";
import { normalizeUrl } from "../../../lib/url";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const raw = searchParams.get("url");
  if (!raw) {
    return NextResponse.json({ error: "url query param is required" }, { status: 400 });
  }

  const normalized = normalizeUrl(raw);
  if (!normalized) {
    return NextResponse.json({ error: "url query param must be a valid http(s) URL" }, { status: 400 });
  }

  try {
    const metadata = await fetchSiteMetadata(normalized);
    return NextResponse.json(metadata, { status: 200 });
  } catch (error) {
    if (error instanceof MetadataFetchError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("Failed to fetch metadata", error);
    return NextResponse.json({ error: "failed to fetch metadata" }, { status: 500 });
  }
}
