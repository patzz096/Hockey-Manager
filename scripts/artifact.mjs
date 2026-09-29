// Prépare dist/hockey-gm.html pour une publication en artefact Claude : le lecteur fournit
// lui-même <!doctype>, <html>, <head> et <body>, on ne garde donc que le titre, les styles,
// le point de montage et le script (tout est déjà en ligne grâce à vite-plugin-singlefile).
import { readFileSync, writeFileSync } from "node:fs";

// dist/index.html doit aussi s'ouvrir tel quel en local (double-clic, file://) : un script
// `type="module"` y est bloqué par la politique CORS des navigateurs (origine "null" en
// file://), qui donne une page blanche silencieuse. Le bundle est déjà généré en IIFE (voir
// vite.config.js, mode "artifact") ; il reste à retirer ces attributs du <script> injecté par
// Vite, et à le déplacer en fin de <body> : Vite le laisse dans le <head> (sans effet pour un
// module, différé jusqu'à la fin du parsing), mais un script normal inline s'exécute dès sa
// rencontre — avant que #root n'existe — sans ce déplacement.
let html = readFileSync("dist/index.html", "utf8");
html = html.replace(/<script type="module" crossorigin/g, "<script");
const scriptMatch = html.match(/<script>[\s\S]*?<\/script>/);
if (scriptMatch) {
  // Remplacement par une fonction : le bundle contient des séquences ($&, $`...) qui seraient
  // sinon interprétées comme des motifs spéciaux de replace() si passées en chaîne, corrompant
  // la sortie (contenu dupliqué).
  html = html.replace(scriptMatch[0], () => "").replace("</body>", () => `${scriptMatch[0]}\n  </body>`);
}
writeFileSync("dist/index.html", html);
const pick = (re) => [...html.matchAll(re)].map((m) => m[0]).join("\n");
const out = [
  pick(/<title>[\s\S]*?<\/title>/g),
  pick(/<style[\s\S]*?<\/style>/g),
  '<div id="root"></div>',
  pick(/<script[\s\S]*?<\/script>/g),
].join("\n");
writeFileSync("dist/hockey-gm.html", out);
console.log(`dist/hockey-gm.html : ${(out.length / 1024).toFixed(0)} Ko`);
