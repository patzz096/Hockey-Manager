import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";

// `npm run build:artifact` produit un seul dist/index.html (JS et CSS en ligne),
// prêt à publier comme artefact sur Claude.ai.
export default defineConfig(({ mode }) => ({
  plugins: [react(), ...(mode === "artifact" ? [viteSingleFile()] : [])],
}));
