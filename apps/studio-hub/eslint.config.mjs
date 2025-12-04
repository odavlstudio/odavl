import js from "@eslint/js";
import nextPlugin from "eslint-config-next";
import tseslint from "typescript-eslint";

/** @type {import('eslint').Linter.Config[]} */
const eslintConfig = [
  // Ignores (must be first)
  {
    ignores: [
      ".next/**",
      "out/**",
      "build/**",
      "dist/**",
      "node_modules/**",
      "coverage/**",
      "playwright-report/**",
      "test-results/**",
      "next-env.d.ts",
      "*.config.js",
      "*.config.mjs",
      ".contentful/**",
    ],
  },

  // Base configs
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  nextPlugin,

  // Custom rules
  {
    languageOptions: {
      parserOptions: {
        project: "./tsconfig.json",
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // TypeScript strict rules
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/explicit-module-boundary-types": "off",
      "@typescript-eslint/no-non-null-assertion": "warn",
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/await-thenable": "error",
      "@typescript-eslint/no-misused-promises": [
        "error",
        {
          checksVoidReturn: false,
        },
      ],

      // Code quality
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "no-debugger": "error",
      "no-alert": "warn",
      complexity: ["warn", 20],
      "max-lines-per-function": ["warn", { max: 200, skipBlankLines: true, skipComments: true }],
      "max-depth": ["warn", 4],
      "max-nested-callbacks": ["warn", 3],

      // Best practices
      eqeqeq: ["error", "always"],
      "no-eval": "error",
      "no-implied-eval": "error",
      "no-new-func": "error",
      "no-return-await": "off", // Disabled in favor of @typescript-eslint/return-await
      "@typescript-eslint/return-await": ["error", "in-try-catch"],
      "require-await": "off", // Disabled in favor of @typescript-eslint/require-await
      "@typescript-eslint/require-await": "error",

      // React/Next.js specific
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",

      // Import rules
      "no-duplicate-imports": "error",
      "sort-imports": [
        "warn",
        {
          ignoreCase: true,
          ignoreDeclarationSort: true,
        },
      ],

      // Security
      "no-eval": "error",
      "no-implied-eval": "error",
      "no-new-func": "error",
      "no-script-url": "error",
    },
  },

  // Specific overrides for test files
  {
    files: ["**/*.test.ts", "**/*.test.tsx", "**/*.spec.ts", "**/*.spec.tsx"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "max-lines-per-function": "off",
    },
  },

  // Specific overrides for config files
  {
    files: ["*.config.ts", "*.config.js", "*.config.mjs"],
    rules: {
      "no-console": "off",
      "@typescript-eslint/no-var-requires": "off",
    },
  },
];

export default eslintConfig;
