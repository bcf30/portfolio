import { describe, it, expect, vi, beforeEach } from "vitest";

const env = vi.hoisted(() => ({ postgres: undefined as string | undefined, database: undefined as string | undefined }));
const createPool = vi.hoisted(() => vi.fn((options: { connectionString?: string }) => ({ options })));

vi.mock("@vercel/postgres", () => ({ createPool }));
vi.mock("$app/env/private", () => ({
  get POSTGRES_URL() {
    return env.postgres;
  },
  get DATABASE_URL() {
    return env.database;
  },
}));

// db.ts caches its pool in module scope, so each test imports a fresh copy
async function freshDb() {
  vi.resetModules();
  return (await import("./db.ts")).db;
}

beforeEach(() => {
  env.postgres = undefined;
  env.database = undefined;
});

describe("db", () => {
  it("connects with POSTGRES_URL", async () => {
    env.postgres = "postgres://pooled";
    env.database = "postgres://direct";
    (await freshDb())();
    expect(createPool).toHaveBeenCalledWith({ connectionString: "postgres://pooled" });
  });

  it("falls back to DATABASE_URL", async () => {
    env.database = "postgres://direct";
    (await freshDb())();
    expect(createPool).toHaveBeenCalledWith({ connectionString: "postgres://direct" });
  });

  it("does not connect on import, and reuses one pool across calls", async () => {
    const db = await freshDb();
    expect(createPool).not.toHaveBeenCalled();
    expect(db()).toBe(db());
    expect(createPool).toHaveBeenCalledTimes(1);
  });
});
