import { lineInfo } from "./lines";

// ---------------------------------------------------------------------------------------
// Systèmes de jeu LNH : 5 phases × 5 stratégies (guide « Stratégies NHL et profils de joueurs »).
// Chaque stratégie décrit le profil de joueurs qui lui convient (attributs pondérés, par groupe :
// défenseurs, centres, ailiers…). L'adéquation (« fit », de -1 à +1) de ton effectif est la
// moyenne de ces profils, pondérée par le temps de glace. Elle module les effets :
//   vol / volA : volume de tirs pour / contre     q / qA : qualité des chances pour / contre
//   pen : fréquence des punitions
// Un bon fit amplifie les avantages ; un mauvais fit les annule, voire les retourne.
// ---------------------------------------------------------------------------------------

const N = { vol: 1, volA: 1, q: 1, qA: 1, pen: 1 };
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// Échelle du jeu : attributs autour de 60, vedettes vers 75-85. Un profil moyen donne ~0.
export const FIT_REF = 62;
export const FIT_SPAN = 6;
export function fitScore(value, ref = FIT_REF, span = FIT_SPAN) { return clamp((value - ref) / span, -1, 1); }

const GROUPS = {
  all: (p) => p.pos !== "G",
  F: (p) => ["C", "LW", "RW"].includes(p.pos),
  D: (p) => p.pos === "LD" || p.pos === "RD",
  C: (p) => p.pos === "C",
  W: (p) => p.pos === "LW" || p.pos === "RW",
  LW: (p) => p.pos === "LW",
};
export const GROUP_LABEL = { all: "patineurs", F: "attaquants", D: "défenseurs", C: "centres", W: "ailiers", LW: "ailiers gauches" };

// Pseudo-attributs tirés du profil : expérience (âge) et gabarit (poids réel, sinon force).
function trait(p, key) {
  if (key === "experience") return clamp(38 + (p.age - 19) * 3.5, 30, 85);
  if (key === "size") return p.weightKg ? clamp(60 + (p.weightKg - 90) * 1.4, 35, 90) : p.attrs.strength;
  return p.attrs[key] ?? 60;
}
function weighted(p, weights) {
  let s = 0, w = 0;
  Object.entries(weights).forEach(([k, x]) => { s += trait(p, k) * x; w += x; });
  return w ? s / w : 60;
}

// Les 5 phases de jeu et leurs stratégies.
// good/bad : texte du guide ; groups : [{ who, weights, share }] ; fx(fit) : effets.
export const STRATEGY_PHASES = [
  {
    key: "defense", label: "Zone défensive", short: "Défensive",
    options: [
      { id: "zone", label: "Zone / réservoir", desc: "Protection du devant du filet et de l'enclave en bloc compact.",
        good: "Joueurs intelligents, disciplinés, bons en positionnement et blocage de tirs.", bad: "Joueurs impatients, indisciplinés ou axés uniquement sur le marquage individuel.",
        groups: [{ who: "all", weights: { positioning: 3, defensiveRead: 2, shotBlocking: 2, temperament: 1, professionalism: 1 } }],
        fx: (f) => ({ vol: 0.98, volA: 1.03, qA: 0.94 - 0.05 * f, pen: 0.92 - 0.05 * f }) },
      { id: "manToMan", label: "Homme à homme", desc: "Couverture directe et continue d'un adversaire désigné.",
        good: "Joueurs très en forme, mobiles, physiques et intenses.", bad: "Joueurs lents, au patinage déficient ou manquant de cardio.",
        groups: [{ who: "all", weights: { stamina: 3, speed: 2, agility: 2, checking: 1, hitting: 1, determination: 1 } }],
        fx: (f) => ({ vol: 1 + 0.03 * f, volA: 0.97 - 0.06 * f, qA: 1.02 - 0.05 * f, pen: 1.08 - 0.03 * f }) },
      { id: "hybrid", label: "Hybride", desc: "Homme à homme en bas de zone, zone en haut des cercles.",
        good: "Joueurs polyvalents, au QI hockey élevé et bons communicateurs.", bad: "Joueurs jeunes ou inexpérimentés (risque de confusion dans les permutations).",
        groups: [{ who: "all", weights: { defensiveRead: 2, offensiveRead: 1, positioning: 1, teamPlayer: 2, leadership: 1, experience: 2 } }],
        fx: (f) => ({ volA: 1 - 0.04 * f, qA: 1 - 0.04 * f, vol: 1 + 0.01 * f }) },
      { id: "pressure", label: "Pression agressive", desc: "Surcharge immédiate à deux sur le porteur le long de la bande.",
        good: "Joueurs rapides, hargneux, bons en échec avant et en récupération de rondelle.", bad: "Joueurs hésitants ou au mauvais temps de réaction.",
        groups: [{ who: "all", weights: { speed: 2, aggressiveness: 2, checking: 2, stickchecking: 2, acceleration: 1 } }],
        fx: (f) => ({ vol: 1.02 + 0.03 * f, volA: 0.96 - 0.05 * f, qA: 1.06 - 0.06 * f, pen: 1.14 }) },
      { id: "collapse", label: "Pointe affaissée", desc: "Repli massif des 5 joueurs très bas, près du demi-cercle.",
        good: "Joueurs imposants et physiques, forts pour dégager l'enclave.", bad: "Joueurs petits, légers ou incapables de soutenir le jeu physique serré.",
        groups: [{ who: "all", weights: { size: 2, strength: 2, shotBlocking: 2, bravery: 1, hitting: 1 } }],
        fx: (f) => ({ vol: 0.95, volA: 1.07, qA: 0.9 - 0.05 * f, pen: 0.97 }) },
    ],
  },
  {
    key: "breakout", label: "Sortie de zone", short: "Sortie",
    options: [
      { id: "quick", label: "Sortie rapide / passe directe", desc: "Relance immédiate le long de la bande ou au centre.",
        good: "Passeurs précis et ailiers qui lisent bien le jeu.", bad: "Joueurs hésitants avec la rondelle ou à la faible vision du jeu.",
        groups: [{ who: "D", weights: { passing: 3, offensiveRead: 2, puckhandling: 1 }, share: 0.5 }, { who: "W", weights: { gettingOpen: 2, offensiveRead: 2, speed: 1 }, share: 0.5 }],
        fx: (f) => ({ vol: 1 + 0.04 * f, volA: 1 - 0.02 * f, q: 1 + 0.01 * f }) },
      { id: "reverse", label: "« Over » / revers", desc: "Utilisation de la bande arrière pour changer le sens de l'attaque.",
        good: "Défenseurs calmes sous pression et communicateurs hors pair.", bad: "Défenseurs nerveux ou mal à l'aise avec la rondelle dos au jeu.",
        groups: [{ who: "D", weights: { puckhandling: 2, temperament: 2, teamPlayer: 2, positioning: 1, experience: 1 } }],
        fx: (f) => ({ vol: 0.99, volA: 0.99 - 0.04 * f, qA: 1 - 0.02 * f }) },
      { id: "centerSupport", label: "Soutien du centre", desc: "Le centre descend très bas pour offrir une option courte au milieu.",
        good: "Centres intelligents, mobiles, excellents passeurs et bons en possession.", bad: "Centres purement offensifs qui négligent leur travail défensif.",
        groups: [{ who: "C", weights: { passing: 2, offensiveRead: 1, defensiveRead: 2, agility: 1, puckhandling: 1 } }],
        fx: (f) => ({ vol: 1 + 0.03 * f, volA: 0.99 - 0.03 * f, q: 1 + 0.02 * f }) },
      { id: "controlled", label: "Sortie contrôlée", desc: "Regroupement derrière le filet pour attaquer en vague.",
        good: "Joueurs rapides, efficaces en transition et en possession en zone neutre.", bad: "Joueurs indisciplinés qui précipitent l'attaque en solo.",
        groups: [{ who: "all", weights: { speed: 2, puckhandling: 2, acceleration: 1, professionalism: 1, teamPlayer: 1 } }],
        fx: (f) => ({ vol: 0.97, q: 1.02 + 0.06 * f, volA: 0.99 }) },
      { id: "chipStretch", label: "Chip and stretch", desc: "Rondelle soulevée le long de la baie vitrée vers un ailier lancé en zone neutre.",
        good: "Ailiers rapides, opportunistes, bons pour capter les rondelles libres.", bad: "Joueurs lents ou peu à l'aise pour batailler le long de la rampe.",
        groups: [{ who: "W", weights: { speed: 3, acceleration: 2, gettingOpen: 1, strength: 1, bravery: 1 } }],
        fx: (f) => ({ vol: 1.01 + 0.04 * f, q: 0.98 + 0.05 * f, volA: 1.02 }) },
    ],
  },
  {
    key: "offense", label: "Zone offensive", short: "Offensive",
    options: [
      { id: "lowCycle", label: "Cycle bas", desc: "Conservation et protection de la rondelle sous les cercles.",
        good: "Attaquants puissants, forts sur leurs patins et le long des rampes.", bad: "Attaquants légers ou qui évitent le contact.",
        groups: [{ who: "F", weights: { strength: 2, balance: 2, puckhandling: 1, bravery: 1, size: 1 } }],
        fx: (f) => ({ vol: 0.97, q: 1.02 + 0.06 * f, volA: 0.98 }), shooters: { strength: 0.1 } },
      { id: "pointAttack", label: "Attaque par les pointes", desc: "Tirs de la ligne bleue avec écran et trafic devant le gardien.",
        good: "Défenseurs au tir lourd et précis, attaquants robustes devant le filet.", bad: "Joueurs qui hésitent à aller dans les zones payantes.",
        groups: [{ who: "D", weights: { shotRange: 3, shotAccuracy: 2 }, share: 0.5 }, { who: "F", weights: { screening: 3, strength: 1, bravery: 1 }, share: 0.5 }],
        fx: (f) => ({ vol: 1.04 + 0.06 * f, q: 0.93 + 0.03 * f }), shooters: { defenseBoost: 1.7 } },
      { id: "overload", label: "Surpression (overload)", desc: "Création d'un 3 contre 2 d'un seul côté de la zone.",
        good: "Joueurs de combinaison, rapides en passe courte et très techniques.", bad: "Joueurs individualistes qui gardent la rondelle trop longtemps.",
        groups: [{ who: "F", weights: { passing: 2, agility: 2, offensiveRead: 1, teamPlayer: 2 } }],
        fx: (f) => ({ vol: 1.01, q: 1.01 + 0.06 * f, qA: 1.02 }) },
      { id: "activation", label: "Permutation des défenseurs", desc: "Un défenseur descend, un attaquant couvre la ligne bleue.",
        good: "Défenseurs offensifs mobiles et attaquants responsables défensivement.", bad: "Joueurs rigides qui manquent d'adaptabilité tactique.",
        groups: [{ who: "D", weights: { speed: 2, offensiveRead: 2, puckhandling: 1 }, share: 0.6 }, { who: "F", weights: { defensiveRead: 2, positioning: 1 }, share: 0.4 }],
        fx: (f) => ({ vol: 1.03 + 0.04 * f, q: 1 + 0.02 * f, qA: 1.05 - 0.04 * f }), shooters: { defenseBoost: 1.3 } },
      { id: "behindNet", label: "Derrière le filet", desc: "Utilisation de l'arrière du filet pour distribuer dans l'enclave.",
        good: "Fins tacticiens, fabricants de jeu à la grande vision.", bad: "Joueurs sans la patience ou la précision de passe requises.",
        groups: [{ who: "F", weights: { passing: 3, offensiveRead: 3, puckhandling: 1 } }],
        fx: (f) => ({ vol: 0.96, q: 1.02 + 0.07 * f }) },
    ],
  },
  {
    key: "forecheck", label: "Échec avant", short: "Échec avant",
    options: [
      { id: "f122", label: "1-2-2 (standard)", desc: "F1 met de la pression, F2 et F3 ferment les options le long des bandes.",
        good: "Structure équilibrée : convient à la majorité des profils complets.", bad: "Joueurs tricheurs qui abandonnent leur couverture.",
        groups: [{ who: "F", weights: { positioning: 1, defensiveRead: 1, offensiveRead: 1, teamPlayer: 1, speed: 1 } }],
        fx: (f) => ({ vol: 1 + 0.01 * f, volA: 1 - 0.02 * f }) },
      { id: "f212", label: "2-1-2 (agressif)", desc: "Deux attaquants plongent profondément dans les coins.",
        good: "Attaquants très rapides, hargneux et physiques.", bad: "Joueurs lents ou au faible repli défensif.",
        groups: [{ who: "F", weights: { speed: 2, aggressiveness: 2, hitting: 2, stamina: 1, acceleration: 1 } }],
        fx: (f) => ({ vol: 1.03 + 0.06 * f, volA: 1.01 - 0.04 * f, qA: 1.05 - 0.04 * f, pen: 1.12 }) },
      { id: "trap", label: "1-1-3 / trappe", desc: "Attente compacte en zone neutre pour bloquer la ligne bleue.",
        good: "Joueurs méthodiques, patients et très disciplinés.", bad: "Joueurs explosifs axés sur l'attaque à outrance.",
        groups: [{ who: "all", weights: { positioning: 2, defensiveRead: 2, professionalism: 2, temperament: 1 } }],
        fx: (f) => ({ vol: 0.92, volA: 0.92 - 0.05 * f, qA: 1 - 0.03 * f, pen: 0.9 - 0.04 * f }) },
      { id: "f131", label: "1-3-1", desc: "Un harceleur, trois joueurs alignés au centre, un défenseur profond.",
        good: "Joueurs intelligents, bons pour intercepter et lire les trajectoires.", bad: "Joueurs qui manquent de discipline de positionnement.",
        groups: [{ who: "all", weights: { defensiveRead: 2, stickchecking: 2, offensiveRead: 1, positioning: 2 } }],
        fx: (f) => ({ vol: 0.99 + 0.02 * f, volA: 0.99 - 0.04 * f, q: 1 + 0.02 * f }) },
      { id: "softDump", label: "Soft dump & pinch", desc: "Rejet ciblé dans le coin suivi d'une mise en échec immédiate.",
        good: "Attaquants imposants et physiques qui complètent leurs mises en échec.", bad: "Joueurs qui évitent le jeu physique ou de petit gabarit.",
        groups: [{ who: "F", weights: { size: 2, hitting: 3, checking: 2, strength: 1 } }],
        fx: (f) => ({ vol: 1.04 + 0.04 * f, q: 0.95, pen: 1.07 }), shooters: { hitting: 0.12 } },
    ],
  },
  {
    key: "backcheck", label: "Repli défensif", short: "Repli",
    options: [
      { id: "centerDrive", label: "Retour au centre", desc: "Sprint prioritaire des attaquants vers l'enclave défensive.",
        good: "Joueurs à gros volume de patinage et grande éthique de travail.", bad: "Joueurs paresseux en repli ou spectateurs.",
        groups: [{ who: "F", weights: { stamina: 2, determination: 2, speed: 2, teamPlayer: 1 } }],
        fx: (f) => ({ qA: 0.98 - 0.05 * f, vol: 0.99 }) },
      { id: "gap32", label: "3 contre 2 contrôlé", desc: "Bon écart des défenseurs (gap control) soutenu par le F1.",
        good: "Défenseurs très mobiles en patinage arrière et attaquants consciencieux.", bad: "Défenseurs qui reculent trop vite ou laissent trop d'espace.",
        groups: [{ who: "D", weights: { agility: 2, acceleration: 2, positioning: 2 }, share: 0.6 }, { who: "F", weights: { defensiveRead: 2, teamPlayer: 1 }, share: 0.4 }],
        fx: (f) => ({ volA: 1 - 0.03 * f, qA: 1 - 0.04 * f }) },
      { id: "lwLock", label: "Verrou (left wing lock)", desc: "L'ailier gauche se replie à la hauteur des deux défenseurs.",
        good: "Ailiers responsables, disciplinés et à vocation défensive.", bad: "Ailiers tricheurs qui cherchent les échappées.",
        groups: [{ who: "LW", weights: { defensiveRead: 3, positioning: 2, professionalism: 1, stickchecking: 1 } }],
        fx: (f) => ({ vol: 0.96, volA: 0.96 - 0.05 * f, qA: 0.99 - 0.02 * f }) },
      { id: "boardSide", label: "Orientation vers la bande", desc: "Forcer le porteur vers l'extérieur pour fermer le centre.",
        good: "Joueurs habiles du bâton et disciplinés dans leurs angles.", bad: "Joueurs qui se font facilement déborder à l'intérieur.",
        groups: [{ who: "all", weights: { stickchecking: 3, positioning: 2, temperament: 1 } }],
        fx: (f) => ({ volA: 1.01, qA: 0.98 - 0.05 * f }) },
      { id: "backPressure", label: "Chasse arrière", desc: "Harcèlement du porteur par derrière (coup de bâton, pression).",
        good: "Joueurs dotés d'une excellente vitesse de pointe en repli.", bad: "Joueurs lents incapables de rattraper leur retard.",
        groups: [{ who: "F", weights: { speed: 3, acceleration: 2, stickchecking: 2 } }],
        fx: (f) => ({ volA: 1 - 0.03 * f, qA: 1 - 0.03 * f, pen: 1.06, vol: 1 + 0.02 * f }) },
    ],
  },
];

export const DEFAULT_STRATEGY = { defense: "zone", breakout: "quick", offense: "overload", forecheck: "f122", backcheck: "centerDrive" };
export const DEFAULT_MENTALITY = { aggression: 50, pinch: 50, discipline: 50 };

export function strategyOption(phaseKey, id) {
  const phase = STRATEGY_PHASES.find((p) => p.key === phaseKey);
  return phase?.options.find((o) => o.id === id) || phase?.options[0];
}
// Accepte aussi une stratégie incomplète ou d'un ancien format : chaque phase absente prend le défaut.
export function normalizeStrategy(strategy = {}) {
  const out = {};
  STRATEGY_PHASES.forEach((ph) => { out[ph.key] = ph.options.some((o) => o.id === strategy[ph.key]) ? strategy[ph.key] : DEFAULT_STRATEGY[ph.key]; });
  return out;
}

// Adéquation d'un joueur à une stratégie (échelle des attributs), selon son groupe.
export function playerFitValue(player, option) {
  const g = option.groups.find((x) => GROUPS[x.who](player)) || null;
  return g ? weighted(player, g.weights) : null;
}

// Adéquation de l'équipe (-1..+1) : profil de chaque groupe, pondéré par le temps de glace.
export function optionFit(team, lines, option) {
  let total = 0, shares = 0;
  option.groups.forEach((g) => {
    const players = team.roster.filter(GROUPS[g.who]);
    if (!players.length) return;
    let s = 0, w = 0;
    players.forEach((p) => { const b = lines ? lineInfo(p.id, lines).bonus : 1; s += weighted(p, g.weights) * b; w += b; });
    const share = g.share ?? 1;
    total += (s / w) * share; shares += share;
  });
  return fitScore(shares ? total / shares : FIT_REF);
}

// Toutes les adéquations d'une équipe, mises en cache tant que l'effectif et les trios ne changent pas.
const fitCache = new WeakMap();
export function computeStrategyFits(team, lines) {
  const byLines = fitCache.get(team.roster) || new WeakMap();
  const key = lines || team;
  if (byLines.has(key)) return byLines.get(key);
  const fits = {};
  STRATEGY_PHASES.forEach((ph) => { fits[ph.key] = Object.fromEntries(ph.options.map((o) => [o.id, optionFit(team, lines, o)])); });
  byLines.set(key, fits);
  fitCache.set(team.roster, byLines);
  return fits;
}
// Compatibilité : l'ancien « profil d'équipe » est remplacé par les adéquations.
export const computeTeamProfile = (team, lines) => computeStrategyFits(team, lines);

export function optionEffects(phaseKey, id, fit) {
  return { ...N, ...strategyOption(phaseKey, id).fx(fit) };
}

// Multiplicateurs combinés des 5 phases et de la mentalité. own/opp (effet global offensif /
// défensif) servent au choix automatique ; la simulation utilise vol/volA/q/qA/pen.
// Part de l'adéquation à la stratégie qui se réalise vraiment en match, selon la cohésion
// (engine/training.js) : une tactique à peine installée (cohésion basse) exécute son système
// comme s'il était moins adapté (ou moins inadapté) à l'effectif que ce qu'il est réellement ;
// pleinement rodée (cohésion 100, le cas par défaut de toutes les équipes non suivies), l'effet
// se réalise en entier. Définie ici (pas dans training.js) pour éviter un cycle d'imports.
export function cohesionRealization(cohesion = 100) { return clamp(0.45 + (cohesion / 100) * 0.55, 0.45, 1); }

export function getStrategyMultipliers(strategy, fits, mentality, cohesion) {
  const s = normalizeStrategy(strategy);
  const realized = cohesion == null ? 1 : cohesionRealization(cohesion);
  const m = { ...N };
  STRATEGY_PHASES.forEach((ph) => {
    const fit = (fits?.[ph.key]?.[s[ph.key]] ?? 0) * realized;
    const e = optionEffects(ph.key, s[ph.key], fit);
    Object.keys(m).forEach((k) => { m[k] *= e[k]; });
  });
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

// Valeur nette d'une option pour le choix automatique : attaque produite moins chances accordées,
// moins le coût des punitions (≈ 20 % d'avantages numériques convertis par l'adversaire).
export function optionValue(e) {
  return Math.log(e.vol * e.q) - Math.log(e.volA * e.qA) - (e.pen - 1) * 0.12;
}

// Meilleure stratégie pour un effectif : les phases se multiplient, on choisit donc la meilleure
// option de chaque phase indépendamment. `coachSkill` (critère Gestion d'équipe de l'entraîneur-
// chef, 20-99, ou `null`) : un entraîneur-chef peu doué en gestion d'équipe ne propose pas
// nécessairement la vraie meilleure option — chance croissante de proposer une option moins bonne
// à mesure que sa gestion d'équipe est faible (ou qu'aucun entraîneur-chef n'est en poste).
export function bestStrategy(team, lines, coachSkill = null) {
  const fits = computeStrategyFits(team, lines);
  const errorChance = coachSkill == null ? 0.35 : Math.max(0.03, Math.min(0.4, 0.42 - (Math.max(20, Math.min(99, coachSkill)) - 20) / 79 * 0.37));
  const out = {};
  STRATEGY_PHASES.forEach((ph) => {
    const ranked = ph.options.map((o) => ({ id: o.id, v: optionValue(optionEffects(ph.key, o.id, fits[ph.key][o.id])) })).sort((a, b) => b.v - a.v);
    if (ranked.length > 1 && Math.random() < errorChance) {
      out[ph.key] = ranked[1 + Math.floor(Math.random() * (ranked.length - 1))].id;
    } else {
      out[ph.key] = ranked[0].id;
    }
  });
  return out;
}

// Joueurs de l'effectif les mieux et les moins adaptés à une stratégie.
export function playersForOption(team, option, n = 3) {
  const rows = team.roster.map((p) => ({ p, v: playerFitValue(p, option) })).filter((r) => r.v != null).sort((a, b) => b.v - a.v);
  return { best: rows.slice(0, n), worst: rows.slice(-n).reverse(), group: option.groups.map((g) => GROUP_LABEL[g.who]).join(" + ") };
}

// Modificateurs du choix des tireurs selon le système offensif / l'échec avant.
export function shooterMods(strategy) {
  const s = normalizeStrategy(strategy);
  const mods = { defenseBoost: 1, strength: 0, hitting: 0 };
  [strategyOption("offense", s.offense), strategyOption("forecheck", s.forecheck)].forEach((o) => {
    if (!o.shooters) return;
    if (o.shooters.defenseBoost) mods.defenseBoost *= o.shooters.defenseBoost;
    mods.strength += o.shooters.strength || 0;
    mods.hitting += o.shooters.hitting || 0;
  });
  return mods;
}
