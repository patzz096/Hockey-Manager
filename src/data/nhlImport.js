// Conversion des données de l'API LNH (scripts/fetch_nhl_rosters.py) vers le format des
// alignements réels du jeu ({ name, number, pos, age, nationality, attrs, ... }).
// Module autonome (aucun import) pour pouvoir être utilisé par le script Node d'importation.
//
// Calibrage : même principe que les alignements faits à la main — tous les attributs partent
// de 60 et seules les forces mesurées par les statistiques s'en écartent. Une équipe importée
// a donc la même échelle de cotes (vedette ~70-72, moyenne ~62-63) que les équipes existantes.

const COUNTRY_3_TO_2 = {
  CAN: "CA", USA: "US", SWE: "SE", FIN: "FI", RUS: "RU", CZE: "CZ", SVK: "SK", CHE: "CH",
  DEU: "DE", AUT: "AT", DNK: "DK", BLR: "BY", LVA: "LV", NOR: "NO", FRA: "FR", SVN: "SI",
  KAZ: "KZ", GBR: "GB", NLD: "NL", UKR: "UA", AUS: "AU", ITA: "IT", POL: "PL", JPN: "JP",
  KOR: "KR", HUN: "HU", LTU: "LT", EST: "EE", BRA: "BR", NGA: "NG", JAM: "JM", ZAF: "ZA",
};

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const clamp01 = (v) => clamp(v, 0, 1);
const round = (v) => Math.round(v);

function hash(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}
// Petite variation stable (-2..+2) pour que deux joueurs aux mêmes stats ne soient pas identiques.
function jitter(seed, key) { return (hash(`${seed}|${key}`) % 5) - 2; }

export function ageAt(birthDate, refDate) {
  if (!birthDate) return 25;
  const b = new Date(birthDate), r = new Date(refDate);
  let age = r.getFullYear() - b.getFullYear();
  if (r.getMonth() < b.getMonth() || (r.getMonth() === b.getMonth() && r.getDate() < b.getDate())) age--;
  return age;
}

export function mapPosition(code, shoots) {
  if (code === "C" || code === "G") return code;
  if (code === "L") return "LW";
  if (code === "R") return "RW";
  if (code === "D") return shoots === "R" ? "RD" : "LD";
  return "C";
}

function num(v) { return v == null || Number.isNaN(Number(v)) ? null : Number(v); }

function skaterAttrs(row, pos, age, seed) {
  const gp = num(row.pj) || 0;
  const hasStats = gp >= 10;
  const isD = pos === "LD" || pos === "RD";
  const lbs = num(row.poids_livres) || 195;
  const a = {};
  if (!hasStats) {
    // Espoir ou joueur sans vécu LNH : profil neutre, légèrement sous la moyenne.
    a.strength = round(clamp(55 + (lbs - 185) * 0.5, 50, 80));
    ["positioning", "defensiveRead", "offensiveRead", "passing", "shotAccuracy"].forEach((k) => { a[k] = 57 + jitter(seed, k); });
    return a;
  }
  const g = (num(row.buts) || 0) / gp;
  const ast = (num(row.passes) || 0) / gp;
  const pts = (num(row.points) || 0) / gp;
  const shots = (num(row.tirs) || 0) / gp;
  const pim = (num(row.pun) || 0) / gp;
  const pm82 = ((num(row.plus_minus) || 0) / gp) * 82;
  const toi = num(row.temps_glace_moy) ?? (isD ? 18 : 14);
  const fo = num(row.mises_au_jeu_pct);

  const off = clamp01(pts / (isD ? 0.95 : 1.5));
  const ice = isD ? clamp01((toi - 15) / 10) : clamp01((toi - 10) / 10);
  const vet = clamp01((age - 24) / 8);

  a.shotAccuracy = 58 + 26 * clamp01(g / (isD ? 0.25 : 0.55));
  a.shotRange = 58 + 20 * clamp01(shots / 3.8);
  a.gettingOpen = 58 + 22 * clamp01(g / (isD ? 0.25 : 0.5));
  a.passing = 58 + 26 * clamp01(ast / (isD ? 0.65 : 0.8));
  a.offensiveRead = 58 + 26 * off;
  a.puckhandling = 58 + 22 * off;

  a.positioning = 56 + 22 * ice + (isD ? 2 : 0) + clamp(pm82 / 6, -3, 4);
  a.defensiveRead = 56 + 22 * ice + clamp(pm82 / 6, -3, 4);
  a.shotBlocking = isD ? 58 + 20 * ice : 56;
  a.stickchecking = 58 + 14 * ice;
  a.checking = 55 + clamp(pim * 18 + (lbs - 195) * 0.4, 0, 25);
  a.hitting = 55 + clamp(pim * 20 + (lbs - 195) * 0.5, 0, 27);
  a.faceoffs = pos === "C" && fo != null ? clamp(50 + ((fo > 1 ? fo / 100 : fo) - 0.40) * 160, 45, 86) : pos === "C" ? 58 : 50;

  a.speed = 60 + 14 * off - Math.max(0, age - 30) * 1.5;
  a.acceleration = 60 + 12 * off - Math.max(0, age - 30) * 1.5;
  a.agility = 60 + 12 * off - Math.max(0, age - 31) * 1.2;
  a.stamina = 57 + 20 * ice;
  a.strength = clamp(55 + (lbs - 185) * 0.5, 50, 85);
  a.fighting = clamp(40 + pim * 30 + (lbs - 200) * 0.4, 30, 85);

  a.leadership = 56 + 16 * vet + 8 * ice;
  a.determination = 60 + 10 * ice;
  a.professionalism = 58 + 12 * vet;
  a.aggressiveness = clamp(52 + pim * 25, 45, 85);
  a.temperament = clamp(68 - pim * 15, 40, 75);
  a.bravery = 58 + 10 * ice;

  Object.keys(a).forEach((k) => { a[k] = clamp(round(a[k] + jitter(seed, k)), 25, 95); });
  return a;
}

function goalieAttrs(row, age, seed) {
  const gp = num(row.pj) || 0;
  let sv = num(row.pct_arrets);
  if (sv != null && sv > 1) sv /= 100;
  const gaa = num(row.moy_buts_contre);
  const q = gp >= 10 && sv != null ? clamp01((sv - 0.885) / 0.04 - (gaa != null ? (gaa - 2.8) * 0.1 : 0)) * clamp01(0.5 + gp / 80) : 0.3;
  const vet = clamp01((age - 24) / 8);
  const a = {
    reflexes: 58 + 26 * q,
    positioning: 58 + 24 * q,
    reboundControl: 56 + 22 * q,
    recovery: 56 + 20 * q,
    lateralMovement: 58 + 20 * q,
    agility: 60 + 8 * q - Math.max(0, age - 32) * 1.5,
    determination: 60 + 8 * q,
    leadership: 56 + 12 * vet,
    professionalism: 58 + 10 * vet,
  };
  Object.keys(a).forEach((k) => { a[k] = clamp(round(a[k] + jitter(seed, k)), 25, 95); });
  return a;
}

export function convertPlayer(row, refDate) {
  const shoots = row.tire_la_main || null;
  const pos = mapPosition(row.position, shoots);
  const age = ageAt(row.date_naissance, refDate);
  const seed = String(row.id_joueur ?? `${row.prenom} ${row.nom}`);
  const inches = num(row.taille_pouces), lbs = num(row.poids_livres);
  return {
    name: `${row.prenom ?? ""} ${row.nom ?? ""}`.trim(),
    number: num(row.numero_maillot) ?? undefined,
    pos,
    age,
    nationality: COUNTRY_3_TO_2[row.pays_naissance] || row.pays_naissance || undefined,
    shoots: shoots === "L" ? "Gauche" : shoots === "R" ? "Droite" : undefined,
    heightCm: inches ? Math.round(inches * 2.54) : undefined,
    weightKg: lbs ? Math.round(lbs * 0.4536) : undefined,
    nhlId: row.id_joueur ?? undefined,
    attrs: pos === "G" ? goalieAttrs(row, age, seed) : skaterAttrs(row, pos, age, seed),
  };
}

// rows : tableau produit par fetch_nhl_rosters.py. Renvoie { [équipe]: [joueurs] }.
export function convertRoster(rows, { refDate = new Date().toISOString().slice(0, 10), teams = null } = {}) {
  const out = {};
  rows.forEach((row) => {
    if (!row.equipe || (teams && !teams.includes(row.equipe))) return;
    (out[row.equipe] ||= []).push(convertPlayer(row, refDate));
  });
  return out;
}
