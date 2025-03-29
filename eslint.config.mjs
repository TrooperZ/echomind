import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.config({extends: ["next/core-web-vitals", "next/typescript"], 	"rules": {
	  "@typescript-eslint/no-unused-vars": "off",        // Disable unused variable check
	  "@typescript-eslint/no-require-imports": "off",    // Disable forbidden require imports
	  "@typescript-eslint/no-explicit-any": "off",       // Disable explicit any type check
	  "react-hooks/exhaustive-deps": "off"               // Disable React Hooks exhaustive deps warning
	}}),
];

export default eslintConfig;
