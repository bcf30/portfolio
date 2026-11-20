import { createPool, type VercelPool } from "@vercel/postgres";
import { POSTGRES_URL, DATABASE_URL } from "$app/env/private";

let pool: VercelPool | undefined;

// Created on first query rather than at import, so builds don't need a database URL.
export function db(): VercelPool {
  pool ??= createPool({ connectionString: POSTGRES_URL ?? DATABASE_URL });
  return pool;
}
