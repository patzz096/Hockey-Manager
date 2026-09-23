// Construit l'éditeur de pack autonome : dist/editeur-pack.html.
// La base par défaut du jeu est générée par le moteur (rolldown) puis injectée dans la page.
import { rolldown } from "rolldown";
import { readFile, writeFile, mkdir, rm } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const tmp = path.join(root, "node_modules/.cache/pack-editor.mjs");
await mkdir(path.dirname(tmp), { recursive: true });
const bundle = await rolldown({ input: path.join(root, "tools/pack-editor/defaultPack.js"), logLevel: "silent" });
await bundle.write({ file: tmp, format: "esm" });
const { editorData } = await import(pathToFileURL(tmp).href + `?t=${Date.now()}`);
const data = await editorData();
await rm(tmp, { force: true });
const html = (await readFile(path.join(root, "tools/pack-editor/editeur.html"), "utf8"))
  .replace("/*__EDITOR_DATA__*/null", () => JSON.stringify(data).replace(/</g, "\\u003c"));
await mkdir(path.join(root, "dist"), { recursive: true });
await writeFile(path.join(root, "dist/editeur-pack.html"), html);
console.log(`dist/editeur-pack.html : ${Math.round(html.length / 1024)} Ko`);
