/* eslint-disable import/no-commonjs */
module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint", "import"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:import/recommended",
    "plugin:import/typescript",
    "prettier"
  ],
  env: {
    node: true,
    jest: true
  },
  ignorePatterns: ["dist/**", "node_modules/**"],
  overrides: [
    {
      files: ["apps/web/src/**/*.{ts,tsx}"],
      rules: {
        "import/no-unresolved": [
          "error",
          {
            ignore: ["^@/"]
          }
        ]
      }
    }
  ],
  rules: {
    "@typescript-eslint/no-explicit-any": "error",

    // NOTE: NestJS heavily relies on runtime types (emitDecoratorMetadata + DI).
    // Forcing `import type` everywhere is easy to accidentally break DI (you'll see
    // `Nest can't resolve dependencies ... Function at index [x]` at runtime).
    // Keep this off for "dev comfort"; we can re-enable later with a stricter
    // code pattern (explicit `@Inject()` tokens) if desired.
    "@typescript-eslint/consistent-type-imports": "off",
    "import/order": [
      "error",
      {
        "newlines-between": "always",
        "alphabetize": { "order": "asc", "caseInsensitive": true }
      }
    ]
  }
};
