import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";

// `npm run build:artifact` produit un seul dist/index.html (JS et CSS en ligne),
// prêt à publier comme artefact sur Claude.ai ou à ouvrir directement en local (file://).
// Format de sortie IIFE (plutôt que le module ES par défaut de Vite) : un script `type="module"`
// ouvert en file:// est bloqué par la politique CORS des navigateurs (origine "null"), ce qui
// donne une page blanche silencieuse — l'IIFE s'exécute sans requête réseau, donc sans ce blocage.
//
// `npm run build:pages` produit un build normal (multi-fichiers, module ES) sous `/Hockey-Manager/`
// pour l'hébergement GitHub Pages (voir .github/workflows/pages.yml) : c'est cette version, servie
// en HTTPS, qui porte le service worker (public/sw.js) permettant le mode hors ligne une fois
// ajoutée à l'écran d'accueil — un artefact ou un fichier local ne peuvent pas l'enregistrer.
export default defineConfig(({ mode }) => ({
  plugins: [react(), ...(mode === "artifact" ? [viteSingleFile()] : [])],
  base: mode === "pages" ? "/Hockey-Manager/" : "/",
  build: mode === "artifact" ? { rollupOptions: { output: { format: "iife", inlineDynamicImports: true } } } : undefined,
}));
