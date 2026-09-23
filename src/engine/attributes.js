export const OFFENSIVE = ["screening", "gettingOpen", "passing", "puckhandling", "shotAccuracy", "shotRange", "offensiveRead"];

export const DEFENSIVE = ["checking", "faceoffs", "hitting", "positioning", "shotBlocking", "stickchecking", "defensiveRead"];

export const MENTAL = ["aggressiveness", "bravery", "determination", "teamPlayer", "leadership", "temperament", "professionalism"];

export const PHYSICAL = ["acceleration", "agility", "balance", "speed", "stamina", "strength", "fighting"];

export const SKATER_CATEGORIES = [
  { key: "offensive", label: "Cotes offensives", attrs: OFFENSIVE },
  { key: "defensive", label: "Cotes défensives", attrs: DEFENSIVE },
  { key: "mental", label: "Cotes mentales", attrs: MENTAL },
  { key: "physical", label: "Cotes physiques", attrs: PHYSICAL },
];

export const GOALIE_TECH = ["reflexes", "positioning", "reboundControl", "puckhandling", "recovery", "lateralMovement"];

export const GOALIE_PHYSICAL = ["acceleration", "agility", "balance", "flexibility", "stamina", "strength"];

export const GOALIE_CATEGORIES = [
  { key: "technique", label: "Cotes techniques", attrs: GOALIE_TECH },
  { key: "mental", label: "Cotes mentales", attrs: MENTAL },
  { key: "physical", label: "Cotes physiques", attrs: GOALIE_PHYSICAL },
];

export const ATTR_LABELS = {
  screening: "Écran", gettingOpen: "Démarquage", passing: "Passes", puckhandling: "Maniement de rondelle",
  shotAccuracy: "Précision de tir", shotRange: "Portée de tir", offensiveRead: "Lecture offensive",
  checking: "Mise en échec", faceoffs: "Mises au jeu", hitting: "Contact physique", positioning: "Positionnement",
  shotBlocking: "Blocage de tirs", stickchecking: "Échec avec bâton", defensiveRead: "Lecture défensive",
  aggressiveness: "Agressivité", bravery: "Courage", determination: "Détermination", teamPlayer: "Esprit d'équipe",
  leadership: "Leadership", temperament: "Tempérament", professionalism: "Professionnalisme",
  acceleration: "Accélération", agility: "Agilité", balance: "Équilibre", speed: "Vitesse", stamina: "Endurance",
  strength: "Force", fighting: "Bagarre", reflexes: "Réflexes", reboundControl: "Contrôle de rebond",
  recovery: "Récupération", lateralMovement: "Déplacement latéral", flexibility: "Flexibilité",
};

export function avg(attrs, keys) { return keys.reduce((a, k) => a + attrs[k], 0) / keys.length; }

export function computeOvr(pos, attrs) {
  if (pos === "G") return Math.round(avg(attrs, GOALIE_TECH) * 0.55 + avg(attrs, GOALIE_PHYSICAL) * 0.25 + avg(attrs, MENTAL) * 0.20);
  const off = avg(attrs, OFFENSIVE), def = avg(attrs, DEFENSIVE), men = avg(attrs, MENTAL), phy = avg(attrs, PHYSICAL);
  if (pos === "D" || pos === "LD" || pos === "RD") return Math.round(def * 0.40 + phy * 0.25 + off * 0.20 + men * 0.15);
  return Math.round(off * 0.45 + phy * 0.25 + men * 0.15 + def * 0.15);
}

export function potentialCeiling(age, rng) {
  const maxBonus = age <= 19 ? 20 : age <= 22 ? 12 : age <= 26 ? 4 : 0;
  return Math.round(rng() * maxBonus);
}

export function emptyAttrs(pos, val = 60) {
  const keys = pos === "G" ? [...GOALIE_TECH, ...MENTAL, ...GOALIE_PHYSICAL] : [...OFFENSIVE, ...DEFENSIVE, ...MENTAL, ...PHYSICAL];
  const o = {}; keys.forEach((k) => (o[k] = val)); return o;
}

export function attr20(val) { return Math.max(1, Math.min(20, Math.round((val / 99) * 20))); }

export function teamOvrBenchmark(team) {
  if (!team || !team.roster.length) return 65;
  return team.roster.reduce((a, p) => a + p.ovr, 0) / team.roster.length;
}

export function starsFor(value, benchmark) {
  const diff = value - benchmark;
  const steps = [20, 14, 8, 3, -3, -8, -14, -20];
  const vals = [5, 4.5, 4, 3.5, 3, 2.5, 2, 1.5];
  for (let i = 0; i < steps.length; i++) if (diff >= steps[i]) return vals[i];
  return 1;
}
