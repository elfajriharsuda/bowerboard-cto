import { NextResponse } from "next/server";

function parseUrl(input: string): string | null {
  const val = input.trim();
  if (!val) return null;
  try {
    return new URL(val).toString();
  } catch (_) {
    try {
      return new URL("http://" + val).toString();
    } catch (_e) {
      return null;
    }
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const raw = searchParams.get("url") || "";
  const target = parseUrl(raw);
  if (!target) {
    return NextResponse.json({ error: "url query param is required" }, { status: 400 });
  }

  try {
    const ogs = await import("open-graph-scraper");
    const timeout = Number(process.env.METADATA_TIMEOUT_MS || "8000");
    const userAgent = process.env.METADATA_USER_AGENT || "BookmarkMetadataFetcher/1.0";

    const { result } = await ogs.default({
      url: target,
      timeout,
      headers: { "user-agent": userAgent },
      followAllRedirects: true,
      maxRedirects: 5,
      retry: 1,
    });

    const title = String(result.ogTitle || result.twitterTitle || result.requestUrl || "");
    const description = String(result.ogDescription || result.twitterDescription || result.dcDescription || "");
    let favicon = "" as string;
    const possibleIcons = Array.isArray(result.favicon) ? result.favicon : result.favicon ? [result.favicon] : [];
    if (possibleIcons.length) {
      favicon = possibleIcons[0] as string;
    }

    return NextResponse.json({ title, description, favicon }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ error: "failed to fetch metadata" }, { status: 500 });
  }
}
