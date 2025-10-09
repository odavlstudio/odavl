import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.ts","**/*.tsx"],
    ...tseslint.configs.recommendedTypeChecked[0],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: { 
        project: ["./tsconfig.json", "./odavl-website/tsconfig.json"], 
        tsconfigRootDir: import.meta.dirname 
      }
    },
    rules: {
      "@typescript-eslint/no-unused-vars": ["warn", { "argsIgnorePattern": "^_", "varsIgnorePattern":"^_" }]
    }
  },
  {
    files: ["**/*.mjs"],
    languageOptions: {
      globals: {
        console: "readonly",
        process: "readonly"
      }
    }
  },
  {
    ignores: ["dist/**","node_modules/**","reports/**","apps/vscode-ext/out/**","apps/vscode-ext/dist/**","apps/cli/dist/**","odavl-website/.next/**","odavl-website/node_modules/**","odavl-website/next-env.d.ts","odavl-website/postcss.config.js","odavl-website/scripts/**"]
  }
];
