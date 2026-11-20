/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import { sveltekit } from "@sveltejs/kit/vite";
import tailwindcss from "@tailwindcss/vite";
import adapter from "@sveltejs/adapter-vercel";
import { svelteTesting } from "@testing-library/svelte/vite";

export default defineConfig({
  plugins: [
    tailwindcss(),
    sveltekit({
      adapter: adapter(),
    }),
  ],
  test: {
    // Every test mocks its own collaborators (database, Blob, fetch), so nothing touches real services
    // Between tests: clear vi.fn() calls and queued return values, undo vi.spyOn and vi.stubGlobal
    mockReset: true,
    restoreMocks: true,
    unstubGlobals: true,
    projects: [
      {
        extends: true,
        test: {
          name: "server",
          environment: "node",
          include: ["src/**/*.test.ts"],
          exclude: ["src/**/*.svelte.test.ts"],
        },
      },
      {
        extends: true,
        plugins: [svelteTesting()],
        test: {
          name: "client",
          environment: "jsdom",
          include: ["src/**/*.svelte.test.ts"],
          setupFiles: ["src/test/setup-dom.ts"],
        },
      },
    ],
  },
});
