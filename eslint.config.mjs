import js from "@eslint/js";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";

export default [
  js.configs.recommended,
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: { project: "./tsconfig.json", tsconfigRootDir: import.meta.dirname }
      import js from "@eslint/js";
      import tseslint from "@typescript-eslint/eslint-plugin";
      import tsparser from "@typescript-eslint/parser";

      export default [
        js.configs.recommended,
        {
          files: ["**/*.ts", "**/*.tsx"],
          languageOptions: {
            parser: tsparser,
            parserOptions: {
              project: "./tsconfig.json",
              tsconfigRootDir: __dirname,
              sourceType: "module",
              ecmaVersion: 2022,
            },
          },
          plugins: {
            "@typescript-eslint": tseslint,
          },
          rules: {
            "@typescript-eslint/no-unused-vars": [
              "warn",
              { argsIgnorePattern: "^_" }
            ],
            "no-unused-vars": "off",
          },
        },
      ];
      "dist/**",
      "node_modules/**",
      "reports/**",
      "apps/vscode-ext/out/**",
      "apps/vscode-ext/dist/**",
      "apps/vscode-ext/validate-extension.js",
      "apps/cli/dist/**",
      "odavl-website/.next/**",
      "odavl-website/node_modules/**",
      "odavl-website/next-env.d.ts",
      "odavl-website/postcss.config.js",
      "odavl-website/scripts/**",
      "archive/**",
      "*.cjs"
    ]
    }
];
