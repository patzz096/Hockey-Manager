import { parseRosterFile, parseCsv } from "./rosterFile";
import { OFFENSIVE, DEFENSIVE, MENTAL, PHYSICAL, GOALIE_TECH, GOALIE_PHYSICAL } from "../engine/attributes";

// ---------------------------------------------------------------------------------------
// Pack de personnalisation : UN fichier .json partageable qui contient tout ou partie de
//   - la base d'alignements (joueurs, attributs, contrats) : `teams`, `teamInfo` ;
//   - les logos (`logos` : { MTL: "data:image/png;base64,..." }) ;
//   - le facepack (`faces` : { "8478402": "data:...", "cole_caufield": "data:..." }).
// Il se prépare hors du jeu (éditeur de pack, éditeur de texte, ou tableur via le CSV) puis
// s'importe dans l'onglet Personnalisation. Les montants de contrat y sont en millions de $
// (`salaryM: 7.875`) ; « salary » en milliers de $ ou en dollars est aussi accepté.
// Voir docs/pack-personnalisation.md.
// ---------------------------------------------------------------------------------------

export const PACK_FORMAT = "hockey-gm-pack";
const round25 = (v) => Math.round(v / 25) * 25;

// Montant → milliers de $ : millions (salaryM), dollars (> 100 000) ou milliers.
function toK(m, raw) {
  if (m != null && m !== "") return round25(Number(String(m).replace(",", ".")) * 1000);
  if (raw == null || raw === "") return null;
  const n = Number(String(raw).replace(/[\s$]/g, "").replace(",", "."));
  if (!isFinite(n)) return null;
  return round25(n > 100000 ? n / 1000 : n < 100 ? n * 1000 : n);
}
export function normalizeContract(c) {
  if (!c) return c;
  const salary = toK(c.salaryM, c.salary);
  const out = { years: Math.max(1, Math.min(8, Math.round(Number(c.years) || 1))), salary: salary ?? 850, type: c.type === "two" || c.type === 2 || c.type === "2" ? "two" : "one" };
  if (out.type === "two") out.ahlSalary = toK(c.ahlSalaryM, c.ahlSalary) ?? 80;
  if (c.noTrade) out.noTrade = true;
  if (c.elc) out.elc = true;
  if (Array.isArray(c.bonuses)) out.bonuses = c.bonuses.map((b) => ({ kind: b.kind, target: Number(b.target), amount: toK(b.amountM, b.amount) ?? 0 }));
  return out;
}
// Contrat pour le fichier : montants en millions, plus lisibles.
function contractForFile(c) {
  if (!c) return null;
  const out = { years: c.years, salaryM: c.salary / 1000, type: c.type || "one" };
  if (c.type === "two") out.ahlSalaryM = (c.ahlSalary || 80) / 1000;
  if (c.noTrade) out.noTrade = true;
  if (c.elc) out.elc = true;
  if (c.bonuses?.length) out.bonuses = c.bonuses.map((b) => ({ kind: b.kind, target: b.target, amountM: b.amount / 1000 }));
  return out;
}
const stripPlayer = (p) => ({ name: p.name, number: p.number, pos: p.pos, age: p.age, nationality: p.nationality, shoots: p.shoots, heightCm: p.heightCm, weightKg: p.weightKg, nhlId: p.nhlId, potential: p.potential, contract: contractForFile(p.contract), attrs: p.attrs });

async function blobToDataUrl(blob) {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return `data:${blob.type || "image/png"};base64,${btoa(bin)}`;
}
async function dataUrlToBlob(url) { return (await fetch(url)).blob(); }

// Pack complet de la ligue en cours. images : { logos: { id: Blob }, faces: { clé: Blob } }.
export async function buildPack(teams, images = {}, meta = {}) {
  const enc = async (map) => Object.fromEntries(await Promise.all(Object.entries(map || {}).map(async ([k, b]) => [k, b instanceof Blob ? await blobToDataUrl(b) : b])));
  return {
    format: PACK_FORMAT,
    version: 2,
    name: meta.name || "Mon pack Hockey GM",
    author: meta.author || "",
    createdAt: new Date().toISOString().slice(0, 10),
    notes: "Montants de contrat en millions de $ (salaryM). Attributs de 1 à 99 (affichés /20 dans le jeu).",
    teamInfo: Object.fromEntries(teams.map((t) => [t.id, { city: t.city, name: t.name, color: t.color, division: t.division, capacity: t.capacity }])),
    teams: Object.fromEntries(teams.map((t) => [t.id, t.roster.map(stripPlayer)])),
    logos: await enc(images.logos),
    faces: await enc(images.faces),
  };
}

// Lecture d'un fichier : pack complet, base du jeu, JSON/CSV du script LNH, ou CSV du tableur.
// Renvoie { db: { teams, teamInfo } | null, logos: { id: Blob }, faces: { clé: Blob }, meta }.
export async function parsePackFile(text, filename = "") {
  const clean = text.replace(/^\uFEFF/, "").trim();
  if (/^[{[]/.test(clean)) {
    const data = JSON.parse(clean);
    if (data?.format === PACK_FORMAT) {
      const dec = async (map) => Object.fromEntries(await Promise.all(Object.entries(map || {}).filter(([, v]) => typeof v === "string" && v.startsWith("data:image/")).map(async ([k, v]) => [k, await dataUrlToBlob(v)])));
      const hasTeams = data.teams && Object.keys(data.teams).length > 0;
      const db = hasTeams ? parseRosterFile(JSON.stringify({ format: "hockey-gm-db", teams: data.teams, teamInfo: data.teamInfo || {} })) : null;
      if (db) normalizeDb(db);
      return { db, teamInfo: data.teamInfo || {}, logos: await dec(data.logos), faces: await dec(data.faces), meta: { name: data.name, author: data.author, createdAt: data.createdAt } };
    }
  } else if (isSheetCsv(clean)) {
    return { db: normalizeDb(parseSheetCsv(clean)), teamInfo: {}, logos: {}, faces: {}, meta: { name: filename } };
  }
  const db = normalizeDb(parseRosterFile(clean, filename));
  return { db, teamInfo: db.teamInfo || {}, logos: {}, faces: {}, meta: { name: filename } };
}
function normalizeDb(db) {
  Object.values(db.teams).forEach((list) => list.forEach((p) => { if (p.contract) p.contract = normalizeContract(p.contract); }));
  return db;
}

// ------------------------------- CSV pour tableur (Excel) -------------------------------
const SKATER_ATTRS = [...OFFENSIVE, ...DEFENSIVE, ...MENTAL, ...PHYSICAL];
const GOALIE_ATTRS = [...GOALIE_TECH, ...GOALIE_PHYSICAL.filter((k) => !PHYSICAL.includes(k))];
const ALL_ATTRS = [...new Set([...SKATER_ATTRS, ...GOALIE_ATTRS])];
const CSV_COLS = ["equipe", "nom", "position", "age", "nationalite", "numero", "salaire_M", "annees", "volets", "salaire_LAH_M", "potentiel", ...ALL_ATTRS];
// Format d'Excel en français : séparateur « ; », décimales à virgule.
const esc = (v) => { const s = v == null ? "" : typeof v === "number" ? String(v).replace(".", ",") : String(v); return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };

export function exportSheetCsv(teams) {
  const rows = [CSV_COLS.join(";")];
  teams.forEach((t) => t.roster.forEach((p) => {
    const c = p.contract || {};
    rows.push([t.id, p.name, p.pos, p.age, p.nationality, p.number, c.salary != null ? c.salary / 1000 : "", c.years ?? "", c.type === "two" ? 2 : 1, c.type === "two" ? (c.ahlSalary || 80) / 1000 : "", p.potential, ...ALL_ATTRS.map((k) => p.attrs?.[k] ?? "")].map(esc).join(";"));
  }));
  return "\uFEFF" + rows.join("\n");
}
const isSheetCsv = (text) => { const head = text.split(/\r?\n/)[0].toLowerCase(); return head.includes("equipe") && head.includes("salaire_m"); };
function parseSheetCsv(text) {
  const teams = {};
  parseCsv(text).forEach((r) => {
    const team = String(r.equipe || "").toUpperCase().trim();
    if (!team || !r.nom) return;
    const attrs = {};
    ALL_ATTRS.forEach((k) => { if (r[k] != null && r[k] !== "") attrs[k] = Math.max(1, Math.min(99, Number(r[k]))); });
    (teams[team] ||= []).push({
      name: r.nom, pos: String(r.position || "").toUpperCase(), age: Number(String(r.age).replace(",", ".")) || 25, nationality: r.nationalite || "CA", number: r.numero ? Number(r.numero) : undefined,
      potential: r.potentiel ? Number(r.potentiel) : undefined, attrs,
      contract: r.salaire_M ? { salaryM: r.salaire_M, years: r.annees || 1, type: String(r.volets) === "2" ? "two" : "one", ahlSalaryM: r.salaire_LAH_M } : undefined,
    });
  });
  return parseRosterFile(JSON.stringify({ format: "hockey-gm-db", teams, teamInfo: {} }));
}
