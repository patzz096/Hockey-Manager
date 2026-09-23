import { convertRoster } from "../data/nhlImport";

// Formats de base de données acceptés :
//  1. Format du jeu (exporté par « Exporter la base ») : { format: "hockey-gm-db", teams: { MTL: [joueur...] }, teamInfo? }
//  2. JSON du script fetch_nhl_rosters.py : [ { equipe, prenom, nom, position, ... } ]
//  3. CSV du même script (alignement_complet_nhl.csv), ou tout CSV avec ces colonnes.
export function parseRosterFile(text, filename = "") {
  const clean = text.replace(/^\uFEFF/, "").trim();
  let rows;
  if (/\.csv$/i.test(filename) || !/^[[{]/.test(clean)) rows = parseCsv(clean);
  else {
    const data = JSON.parse(clean);
    if (data && data.format === "hockey-gm-db") return validate({ teams: data.teams || {}, teamInfo: data.teamInfo || {} });
    if (data && !Array.isArray(data) && data.teams) return validate({ teams: data.teams, teamInfo: data.teamInfo || {} });
    rows = data;
  }
  if (!Array.isArray(rows)) throw new Error("Format non reconnu.");
  return validate({ teams: convertRoster(rows), teamInfo: {} });
}

function validate(db) {
  const POS = ["C", "LW", "RW", "LD", "RD", "G"];
  Object.entries(db.teams).forEach(([team, players]) => {
    if (!Array.isArray(players)) throw new Error(`Équipe ${team} : liste de joueurs attendue.`);
    players.forEach((p, i) => {
      if (!p.name) throw new Error(`Équipe ${team}, joueur ${i + 1} : nom manquant.`);
      if (!POS.includes(p.pos)) throw new Error(`${p.name} : position « ${p.pos} » invalide (${POS.join(", ")}).`);
    });
  });
  return db;
}

// Séparateur détecté sur la ligne d'en-tête : « ; » (Excel en français, décimales à virgule)
// ou « , ».
export function parseCsv(text) {
  const firstLine = text.split(/\r?\n/)[0];
  const sep = firstLine.includes(";") ? ";" : ",";
  const lines = [];
  let row = [], field = "", quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === sep) { row.push(field); field = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field); lines.push(row); row = []; field = "";
    } else field += c;
  }
  if (field || row.length) { row.push(field); lines.push(row); }
  const [header, ...body] = lines.filter((l) => l.some((x) => x !== ""));
  return body.map((l) => Object.fromEntries(header.map((h, i) => [h.trim(), l[i] === "" ? null : l[i]])));
}

// Exporte la ligue en cours au format du jeu : modifiable dans un éditeur de texte puis réimportable.
export function exportLeagueDb(teams) {
  const strip = (p) => ({ name: p.name, number: p.number, pos: p.pos, age: p.age, nationality: p.nationality, shoots: p.shoots, heightCm: p.heightCm, weightKg: p.weightKg, nhlId: p.nhlId, potential: p.potential, contract: p.contract, attrs: p.attrs });
  return {
    format: "hockey-gm-db",
    version: 1,
    exportedAt: new Date().toISOString().slice(0, 10),
    teamInfo: Object.fromEntries(teams.map((t) => [t.id, { city: t.city, name: t.name, color: t.color, division: t.division, capacity: t.capacity }])),
    teams: Object.fromEntries(teams.map((t) => [t.id, t.roster.map(strip)])),
  };
}
