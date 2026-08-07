import js from "@eslint/js";
import globals from "globals";
import eslintConfigPrettier from "eslint-config-prettier";

export default [
  js.configs.recommended,
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node, // Au cas où tu aies des scripts Node.js
      },
    },
  },
  eslintConfigPrettier,
];
