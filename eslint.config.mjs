import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    // The frikøb calculation core must stay pure: no framework, no I/O.
    // This is what lets us bolt on a backend later without touching the maths,
    // and what keeps the engine trivially unit-testable. See CLAUDE.md.
    files: ["src/lib/frikoeb/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            { name: "react", message: "The frikøb core must stay framework-free." },
            { name: "react-dom", message: "The frikøb core must stay framework-free." },
            { name: "next", message: "The frikøb core must stay framework-free." },
            { name: "fs", message: "The frikøb core must be pure — no I/O." },
            { name: "node:fs", message: "The frikøb core must be pure — no I/O." },
            { name: "path", message: "The frikøb core must be pure — no I/O." },
            { name: "node:path", message: "The frikøb core must be pure — no I/O." },
          ],
          patterns: [
            { group: ["next/*"], message: "The frikøb core must stay framework-free." },
            { group: ["@/components/*", "@/app/*"], message: "The core must not depend on UI." },
          ],
        },
      ],
    },
  },
]);

export default eslintConfig;
