export function normalizeLabel(input: string | null | undefined): string | null {
  if (!input) return null;
  const compressed = input.replace(/\s+/g, " ").trim();
  if (!compressed) return null;
  if (compressed.length > 64) return null;
  return compressed;
}

export function uniqueNormalizedLabels(values: Array<string | null | undefined> | null | undefined): string[] {
  if (!Array.isArray(values) || values.length === 0) {
    return [];
  }

  const deduped = new Map<string, string>();
  for (const value of values) {
    const normalized = normalizeLabel(value);
    if (!normalized) continue;
    const key = normalized.toLocaleLowerCase();
    if (!deduped.has(key)) {
      deduped.set(key, normalized);
    }
  }
  return Array.from(deduped.values());
}
