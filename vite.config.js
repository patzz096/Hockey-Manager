import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";

// `npm run build:artifact` produit un seul dist/index.html (JS et CSS en ligne),
// prêt à publier comme artefact sur Claude.ai ou à ouvrir directement en local (file://).
// Format de sortie IIFE (plutôt que le module ES par défaut de Vite) : un script `type="module"`
// ouvert en file:// est bloqué par la politique CORS des navigateurs (origine "null"), ce qui
// donne une page blanche silencieuse — l'IIFE s'exécute sans requête réseau, donc sans ce blocage.
export default defineConfig(({ mode }) => ({
  plugins: [react(), ...(mode === "artifact" ? [viteSingleFile()] : [])],
  build: mode === "artifact" ? { rollupOptions: { output: { format: "iife", inlineDynamicImports: true } } } : undefined,
}));
