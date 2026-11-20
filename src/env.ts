import { defineEnvVars } from "@sveltejs/kit/env";

// Every variable is optional so builds and local dev work without the full set;
// the code that uses each one decides what a missing value means.
const optional = (value: string | undefined) => value;

export const variables = defineEnvVars({
  POSTGRES_URL: { schema: optional, description: "Pooled Postgres connection string" },
  DATABASE_URL: { schema: optional, description: "Fallback when POSTGRES_URL is not set" },
  BLOB_READ_WRITE_TOKEN: { schema: optional, description: "Vercel Blob token for cover image uploads" },
  ADMIN_PASSWORD_HASH: { schema: optional, description: "Blog admin password as salt:scryptHexKey" },
  ADMIN_PASSWORD: { schema: optional, description: "Legacy fallback for ADMIN_PASSWORD_HASH" },
});
