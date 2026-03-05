import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const eslintConfig = [...nextCoreWebVitals, ...nextTypescript, {
  rules: {
    // React hooks - allow non-exhaustive deps for scroll handlers
    "react-hooks/exhaustive-deps": "warn",
    
    // Allow console in development
    "no-console": "warn",
    
    // Allow any for event handlers with dynamic data
    "@typescript-eslint/no-explicit-any": "warn",
  },
}, {
  ignores: ["node_modules/**", ".next/**", "out/**", "build/**", "next-env.d.ts", "examples/**", "skills", "websocket/**"]
}];

export default eslintConfig;
