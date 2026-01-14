import js from "@eslint/js";
import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import reactHooks from "eslint-plugin-react-hooks";

const tsRecommended = tsPlugin.configs.recommended;
const hooksRecommended = reactHooks.configs.recommended;

export default [
  {
    ignores: ["dist", "node_modules", "public/*.png"],
  },
  js.configs.recommended,
  {
    files: ["**/*.{ts,tsx,js,jsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: "module",
      },
      globals: {
        window: "readonly",
        navigator: "readonly",
        document: "readonly",
        fetch: "readonly",
        localStorage: "readonly",
        clearTimeout: "readonly",
        HTMLInputElement: "readonly",
        Blob: "readonly",
        URL: "readonly",
        File: "readonly",
        HTMLCanvasElement: "readonly",
        CanvasRenderingContext2D: "readonly",
        StorageEvent: "readonly",
        ServiceWorkerRegistration: "readonly",
      },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
      "react-hooks": reactHooks,
    },
    rules: {
      ...(tsRecommended?.rules ?? {}),
      ...(hooksRecommended?.rules ?? {}),
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/no-misused-promises": "off",
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
];
