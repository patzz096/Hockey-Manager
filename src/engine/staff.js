import { FIRST_NAMES, LAST_NAMES } from "../data/names";
import { pickNationality } from "./players";

// hockeyOpsDirector : embauche l'ensemble du personnel hockey (tout sauf financeDirector) quand
// délégué (voir App.jsx autoManageHockeyOps). gm (directeur général) : négociation des contrats
// (estimation des attentes du joueur, voir engine/contracts.js gmEstimate), échanges (évaluation
// de la valeur, voir TransactionsCenter), cohésion d'équipe et développement des joueurs.
// broadcastDirector : relations médias et diffusion (engine/finance.js) — accélère la
// progression de l'engagement des partisans, négocie un meilleur contrat de diffusion, et
// attire un peu plus de spectateurs (marketing).
export const STAFF_ROLES = { hockeyOpsDirector: "Directeur des opérations hockey", gm: "Directeur général", financeDirector: "Directeur des finances", headCoach: "Entraîneur-chef", assistantOff: "Adjoint offensif", assistantDef: "Adjoint défensif", fitnessCoach: "Entraîneur physique", scoutAmateur: "Dépisteur amateur", scoutPro: "Dépisteur professionnel", broadcastDirector: "Directeur des communications" };

export const STAFF_BASE_SALARY = { hockeyOpsDirector: 2200, gm: 2100, financeDirector: 1800, headCoach: 1800, assistantOff: 900, assistantDef: 900, fitnessCoach: 950, scoutAmateur: 700, scoutPro: 900, broadcastDirector: 1300 };

// Libellés des attributs détaillés du personnel (échelle interne 20-99, affichée sur /20).
export const STAFF_ATTR_LABELS = {
  trainOff: "Entraînement offensif", trainDef: "Entraînement défensif", trainGoalie: "Entraînement des gardiens",
  devProspects: "Développement des prospects", skillOff: "Compétences offensives", skillDef: "Compétences défensives",
  motivation: "Motivation", discipline: "Discipline", tactics: "Tactique", inGameTactics: "Tactique en match",
  playerManagement: "Gestion des joueurs", negotiation: "Négociation", finance: "Prudence financière",
  scoutSkill: "Évaluation des habiletés", scoutPotential: "Évaluation du potentiel",
};
// Attributs détaillés par poste (catégorie, clé) : la cote générale (`rating`) d'un candidat est
// la moyenne de ces attributs plutôt qu'un chiffre isolé. Les postes absents d'ici (entraîneur
// physique, directeur général, directeur des communications) gardent une seule cote générale.
export const STAFF_ATTRS = {
  headCoach: [["Entraînement", "trainOff"], ["Entraînement", "trainDef"], ["Entraînement", "trainGoalie"], ["Entraînement", "devProspects"], ["Gestion", "motivation"], ["Gestion", "discipline"], ["Gestion", "tactics"], ["Gestion", "inGameTactics"], ["Gestion", "playerManagement"]],
  assistantOff: [["Entraînement", "trainOff"], ["Entraînement", "skillOff"], ["Entraînement", "devProspects"], ["Gestion", "tactics"]],
  assistantDef: [["Entraînement", "trainDef"], ["Entraînement", "skillDef"], ["Entraînement", "devProspects"], ["Gestion", "tactics"]],
  scoutAmateur: [["Dépistage", "scoutSkill"], ["Dépistage", "scoutPotential"], ["Gestion", "negotiation"]],
  scoutPro: [["Dépistage", "scoutSkill"], ["Dépistage", "scoutPotential"]],
  financeDirector: [["Gestion", "negotiation"], ["Gestion", "finance"], ["Gestion", "discipline"]],
  hockeyOpsDirector: [["Gestion", "playerManagement"], ["Gestion", "negotiation"], ["Gestion", "tactics"], ["Gestion", "finance"]],
};

// Un candidat : `attrs` (poste couvert par STAFF_ATTRS) ou une seule cote générale sinon. `rating`
// (cote générale) est toujours la moyenne des attributs quand il y en a — utilisée telle quelle
// par tous les effets de jeu existants (délai/qualité de dépistage, primes de performance, etc.).
// Pour un entraîneur (chef ou adjoint), `devSkill` reprend directement l'attribut "Développement
// des prospects" (vitesse de progression des joueurs, voir App.jsx monthlyTick).
function generateStaffCandidate(rng, id, role, fitnessDevRoles) {
  const spec = STAFF_ATTRS[role];
  const fn = FIRST_NAMES[Math.floor(rng() * FIRST_NAMES.length)];
  const ln = LAST_NAMES[Math.floor(rng() * LAST_NAMES.length)];
  let rating, attrs;
  if (spec) {
    attrs = {};
    spec.forEach(([, key]) => { attrs[key] = Math.round(40 + rng() * 55); });
    rating = Math.round(spec.reduce((a, [, key]) => a + attrs[key], 0) / spec.length);
  } else {
    rating = Math.round(40 + rng() * 55);
  }
  const salary = Math.round(STAFF_BASE_SALARY[role] * Math.pow(rating / 70, 1.6) * (0.85 + rng() * 0.3));
  const devSkill = attrs?.devProspects ?? (fitnessDevRoles.includes(role) ? Math.round(35 + rng() * 60) : undefined);
  // Âge et nationalité (façon FM/EHM) : la plupart des membres du personnel sont d'anciens
  // joueurs ou des carriéristes de longue date, donc plus âgés qu'un joueur moyen.
  const age = 32 + Math.floor(rng() * 45);
  const nationality = pickNationality(rng);
  return { id, name: `${fn} ${ln}`, role, rating, salary, devSkill, attrs, age, nationality };
}

// Bassin de candidats volontairement large (façon FM/EHM, qui liste des dizaines de membres de
// personnel) pour ne pas retomber toujours sur les mêmes profils.
export function buildStaffMarket(rng, count = 24) {
  const roles = Object.keys(STAFF_ROLES);
  const list = [];
  for (let i = 0; i < count; i++) list.push(generateStaffCandidate(rng, `STAFF-${i}`, roles[i % roles.length], ["fitnessCoach"]));
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

export function buildStaffMarketRT(count = 14) {
  const roles = Object.keys(STAFF_ROLES);
  const list = [];
  for (let i = 0; i < count; i++) list.push(generateStaffCandidate(Math.random, `STAFF-${Date.now()}-${i}`, roles[i % roles.length], ["fitnessCoach"]));
  return list;
}
