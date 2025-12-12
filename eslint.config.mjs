import js from "@eslint/js";
import tseslint from "typescript-eslint";
import path from "node:path";
import { fileURLToPath } from "node:url";
import odavlBoundaries from "./eslint-plugin-odavl-boundaries/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default [
  // Global ignores
  {
    ignores: [
      "node_modules/**",
      "dist/**",
      ".next/**",
      "out/**",
      "reports/**",
      "coverage/**",
      ".prisma/**",
      "prisma/generated/**",
      "__pycache__/**",
      ".mypy_cache/**",
      "venv/**",
      ".venv/**",
      "github-actions/dist/**",
    ],
  },
  // JavaScript recommended
  js.configs.recommended,
  // TypeScript recommended (without type-checking for now)
  ...tseslint.configs.recommended,
  // Our custom rules
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: "module",
      },
    },
    plugins: {
      "@typescript-eslint": tseslint.plugin,
    },
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_" },
      ],
      "no-unused-vars": "off",
      "no-console": "error",
      "no-debugger": "error",
    },
  },
  // MJS/CJS files
  {
    files: ["**/*.mjs", "**/*.cjs"],
    languageOptions: {
      globals: {
        console: "readonly",
        process: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
      },
    },
    rules: {
      "no-console": "off",
    },
  },
  // Autopilot Engine - console.log allowed for CLI output
  {
    files: ["odavl-studio/autopilot/engine/**/*.ts"],
    rules: {
      "no-console": "off",
      "@typescript-eslint/no-require-imports": "off", // CommonJS needed for dynamic requires
      "@typescript-eslint/no-explicit-any": "warn", // Allow any in CLI (warn only)
      "no-empty": "warn", // Allow empty blocks (warn only)
    },
  },
  // Product Boundary Enforcement Rules
  {
    files: ["odavl-studio/insight/**/*.ts"],
    plugins: {
      "odavl-boundaries": odavlBoundaries,
    },
    rules: {
      "odavl-boundaries/no-cross-product-imports": "error",
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@odavl-studio/autopilot-*", "**/autopilot/**"],
              message: "❌ Insight cannot import from Autopilot (circular dependency).",
            },
            {
              group: ["@odavl-studio/guardian-*", "**/guardian/**"],
              message: "❌ Insight cannot import from Guardian (separate concerns).",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["odavl-studio/autopilot/**/*.ts"],
    plugins: {
      "odavl-boundaries": odavlBoundaries,
    },
    rules: {
      "odavl-boundaries/no-cross-product-imports": "error",
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@odavl-studio/insight-core/detector", "**/insight/**/detector/**"],
              message: "❌ Autopilot cannot import from Insight detectors (read JSON instead).",
            },
            {
              group: ["@odavl-studio/guardian-*", "**/guardian/**"],
              message: "❌ Autopilot cannot import from Guardian (website testing).",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["odavl-studio/guardian/**/*.ts"],
    plugins: {
      "odavl-boundaries": odavlBoundaries,
    },
    rules: {
      "odavl-boundaries/no-cross-product-imports": "error",
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@odavl-studio/insight-core/detector", "**/insight/**/detector/**"],
              message: "❌ Guardian cannot import from Insight detectors (code analysis).",
            },
            {
              group: ["@odavl-studio/autopilot-*", "**/autopilot/**"],
              message: "❌ Guardian cannot import from Autopilot (fixing logic).",
            },
          ],
        },
      ],
    },
  },
];
