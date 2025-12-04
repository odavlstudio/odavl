

import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/.next/**",
      "**/out/**",
      "**/reports/**",
      "**/coverage/**",
      "**/.prisma/**",
      "**/prisma/generated/**",
      "**/__pycache__/**",
      "**/.mypy_cache/**",
      "**/venv/**",
      "**/.venv/**",
      "github-actions/dist/**",
      "**/*.cjs",
      "**/*.mjs",
    ],
  },
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    files: ["**/*.ts", "**/*.tsx"],
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_" }
      ],
      "no-unused-vars": "off",
      "no-console": "error",
      "no-debugger": "error",
    },
  },
  {
    files: ["**/*.mjs"],
    languageOptions: {
      globals: {
        console: "readonly",
        process: "readonly"
      }
    }
  }
);



