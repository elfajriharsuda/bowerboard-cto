import { env } from "./env";
import { normalizeUrl, toAbsoluteUrl } from "./url";

export type MetadataSource = "og" | "html" | "fallback";

export type SiteMetadata = {
  url: string;
  title: string | null;
  description: string | null;
  faviconUrl: string | null;
  imageUrl: string | null;
  fetchedAt: Date;
  source: MetadataSource;
};

export class MetadataFetchError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MetadataFetchError";
  }
}

type MetadataCandidate = {
  url: string;
  title: string | null;
  description: string | null;
  faviconUrl: string | null;
  imageUrl: string | null;
  source: MetadataSource;
};

export async function fetchSiteMetadata(inputUrl: string): Promise<SiteMetadata> {
  const normalizedUrl = normalizeUrl(inputUrl);
  if (!normalizedUrl) {
    throw new MetadataFetchError("Invalid URL");
  }

  const headers: Record<string, string> = {
    "user-agent": env.METADATA_USER_AGENT,
    accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  };

  const fetchedAt = new Date();

  const ogCandidate = await fetchViaOpenGraph(normalizedUrl, headers);
  if (ogCandidate) {
    return { ...ogCandidate, fetchedAt };
  }

  const htmlCandidate = await fetchViaHtml(normalizedUrl, headers);
  if (htmlCandidate) {
    return { ...htmlCandidate, fetchedAt };
  }

  return { ...fallbackMetadata(normalizedUrl), fetchedAt };
}

async function fetchViaOpenGraph(url: string, headers: Record<string, string>): Promise<MetadataCandidate | null> {
  try {
    const ogs = await import("open-graph-scraper");
    const { result } = await ogs.default({
      url,
      timeout: env.METADATA_TIMEOUT_MS,
      headers,
      followAllRedirects: true,
      maxRedirects: 5,
      retry: 1,
    });
    if (!result) {
      return null;
    }
    const requestUrl = typeof result.requestUrl === "string" ? normalizeUrl(result.requestUrl) ?? url : url;
    return extractFromOpenGraph(result as Record<string, unknown>, requestUrl);
  } catch {
    return null;
  }
}

async function fetchViaHtml(url: string, headers: Record<string, string>): Promise<MetadataCandidate | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), env.METADATA_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      headers,
      redirect: "follow",
      signal: controller.signal,
    });
    if (!response.ok) {
      return null;
    }
    const html = await response.text();
    const finalUrl = normalizeUrl(response.url) ?? url;
    return extractFromHtml(html, finalUrl);
  } catch {
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

function extractFromOpenGraph(result: Record<string, unknown>, baseUrl: string): MetadataCandidate | null {
  const title = pickFirstString([
    result.ogTitle,
    result.twitterTitle,
    result.title,
    result.ogSiteName,
  ]);

  const description = pickFirstString([
    result.ogDescription,
    result.twitterDescription,
    result.dcDescription,
    result.description,
  ]);

  const faviconUrl = pickFavicon(result, baseUrl);
  const imageUrl = pickImage(result, baseUrl);

  if (!title && !description && !faviconUrl && !imageUrl) {
    return null;
  }

  return {
    url: baseUrl,
    title,
    description,
    faviconUrl,
    imageUrl,
    source: "og",
  };
}

function extractFromHtml(html: string, baseUrl: string): MetadataCandidate | null {
  const titleMatch = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html);
  const title = sanitizeText(titleMatch?.[1]);

  const description = extractMetaContent(html, ["description", "og:description", "twitter:description"]);
  const faviconUrl = extractIconLink(html, baseUrl);
  const imageUrl = extractMetaContent(html, ["og:image", "twitter:image", "image"]);

  if (!title && !description && !faviconUrl && !imageUrl) {
    return null;
  }

  return {
    url: baseUrl,
    title,
    description,
    faviconUrl: faviconUrl ? toAbsoluteUrl(baseUrl, faviconUrl) : null,
    imageUrl: imageUrl ? toAbsoluteUrl(baseUrl, imageUrl) : null,
    source: "html",
  };
}

function fallbackMetadata(url: string): MetadataCandidate {
  const parsed = new URL(url);
  const fallbackTitle = parsed.hostname;
  const favicon = toAbsoluteUrl(url, "/favicon.ico");
  return {
    url,
    title: fallbackTitle,
    description: null,
    faviconUrl: favicon,
    imageUrl: null,
    source: "fallback",
  };
}

function pickFirstString(values: Array<unknown>): string | null {
  for (const value of values) {
    if (typeof value === "string") {
      const sanitized = sanitizeText(value);
      if (sanitized) return sanitized;
    } else if (Array.isArray(value)) {
      const nested = pickFirstString(value);
      if (nested) return nested;
    } else if (value && typeof value === "object" && "url" in value && typeof (value as any).url === "string") {
      const sanitized = sanitizeText((value as any).url);
      if (sanitized) return sanitized;
    }
  }
  return null;
}

function pickFavicon(result: Record<string, unknown>, baseUrl: string): string | null {
  const favValue = result.favicon;
  const icons: string[] = [];
  if (typeof favValue === "string") {
    icons.push(favValue);
  } else if (Array.isArray(favValue)) {
    for (const entry of favValue) {
      if (typeof entry === "string") {
        icons.push(entry);
      } else if (entry && typeof entry === "object" && typeof (entry as any).url === "string") {
        icons.push((entry as any).url);
      }
    }
  }

  for (const icon of icons) {
    const absolute = toAbsoluteUrl(baseUrl, icon);
    if (absolute) return absolute;
  }

  return null;
}

function pickImage(result: Record<string, unknown>, baseUrl: string): string | null {
  const images: string[] = [];
  const ogImage = result.ogImage;
  if (typeof ogImage === "string") {
    images.push(ogImage);
  } else if (Array.isArray(ogImage)) {
    for (const entry of ogImage) {
      if (typeof entry === "string") {
        images.push(entry);
      } else if (entry && typeof entry === "object" && typeof (entry as any).url === "string") {
        images.push((entry as any).url);
      }
    }
  } else if (ogImage && typeof ogImage === "object" && typeof (ogImage as any).url === "string") {
    images.push((ogImage as any).url);
  }

  const twitterImage = result.twitterImage;
  if (typeof twitterImage === "string") {
    images.push(twitterImage);
  } else if (twitterImage && typeof twitterImage === "object" && typeof (twitterImage as any).url === "string") {
    images.push((twitterImage as any).url);
  }

  for (const image of images) {
    const absolute = toAbsoluteUrl(baseUrl, image);
    if (absolute) return absolute;
  }

  return null;
}

function extractMetaContent(html: string, keys: string[]): string | null {
  for (const key of keys) {
    const escaped = escapeRegex(key);
    const regex = new RegExp(`<meta[^>]+(?:name|property)=["']${escaped}["'][^>]*content=["']([^"']+)["'][^>]*>`, "i");
    const match = regex.exec(html);
    if (match && match[1]) {
      const sanitized = sanitizeText(match[1]);
      if (sanitized) return sanitized;
    }
  }
  return null;
}

function extractIconLink(html: string, baseUrl: string): string | null {
  const regex = /<link[^>]+rel=["'][^"']*icon[^"']*["'][^>]*>/gi;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(html))) {
    const hrefMatch = /href=["']([^"']+)["']/i.exec(match[0]);
    if (hrefMatch && hrefMatch[1]) {
      const absolute = toAbsoluteUrl(baseUrl, hrefMatch[1]);
      if (absolute) return absolute;
    }
  }
  return null;
}

function sanitizeText(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const decoded = decodeEntities(input.trim());
  return decoded || null;
}

function decodeEntities(value: string): string {
  return value
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&nbsp;/gi, " ");
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
