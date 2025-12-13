type EnvConfig = {
  databaseUrl: string;
  ingestApiKey: string;
  ingestUserEmail: string;
};

function formatMissing(names: string[]): string {
  return names.length ? names.join(", ") : "";
}

export function getRequiredEnv(): EnvConfig {
  const missing: string[] = [];

  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) missing.push("DATABASE_URL");

  const ingestApiKey = process.env.INGEST_API_KEY?.trim();
  if (!ingestApiKey) missing.push("INGEST_API_KEY");

  const ingestUserEmail = process.env.INGEST_USER_EMAIL?.trim() ?? "ingest@odavl.local";

  if (missing.length) {
    throw new Error(
      `[env] Missing required environment variables: ${formatMissing(missing)}. Set them in .env or your deployment environment.`
    );
  }

  return {
    databaseUrl: databaseUrl!,
    ingestApiKey: ingestApiKey!,
    ingestUserEmail,
  };
}
