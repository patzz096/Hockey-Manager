// Prépare dist/hockey-gm.html pour une publication en artefact Claude : le lecteur fournit
// lui-même <!doctype>, <html>, <head> et <body>, on ne garde donc que le titre, les styles,
// le point de montage et le script (tout est déjà en ligne grâce à vite-plugin-singlefile).
import { readFileSync, writeFileSync } from "node:fs";

const html = readFileSync("dist/index.html", "utf8");
const pick = (re) => [...html.matchAll(re)].map((m) => m[0]).join("\n");
const out = [
  pick(/<title>[\s\S]*?<\/title>/g),
  pick(/<style[\s\S]*?<\/style>/g),
  '<div id="root"></div>',
  pick(/<script[\s\S]*?<\/script>/g),
].join("\n");
writeFileSync("dist/hockey-gm.html", out);
console.log(`dist/hockey-gm.html : ${(out.length / 1024).toFixed(0)} Ko`);
