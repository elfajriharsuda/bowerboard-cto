export function normalizeUrl(input: string | null | undefined): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  if (!trimmed) return null;

  const attempt = (value: string) => {
    try {
      const url = new URL(value);
      if (url.protocol !== "http:" && url.protocol !== "https:") {
        return null;
      }
      return url.toString();
    } catch {
      return null;
    }
  };

  return attempt(trimmed) ?? attempt(`https://${trimmed}`) ?? attempt(`http://${trimmed}`);
}

export function toAbsoluteUrl(baseUrl: string, target: string | null | undefined): string | null {
  if (!target) return null;
  const trimmed = target.trim();
  if (!trimmed) return null;

  try {
    const absolute = new URL(trimmed, baseUrl);
    if (absolute.protocol !== "http:" && absolute.protocol !== "https:") {
      return null;
    }
    return absolute.toString();
  } catch {
    return null;
  }
}
