import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";

export default defineConfig([
  ...nextVitals,
  {
    rules: {
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/purity": "off",
      "@next/next/no-html-link-for-pages": "off",
      "@next/next/no-img-element": "off",
      "react/no-unescaped-entities": "off",
      "jsx-a11y/role-supports-aria-props": "off",
      "import/no-anonymous-default-export": "off",
      "@next/next/no-assign-module-variable": "off",
      "@next/internal/typechecked-require": "off",
      "@next/internal/no-ambiguous-jsx": "off",
      "react/no-find-dom-node": "off",
    },
  },
  globalIgnores([
    ".next/**",
    ".next-dev/**",
    "out/**",
    "build/**",
    "graphify-out/**",
    "convex/_generated/**",
    "next-env.d.ts",
  ]),
]);
