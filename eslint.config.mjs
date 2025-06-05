import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  // ignore generated files and external modules
  { ignores: ['.next/**', 'coverage/**', 'node_modules/**'] },
  // existing Next.js presets
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
];

export default eslintConfig;
