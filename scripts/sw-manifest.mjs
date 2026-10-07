// Après `vite build --mode pages`, injecte dans dist/sw.js la liste exacte des fichiers de CETTE
// build (CACHE_VERSION + PRECACHE_URLS) pour un précache atomique — voir le commentaire en tête de
// public/sw.js pour le bug que ça corrige (page blanche hors ligne après un déploiement si le
// cache se retrouvait à moitié rempli).
import { createHash } from "node:crypto";
import { readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join, relative, sep } from "node:path";

const DIST = "dist";
const BASE = "/Hockey-Manager/"; // doit rester synchronisé avec `base` du mode "pages" dans vite.config.js

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

const files = walk(DIST).filter((f) => relative(DIST, f) !== "sw.js");
const urls = files
  .map((f) => BASE + relative(DIST, f).split(sep).join("/"))
  .sort();
// Une navigation vers la racine (ouverture depuis l'icône "Ajouter à l'écran d'accueil", voir
// manifest.json start_url) demande l'URL "/Hockey-Manager/" (sans "index.html") — Cache.match ne
// fait pas la correspondance entre les deux, donc on précache aussi cet alias séparément.
if (urls.includes(BASE + "index.html")) urls.push(BASE);

const hash = createHash("sha256");
for (const f of files.slice().sort()) hash.update(readFileSync(f));
const version = hash.digest("hex").slice(0, 12);

const swPath = join(DIST, "sw.js");
let sw = readFileSync(swPath, "utf8");
sw = sw
  .replace("__CACHE_VERSION__", version)
  .replace("__PRECACHE_URLS__", JSON.stringify(urls));
writeFileSync(swPath, sw);

console.log(`sw.js : précache ${urls.length} fichiers, version ${version}`);
