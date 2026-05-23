// Shared flat-config ESLint config for the DreamPak app family.
//
// Mirrors what each consumer was already hand-rolling (next core-web-vitals
// + next/typescript) and bakes in the `.vercel/**` ignore that Phase 5
// surfaced as drift across 5 of 8 consumers. Consumers re-export this
// from their own `eslint.config.mjs` with a single line:
//
//   import dpConfig from "@dreampak/design-system/eslint-config";
//   export default dpConfig;
//
// Or, if a consumer needs to extend, they can spread it:
//
//   import dpConfig from "@dreampak/design-system/eslint-config";
//   import { defineConfig } from "eslint/config";
//   export default defineConfig([...dpConfig, /* app-specific overrides */]);
//
// Peers expected on the consumer: eslint ^9, eslint-config-next ^16.
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const dpConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Globally ignore build artifacts that consistently pollute lint runs.
  // `.vercel/**` is the prebuilt-deploy output (per
  // `reference_prebuilt_deploy_workaround`) — 5 of 8 consumers had to add
  // this independently in Phase 5. Owning it here eliminates the drift.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Additional DreamPak family ignores:
    ".vercel/**",
    "node_modules/**",
    "dist/**",
  ]),
]);

export default dpConfig;
