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

// Chaque système agit séparément sur :
//  vol   : volume de tirs de l'équipe          volA : volume de tirs accordés
//  q     : qualité de ses chances de marquer    qA   : qualité des chances accordées
//  pen   : fréquence des punitions
// L'effet est modulé par le « fit » : l'adéquation entre le système et les attributs de l'effectif.
const N = { vol: 1, volA: 1, q: 1, qA: 1, pen: 1 };
const clamp01 = (v) => Math.max(0, Math.min(1, v));

export const STRATEGY_ENGINE = {
  forecheck: {
    // Beaucoup de pression : plus de tirs, mais des surnombres concédés et des punitions.
    aggressive: (p) => { const fit = fitScore((p.speed + p.stamina + p.aggressiveness) / 3); const agg = clamp01((p.aggressiveness - 60) / 30); return { ...N, vol: 1 + 0.10 * fit, volA: 1 - 0.04 * fit, qA: 1.05 - 0.03 * fit, pen: 1.15 + 0.15 * agg }; },
    balanced: () => ({ ...N }),
    // Trappe : peu de tirs de part et d'autre, chances adverses de moindre qualité.
    passive: (p) => { const fit = fitScore((p.defensiveRead + p.positioning + p.temperament) / 3); return { ...N, vol: 0.92 + 0.03 * fit, volA: 0.90 - 0.05 * fit, qA: 0.97 - 0.02 * fit, pen: 0.85 - 0.10 * fit }; },
  },
  defense: {
    // Homme à homme : coupe le volume adverse si l'effectif est rapide, sinon laisse des trous.
    manToMan: (p) => { const fit = fitScore((p.speed + p.defenseSkill) / 2); const agg = clamp01((p.aggressiveness - 60) / 30); return { ...N, vol: 1 + 0.03 * fit, volA: 1 - 0.06 * fit, qA: 1.02 - 0.04 * fit, pen: 1.15 + 0.10 * agg - 0.05 * fit }; },
    // Zone : concède des tirs de la périphérie mais protège l'enclave.
    zone: (p) => { const fit = fitScore(p.positioning); return { ...N, vol: 0.98, volA: 1.02, qA: 0.93 - 0.04 * fit, pen: 0.90 - 0.05 * fit }; },
  },
  entry: {
    // Entrée contrôlée : moins de volume, meilleures chances (dépend du maniement).
    carry: (p) => { const fit = fitScore(p.puckhandling); return { ...N, vol: 1 + 0.03 * fit, q: 1 + 0.08 * fit, pen: 1.02 }; },
    // Dégagement et chasse : plus de tirs, souvent de moins bonne qualité (dépend du jeu physique).
    dump: (p) => { const fit = fitScore(p.hitting); return { ...N, vol: 1.05 + 0.04 * fit, q: 0.93 + 0.02 * fit, pen: 0.95 }; },
  },
  exit: {
    quick: (p) => { const fit = fitScore(p.speed); return { ...N, vol: 1 + 0.05 * fit, q: 1.02, volA: 1 - 0.02 * fit }; },
    safe: (p) => { const fit = fitScore(p.positioning); return { ...N, vol: 0.97, volA: 0.95 - 0.03 * fit, q: 0.98, pen: 0.95 }; },
  },
};

export const DEFAULT_MENTALITY = { aggression: 50, pinch: 50, discipline: 50 };

// Multiplicateurs combinés. own/opp (effet global offensif / défensif) servent au choix
// automatique de la stratégie ; la simulation utilise vol/volA/q/qA/pen.
export function getStrategyMultipliers(strategy, profile, mentality) {
  const parts = [
    STRATEGY_ENGINE.forecheck[strategy.forecheck](profile),
    STRATEGY_ENGINE.defense[strategy.defense](profile),
    STRATEGY_ENGINE.entry[strategy.entry](profile),
    STRATEGY_ENGINE.exit[strategy.exit](profile),
  ];
  const m = { ...N };
  parts.forEach((x) => Object.keys(m).forEach((k) => { m[k] *= x[k]; }));
  if (mentality) {
    const agg = ((mentality.aggression ?? 50) - 50) / 50;
    const pinch = ((mentality.pinch ?? 50) - 50) / 50;
    const disc = ((mentality.discipline ?? 50) - 50) / 50;
    m.vol *= 1 + agg * 0.05 + pinch * 0.03;
    m.volA *= 1 + agg * 0.03 - disc * 0.02;
    m.qA *= 1 + pinch * 0.05;
    m.pen *= 1 + agg * 0.30 - disc * 0.25;
  }
  return { ...m, own: m.vol * m.q, opp: m.volA * m.qA };
}
