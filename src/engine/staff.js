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

// Libellés des critères de valeur communs à tout le personnel (échelle interne 20-99, affichée
// sur /20) — les mêmes 11 critères existent chez chaque candidat, quel que soit le poste visé ;
// seuls ceux pertinents pour un poste donné (voir STAFF_ATTRS) déterminent sa cote pour ce poste.
export const STAFF_ATTR_LABELS = {
  coachGoalie: "Coaching gardien", coachOff: "Coaching attaquant", coachDef: "Coaching défenseur",
  scoutSkill: "Évaluation de l'aptitude", scoutPotential: "Évaluation du potentiel",
  physio: "Physiothérapie", devYoung: "Développement des jeunes joueurs",
  motivation: "Motivation", teamManagement: "Gestion d'équipe",
  negotiation: "Négociation", finance: "Finance",
};
// Attributs pertinents par poste (catégorie, clé) parmi les 11 critères communs : la cote
// générale (`rating`) d'un candidat pour un poste est la moyenne de ces attributs plutôt qu'un
// chiffre isolé. Le directeur des communications reste hors de ces 11 critères (relations
// médias, sans équivalent ici) et garde une seule cote générale.
export const STAFF_ATTRS = {
  headCoach: [["Entraînement", "coachOff"], ["Entraînement", "coachDef"], ["Entraînement", "coachGoalie"], ["Entraînement", "devYoung"], ["Gestion", "motivation"], ["Gestion", "teamManagement"]],
  assistantOff: [["Entraînement", "coachOff"], ["Entraînement", "devYoung"], ["Gestion", "teamManagement"]],
  assistantDef: [["Entraînement", "coachDef"], ["Entraînement", "devYoung"], ["Gestion", "teamManagement"]],
  fitnessCoach: [["Entraînement", "physio"], ["Entraînement", "devYoung"]],
  scoutAmateur: [["Dépistage", "scoutSkill"], ["Dépistage", "scoutPotential"], ["Gestion", "negotiation"]],
  scoutPro: [["Dépistage", "scoutSkill"], ["Dépistage", "scoutPotential"]],
  gm: [["Gestion", "negotiation"], ["Gestion", "teamManagement"], ["Gestion", "motivation"], ["Gestion", "finance"]],
  financeDirector: [["Gestion", "finance"], ["Gestion", "negotiation"]],
  hockeyOpsDirector: [["Gestion", "teamManagement"], ["Gestion", "negotiation"], ["Gestion", "finance"]],
};
const STAFF_ATTR_KEYS = Object.keys(STAFF_ATTR_LABELS);

// Un candidat porte toujours les 11 critères communs (`attrs`), même pour un poste qui n'en
// utilise qu'une partie — un même profil pourrait ainsi convenir à plusieurs postes. `rating`
// (cote générale, utilisée telle quelle par tous les effets de jeu existants : délai/qualité de
// dépistage, primes de performance, etc.) est la moyenne des critères pertinents pour le poste
// visé (STAFF_ATTRS), ou de l'ensemble des 11 critères pour un poste hors de cette liste
// (directeur des communications). `devSkill` (vitesse de progression des joueurs, voir App.jsx
// monthlyTick) reprend directement le critère "Développement des jeunes joueurs".
function generateStaffCandidate(rng, id, role) {
  const fn = FIRST_NAMES[Math.floor(rng() * FIRST_NAMES.length)];
  const ln = LAST_NAMES[Math.floor(rng() * LAST_NAMES.length)];
  const attrs = {};
  STAFF_ATTR_KEYS.forEach((key) => { attrs[key] = Math.round(40 + rng() * 55); });
  const spec = STAFF_ATTRS[role];
  const relevantKeys = spec ? spec.map(([, key]) => key) : STAFF_ATTR_KEYS;
  const rating = Math.round(relevantKeys.reduce((a, key) => a + attrs[key], 0) / relevantKeys.length);
  const salary = Math.round(STAFF_BASE_SALARY[role] * Math.pow(rating / 70, 1.6) * (0.85 + rng() * 0.3));
  const devSkill = attrs.devYoung;
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
  for (let i = 0; i < count; i++) list.push(generateStaffCandidate(rng, `STAFF-${i}`, roles[i % roles.length]));
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
  for (let i = 0; i < count; i++) list.push(generateStaffCandidate(Math.random, `STAFF-${Date.now()}-${i}`, roles[i % roles.length]));
  return list;
}
