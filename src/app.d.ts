declare global {
  namespace App {
    interface PageData {
      // Optional per-page <title>/<meta name="description"> override, read by the root layout
      meta?: { title: string; description?: string };
    }
  }
}

export {};
