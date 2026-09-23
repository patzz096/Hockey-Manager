// Convertit le JSON de scripts/fetch_nhl_rosters.py en alignements du jeu.
//   node scripts/import-nhl-rosters.mjs alignement_complet_nhl.json          (équipes sans alignement réel)
//   node scripts/import-nhl-rosters.mjs alignement_complet_nhl.json --all    (les 32 équipes)
// Écrit src/data/rosters/nhl-import.json. Par défaut, les alignements faits à la main (avec
// contrats) restent prioritaires ; avec --all, l'import les remplace.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { convertRoster } from "../src/data/nhlImport.js";

const [, , input, ...flags] = process.argv;
if (!input) {
  console.error("Usage: node scripts/import-nhl-rosters.mjs <alignement_complet_nhl.json> [--all]");
  process.exit(1);
}
const rows = JSON.parse(readFileSync(input, "utf8").replace(/^\uFEFF/, ""));
const HANDMADE = ["MTL", "TOR", "BOS", "BUF", "DET", "FLA", "OTT", "TBL", "CAR", "NYR", "NYI", "NJD", "PHI", "PIT", "WSH", "CBJ"];
const all = flags.includes("--all");
const teamsInFile = [...new Set(rows.map((r) => r.equipe))];
const teams = all ? teamsInFile : teamsInFile.filter((t) => !HANDMADE.includes(t));
const converted = convertRoster(rows, { teams });

const out = join(dirname(fileURLToPath(import.meta.url)), "../src/data/rosters/nhl-import.json");
writeFileSync(out, JSON.stringify({ generatedAt: new Date().toISOString().slice(0, 10), replaceHandmade: all, teams: converted }, null, 1) + "\n");

let withoutStats = 0;
Object.entries(converted).forEach(([team, players]) => {
  const noStats = rows.filter((r) => r.equipe === team && !(r.pj >= 10)).length;
  withoutStats += noStats;
  const count = (p) => players.filter((x) => p.includes(x.pos)).length;
  console.log(`${team}: ${players.length} joueurs (C ${count(["C"])}, AG ${count(["LW"])}, AD ${count(["RW"])}, D ${count(["LD", "RD"])}, G ${count(["G"])})${noStats ? ` — ${noStats} sans stats LNH` : ""}`);
});
console.log(`\n${Object.keys(converted).length} équipes écrites dans src/data/rosters/nhl-import.json${withoutStats ? ` (${withoutStats} joueurs sans 10+ matchs LNH : profil neutre)` : ""}`);
