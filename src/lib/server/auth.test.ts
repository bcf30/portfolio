import { describe, it, expect, vi, beforeEach } from "vitest";
import { scryptSync } from "node:crypto";

// Getters so each test can change the configured password after the module is imported
const env = vi.hoisted(() => ({ hash: undefined as string | undefined, plain: undefined as string | undefined }));
vi.mock("$app/env/private", () => ({
  get ADMIN_PASSWORD_HASH() {
    return env.hash;
  },
  get ADMIN_PASSWORD() {
    return env.plain;
  },
}));

import { verifyPassword, requireAdmin } from "./auth.ts";

const SALT = "c0ffee";
const HASHED = `${SALT}:${scryptSync("hunter2", SALT, 64).toString("hex")}`;

beforeEach(() => {
  env.hash = undefined;
  env.plain = undefined;
});

describe("verifyPassword with a salt:hash value", () => {
  beforeEach(() => {
    env.hash = HASHED;
  });

  it("accepts the right password", () => {
    expect(verifyPassword("hunter2")).toBe(true);
  });

  it("rejects a wrong password", () => {
    expect(verifyPassword("hunter3")).toBe(false);
  });

  it("rejects the hash itself as a password", () => {
    expect(verifyPassword(HASHED)).toBe(false);
  });

  it("rejects null and empty passwords", () => {
    expect(verifyPassword(null)).toBe(false);
    expect(verifyPassword("")).toBe(false);
  });

  it("tolerates the value being pasted with its variable name in front", () => {
    env.hash = `ADMIN_PASSWORD_HASH=${HASHED}`;
    expect(verifyPassword("hunter2")).toBe(true);
  });

  it("rejects everything when the stored key has the wrong length", () => {
    env.hash = `${SALT}:abcd`;
    expect(verifyPassword("hunter2")).toBe(false);
  });
});

describe("verifyPassword fallbacks", () => {
  it("rejects everything when no password is configured", () => {
    expect(verifyPassword("anything")).toBe(false);
  });

  it("compares plain text when the value has no colon (dev fallback)", () => {
    env.hash = "devpass";
    expect(verifyPassword("devpass")).toBe(true);
    expect(verifyPassword("other")).toBe(false);
  });

  it("falls back to ADMIN_PASSWORD when ADMIN_PASSWORD_HASH is unset", () => {
    env.plain = HASHED;
    expect(verifyPassword("hunter2")).toBe(true);
  });
});

describe("requireAdmin", () => {
  beforeEach(() => {
    env.hash = HASHED;
  });

  const requestWith = (password?: string) =>
    new Request("http://localhost/api/posts", { headers: password ? { "x-admin-password": password } : {} });

  it("returns null for the right password", () => {
    expect(requireAdmin(requestWith("hunter2"))).toBeNull();
  });

  it("returns a 401 JSON response for a wrong or missing password", async () => {
    for (const response of [requireAdmin(requestWith("nope")), requireAdmin(requestWith())]) {
      expect(response?.status).toBe(401);
      expect(await response?.json()).toEqual({ error: "Unauthorized" });
    }
  });
});
