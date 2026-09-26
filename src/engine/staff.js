import { FIRST_NAMES, LAST_NAMES } from "../data/names";

// hockeyOpsDirector : embauche l'ensemble du personnel hockey (tout sauf financeDirector) quand
// délégué (voir App.jsx autoManageHockeyOps). gm (directeur général) : négociation des contrats
// (estimation des attentes du joueur, voir engine/contracts.js gmEstimate), échanges (évaluation
// de la valeur, voir TransactionsCenter), cohésion d'équipe et développement des joueurs.
// broadcastDirector : relations médias et diffusion (engine/finance.js) — accélère la
// progression de l'engagement des partisans, négocie un meilleur contrat de diffusion, et
// attire un peu plus de spectateurs (marketing).
export const STAFF_ROLES = { hockeyOpsDirector: "Directeur des opérations hockey", gm: "Directeur général", financeDirector: "Directeur des finances", headCoach: "Entraîneur-chef", assistantOff: "Adjoint offensif", assistantDef: "Adjoint défensif", fitnessCoach: "Entraîneur physique", scoutAmateur: "Dépisteur amateur", scoutPro: "Dépisteur professionnel", broadcastDirector: "Directeur des communications" };

export const STAFF_BASE_SALARY = { hockeyOpsDirector: 2200, gm: 2100, financeDirector: 1800, headCoach: 1800, assistantOff: 900, assistantDef: 900, fitnessCoach: 950, scoutAmateur: 700, scoutPro: 900, broadcastDirector: 1300 };

export function buildStaffMarket(rng, count = 12) {
  const roles = Object.keys(STAFF_ROLES);
  const coachRoles = ["headCoach", "assistantOff", "assistantDef", "fitnessCoach"];
  const list = [];
  for (let i = 0; i < count; i++) {
    const role = roles[i % roles.length];
    const rating = Math.round(40 + rng() * 55);
    const fn = FIRST_NAMES[Math.floor(rng() * FIRST_NAMES.length)];
    const ln = LAST_NAMES[Math.floor(rng() * LAST_NAMES.length)];
    const salary = Math.round(STAFF_BASE_SALARY[role] * Math.pow(rating / 70, 1.6) * (0.85 + rng() * 0.3));
    const devSkill = coachRoles.includes(role) ? Math.round(35 + rng() * 60) : undefined;
    list.push({ id: `STAFF-${i}`, name: `${fn} ${ln}`, role, rating, salary, devSkill });
  }
  return list;
}

// --------------------------- Négociation d'embauche du personnel ---------------------------
// Même principe que la négociation de contrat des joueurs (engine/contracts.js evaluateOffer/
// frustrationMultiplier), mais simplifié : pas de durée ni de clauses, juste un salaire annuel.
// L'agent du candidat ne répond pas tout de suite (délai géré dans App.jsx, comme les joueurs) ;
// plus l'offre est proche ou au-dessus de son salaire demandé, plus il a de chances d'accepter.
// Trop de refus d'affilée font monter ses attentes puis il refuse toute négociation pour le
// reste de la saison.
export const MAX_STAFF_OFFER_ATTEMPTS = 3;
export function staffFrustration(rejections = 0) { return 1 + Math.min(rejections, MAX_STAFF_OFFER_ATTEMPTS) * 0.08; }
export function evaluateStaffOffer(candidate, offeredSalary, rejections = 0, rng = Math.random) {
  const ask = Math.round(candidate.salary * staffFrustration(rejections));
  const score = (offeredSalary / ask - 1) * 3;
  const probability = Math.max(0.03, Math.min(0.97, 1 / (1 + Math.exp(-4 * score))));
  return { accept: rng() < probability, probability, ask, counterSalary: Math.round((ask * 1.05) / 5) * 5 };
}

export function buildStaffMarketRT(count = 6) {
  const rng = Math.random;
  const roles = Object.keys(STAFF_ROLES);
  const coachRoles = ["headCoach", "assistantOff", "assistantDef", "fitnessCoach"];
  const list = [];
  for (let i = 0; i < count; i++) {
    const role = roles[i % roles.length];
    const rating = Math.round(40 + rng() * 55);
    const fn = FIRST_NAMES[Math.floor(rng() * FIRST_NAMES.length)];
    const ln = LAST_NAMES[Math.floor(rng() * LAST_NAMES.length)];
    const salary = Math.round(STAFF_BASE_SALARY[role] * Math.pow(rating / 70, 1.6) * (0.85 + rng() * 0.3));
    const devSkill = coachRoles.includes(role) ? Math.round(35 + rng() * 60) : undefined;
    list.push({ id: `STAFF-${Date.now()}-${i}`, name: `${fn} ${ln}`, role, rating, salary, devSkill });
  }
  return list;
}
