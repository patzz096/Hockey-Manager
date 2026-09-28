import { normalizeStrategy, STRATEGY_PHASES } from "./strategy";

// ---------------------------------------------------------------------------------------
// Entraînement (façon FM24) : condition physique et cohésion tactique.
//  - Condition (0-100, par joueur) : dérive vers 100 avec le repos, chute avec les matchs
//    joués, atténuée par l'endurance (`attrs.stamina`). Elle module légèrement les cotes
//    d'équipe (`conditionFactor`, utilisé par `engine/simulation.js` teamRatings) : un joueur
//    en méforme rend moins que sa cote, en pleine forme un peu plus. `BASE_CONDITION` est le
//    point neutre (facteur = 1) : les rosters générés partent centrés dessus, donc le calibrage
//    du moteur (tests/simulation-calibration.test.js, qui ne fait jamais tourner l'entraînement)
//    n'est pas affecté.
//  - Fatigue en match (sim en direct) : même mécanisme, mais à l'échelle d'un match. L'énergie
//    de chaque joueur (initialisée à sa condition) baisse selon son temps de glace de la mise
//    au jeu et remonte un peu au banc ; elle est réinjectée comme une condition temporaire pour
//    la simulation de la mise au jeu suivante (voir App.jsx `runLiveSegment`). Sans état de
//    forme, rien n'empêchait d'envoyer toujours le trio no 1 : la fatigue rend ça coûteux.
//  - Cohésion (0-100, seulement pour ton équipe — les 31 autres ne changent jamais de système
//    par ce mécanisme et restent pleinement rodées) : monte avec l'entraînement tant que le
//    système de jeu (les 5 phases) reste le même, chute quand tu le changes (temps d'adaptation,
//    comme une nouvelle tactique en FM). Elle détermine la part de l'adéquation de ton effectif
//    qui se réalise vraiment en match (`engine/strategy.js` getStrategyMultipliers).
//  - Calendrier (App.jsx `business.trainingSchedule`, jour → [séance du matin, séance de
//    l'après-midi]) : jusqu'à SLOTS_PER_DAY séances par jour, un match occupant une des deux
//    cases. Toutes les séances de la semaine sont moyennées (`resolveFocus`) pour obtenir l'effet
//    hebdomadaire réel sur la condition et la cohésion.
// ---------------------------------------------------------------------------------------

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

export const BASE_CONDITION = 85;
export const MIN_CONDITION = 35;

// Facteur multiplicatif appliqué aux cotes offensives/défensives/de finition (et à la cote du
// gardien) selon la condition physique. Neutre (1) à BASE_CONDITION, ±0,15 aux extrêmes.
export function conditionFactor(condition = BASE_CONDITION) {
  return clamp(1 + (condition - BASE_CONDITION) / 100, 0.85, 1.08);
}
export function conditionLabel(condition = BASE_CONDITION) {
  return condition >= 90 ? "Excellente" : condition >= 78 ? "Bonne" : condition >= 65 ? "Moyenne" : condition >= 50 ? "Fatigué" : "Épuisé";
}
export function conditionColor(condition = BASE_CONDITION) {
  return condition >= 90 ? "var(--win)" : condition >= 78 ? "#7FD6A0" : condition >= 65 ? "var(--gold)" : condition >= 50 ? "#F59A4A" : "var(--loss)";
}

// ------------------------------- Programmes d'entraînement -------------------------------
export const TRAINING_FOCUSES = {
  balanced: { label: "Équilibré", desc: "Un peu de tout : ni la meilleure récupération, ni la meilleure cohésion.", conditionBoost: 0, cohesionBoost: 0 },
  fitness: { label: "Préparation physique", desc: "Priorité à la forme : la condition récupère nettement plus vite, la cohésion tactique progresse plus lentement.", conditionBoost: 2.8, cohesionBoost: -1.6 },
  tactical: { label: "Travail tactique", desc: "Priorité au système de jeu : la cohésion progresse nettement plus vite, la condition récupère un peu moins.", conditionBoost: -1.2, cohesionBoost: 3.0 },
  rest: { label: "Repos", desc: "Charge allégée : la meilleure récupération physique, mais aucun travail tactique cette semaine-là.", conditionBoost: 4.6, cohesionBoost: -2.8 },
};
export const DEFAULT_FOCUS = "balanced";
// Calendrier (onglet Calendrier, vue "mon équipe") : 2 cases par jour (matin/après-midi). Un
// match occupe une case (celle de l'après-midi, par convention) : un jour de match ne peut donc
// recevoir qu'une seule séance (le matin), un jour libre jusqu'à 2 (matin ET après-midi).
export const SLOTS_PER_DAY = 2;

// Choix automatique quand l'entraînement est délégué (onglet Personnel) : repos si personne ne
// joue bientôt, physique si l'effectif est fatigué, tactique si la cohésion a pris un coup
// (changement de système récent), sinon équilibré. Utilisé pour la case du matin d'un jour de
// match (une seule séance possible ce jour-là).
export function autoTrainingFocus(avgCondition, cohesion, upcomingGames) {
  if (upcomingGames === 0) return "rest";
  if (avgCondition < 68) return "fitness";
  if (cohesion < 60) return "tactical";
  return "balanced";
}

// Version à 2 séances (matin + après-midi) du choix automatique, pour un jour sans match.
export function autoTrainingSessions(avgCondition, cohesion, upcomingGames) {
  if (upcomingGames === 0) return ["rest", "rest"];
  const sessions = [];
  if (avgCondition < 68) sessions.push("fitness");
  if (cohesion < 60) sessions.push("tactical");
  while (sessions.length < SLOTS_PER_DAY) sessions.push("balanced");
  return sessions;
}

// Un ou plusieurs programmes (toutes les séances de la semaine, matin et après-midi confondus,
// planifiées au calendrier) réduits à un seul effet moyen. Accepte une seule clé (rétrocompatible)
// ou un tableau de clés.
export function resolveFocus(focusKeys = DEFAULT_FOCUS) {
  const arr = Array.isArray(focusKeys) ? focusKeys : [focusKeys];
  const list = arr.length ? arr : [DEFAULT_FOCUS];
  const items = list.map((k) => TRAINING_FOCUSES[k] || TRAINING_FOCUSES.balanced);
  return {
    conditionBoost: items.reduce((a, f) => a + f.conditionBoost, 0) / items.length,
    cohesionBoost: items.reduce((a, f) => a + f.cohesionBoost, 0) / items.length,
  };
}

// Delta de condition d'un joueur pour une semaine : récupération de base (meilleure avec
// l'endurance et un programme physique) moins la fatigue des matchs joués, plus une légère
// dérive vers BASE_CONDITION pour éviter qu'un effectif dérive indéfiniment vers 0 ou 100.
export function weeklyConditionDelta(condition, stamina = 60, gamesThisWeek = 0, focusKeys = DEFAULT_FOCUS, fitnessSkill = null) {
  const focus = resolveFocus(focusKeys);
  const staminaFactor = 0.6 + (clamp(stamina, 1, 99) / 99) * 0.8; // 0.6..1.4
  // Entraîneur physique (engine/staff.js `fitnessCoach`) : accélère la récupération hebdomadaire.
  const coachBoost = fitnessSkill == null ? 0 : ((clamp(fitnessSkill, 20, 99) - 50) / 50) * 0.9;
  const fatigue = gamesThisWeek * 2.6 * (1.45 - staminaFactor * 0.35);
  const recovery = (3.4 + focus.conditionBoost + coachBoost) * staminaFactor;
  const pullToBase = (BASE_CONDITION - condition) * 0.04;
  return recovery - fatigue + pullToBase;
}
export function applyWeeklyCondition(roster, gamesThisWeek, focusKeys = DEFAULT_FOCUS, fitnessSkill = null) {
  return roster.map((p) => {
    const cur = p.condition ?? BASE_CONDITION;
    const next = clamp(cur + weeklyConditionDelta(cur, p.attrs?.stamina, gamesThisWeek, focusKeys, fitnessSkill), MIN_CONDITION, 100);
    return next === cur ? p : { ...p, condition: Math.round(next) };
  });
}

// ------------------------------------- Cohésion -------------------------------------
export const COHESION_RESET_DROP = 24;
export const MIN_COHESION = 30;

// Signature des 5 phases du système de jeu : deux stratégies avec la même signature sont la
// même tactique du point de vue de la cohésion (peu importe la mentalité, réglable en continu).
export function strategySignature(strategy) {
  const s = normalizeStrategy(strategy);
  return STRATEGY_PHASES.map((ph) => s[ph.key]).join("|");
}
// Cohésion après un changement de système : chute (temps d'adaptation), jamais sous MIN_COHESION.
export function resetCohesion(cohesion = 100) { return Math.max(MIN_COHESION, cohesion - COHESION_RESET_DROP); }

export function weeklyCohesionDelta(focusKeys = DEFAULT_FOCUS, coachRating = 50) {
  const focus = resolveFocus(focusKeys);
  return (2.3 + focus.cohesionBoost) * (0.7 + clamp(coachRating, 20, 99) / 200);
}
export function applyWeeklyCohesion(cohesion = 100, focusKeys = DEFAULT_FOCUS, coachRating = 50) {
  return Math.round(clamp(cohesion + weeklyCohesionDelta(focusKeys, coachRating), MIN_COHESION, 100));
}
export function cohesionLabel(cohesion = 100) {
  return cohesion >= 90 ? "Rodée" : cohesion >= 70 ? "Bien assimilée" : cohesion >= 50 ? "En apprentissage" : "Nouveau système";
}
export function cohesionColor(cohesion = 100) {
  return cohesion >= 90 ? "var(--win)" : cohesion >= 70 ? "#7FD6A0" : cohesion >= 50 ? "var(--gold)" : "#F59A4A";
}
// Part de l'adéquation à la stratégie qui se réalise vraiment en match : définie dans
// engine/strategy.js (qui n'importe pas ce module, pour éviter un cycle) et réexportée ici.
export { cohesionRealization } from "./strategy";

// ------------------------------- Fatigue en match (sim en direct) -------------------------------
// energyById : { [playerId]: 0-100 }, toiBy : minutes jouées par joueur pendant le segment
// (voir engine/simulation.js computeTOI), minutesElapsed : durée réelle du segment.
export function applyGameFatigue(energyById, roster, toiBy, minutesElapsed) {
  const next = { ...energyById };
  roster.forEach((p) => {
    if (p.pos === "G") return; // pas de fatigue de gardien en cours de match dans ce modèle
    const toi = toiBy[p.id] || 0;
    const stamina = clamp(p.attrs?.stamina ?? 60, 1, 99);
    const cur = next[p.id] ?? (p.condition ?? BASE_CONDITION);
    const drain = toi * (1.7 - (stamina / 99) * 0.9); // ~0.8 à 1.7 point d'énergie par minute jouée
    const rest = Math.max(0, minutesElapsed - toi) * 0.55; // récupération au banc, plus lente que la dépense
    next[p.id] = Math.round(clamp(cur - drain + rest, MIN_CONDITION, 100));
  });
  return next;
}
