export const env = {
  DATABASE_URL: process.env.DATABASE_URL || "",
  METADATA_TIMEOUT_MS: Number(process.env.METADATA_TIMEOUT_MS || "8000"),
  METADATA_USER_AGENT: process.env.METADATA_USER_AGENT || "BookmarkMetadataFetcher/1.0",
};
