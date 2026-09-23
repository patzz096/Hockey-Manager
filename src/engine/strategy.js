import { DEFENSIVE, avg } from "./attributes";

// Systèmes de jeu façon coaching NHL. Chaque système a un "fit" qui dépend des attributs
// réels de l'effectif — deux équipes différentes obtiennent des multiplicateurs différents
// pour le même choix de stratégie.
export const FORECHECK_OPTIONS = [
  { id: "aggressive", label: "Pression agressive (forecheck 2-1-2)" },
  { id: "balanced", label: "Équilibré (1-2-2)" },
  { id: "passive", label: "Trappe / contenu (1-4)" },
];

export const DEFENSE_OPTIONS = [
  { id: "manToMan", label: "Homme à homme" },
  { id: "zone", label: "Zone" },
];

export const ENTRY_OPTIONS = [
  { id: "carry", label: "Contrôle de la rondelle (entrée portée)" },
  { id: "dump", label: "Dégagement et chasse (dump and chase)" },
];

export const EXIT_OPTIONS = [
  { id: "quick", label: "Sortie rapide / transition" },
  { id: "safe", label: "Sortie prudente" },
];

export const DEFAULT_STRATEGY = { forecheck: "balanced", defense: "zone", entry: "carry", exit: "quick" };

export function fitScore(value, ref = 70, span = 25) { return Math.max(-1, Math.min(1, (value - ref) / span)); }

export function computeTeamProfile(team) {
  const skaters = team.roster.filter((p) => p.pos !== "G");
  const n = skaters.length || 1;
  const mean = (fn) => skaters.reduce((a, p) => a + fn(p), 0) / n;
  return {
    speed: mean((p) => p.attrs.speed),
    stamina: mean((p) => p.attrs.stamina),
    aggressiveness: mean((p) => p.attrs.aggressiveness),
    hitting: mean((p) => p.attrs.hitting),
    puckhandling: mean((p) => p.attrs.puckhandling),
    positioning: mean((p) => p.attrs.positioning),
    defensiveRead: mean((p) => p.attrs.defensiveRead),
    temperament: mean((p) => p.attrs.temperament),
    defenseSkill: mean((p) => avg(p.attrs, DEFENSIVE)),
  };
}

export const STRATEGY_ENGINE = {
  forecheck: {
    aggressive: (p) => { const fit = fitScore((p.speed + p.stamina + p.aggressiveness) / 3); const aggFactor = Math.max(0, Math.min(1, (p.aggressiveness - 60) / 30)); return { own: 1 + 0.12 * fit, opp: 1 - 0.08 * fit, pen: 1.15 + 0.15 * aggFactor }; },
    balanced: () => ({ own: 1, opp: 1, pen: 1 }),
    passive: (p) => { const fit = fitScore((p.defensiveRead + p.positioning + p.temperament) / 3); return { own: 0.92 + 0.06 * fit, opp: 0.90 - 0.06 * fit, pen: 0.85 - 0.10 * fit }; },
  },
  defense: {
    manToMan: (p) => { const fit = fitScore((p.speed + p.defenseSkill) / 2); const aggFactor = Math.max(0, Math.min(1, (p.aggressiveness - 60) / 30)); return { own: 1 + 0.05 * fit, opp: 1 - 0.05 * fit, pen: 1.15 + 0.10 * aggFactor - 0.05 * fit }; },
    zone: (p) => { const fit = fitScore(p.positioning); return { own: 0.97, opp: 0.95 - 0.05 * fit, pen: 0.90 - 0.05 * fit }; },
  },
  entry: {
    carry: (p) => { const fit = fitScore(p.puckhandling); return { own: 1 + 0.10 * fit, opp: 1.02, pen: 1.02 }; },
    dump: (p) => { const fit = fitScore(p.hitting); return { own: 0.93 + 0.07 * fit, opp: 0.97, pen: 0.95 }; },
  },
  exit: {
    quick: (p) => { const fit = fitScore(p.speed); return { own: 1 + 0.06 * fit, opp: 1 - 0.03 * fit, pen: 1.0 }; },
    safe: (p) => { const fit = fitScore(p.positioning); return { own: 0.96, opp: 0.94 - 0.04 * fit, pen: 0.95 }; },
  },
};

export const DEFAULT_MENTALITY = { aggression: 50, pinch: 50, discipline: 50 };

export function getStrategyMultipliers(strategy, profile, mentality) {
  const fc = STRATEGY_ENGINE.forecheck[strategy.forecheck](profile);
  const df = STRATEGY_ENGINE.defense[strategy.defense](profile);
  const en = STRATEGY_ENGINE.entry[strategy.entry](profile);
  const ex = STRATEGY_ENGINE.exit[strategy.exit](profile);
  let own = fc.own * df.own * en.own * ex.own;
  let opp = fc.opp * df.opp * en.opp * ex.opp;
  let pen = fc.pen * df.pen * en.pen * ex.pen;
  if (mentality) {
    const agg = ((mentality.aggression ?? 50) - 50) / 50;
    const pinch = ((mentality.pinch ?? 50) - 50) / 50;
    const disc = ((mentality.discipline ?? 50) - 50) / 50;
    own *= 1 + agg * 0.05 + pinch * 0.03;
    opp *= 1 + agg * 0.04 + pinch * 0.05 - disc * 0.02;
    pen *= 1 + agg * 0.30 - disc * 0.25;
  }
  return { own, opp, pen };
}
