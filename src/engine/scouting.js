import { SKATER_CATEGORIES, GOALIE_CATEGORIES, ATTR_LABELS, computeOvr, attr20 } from "./attributes";
import { seededRandom } from "./random";

// Qualité attribuée au personnel interne quand aucun dépisteur n'est en poste.
export const INTERNAL_SCOUT_RATING = 40;

// Un joueur de 20 ans ou moins relève du dépisteur amateur, les autres du dépisteur pro.
// Si ce poste est vide, l'autre dépisteur s'en charge, mais hors de sa spécialité (-15 %).
export function assignScout(player, staff) {
  const amateur = player.age <= 20;
  const primary = amateur ? staff?.scoutAmateur : staff?.scoutPro;
  const secondary = amateur ? staff?.scoutPro : staff?.scoutAmateur;
  if (primary) return { id: primary.id, name: primary.name, rating: primary.rating, offSpecialty: false };
  if (secondary) return { id: secondary.id, name: secondary.name, rating: Math.round(secondary.rating * 0.85), offSpecialty: true };
  return { id: "internal", name: "Personnel interne (aucun dépisteur dédié)", rating: INTERNAL_SCOUT_RATING, offSpecialty: false };
}

// Délai en jours (1 ronde du calendrier = 1 jour) : 1 jour pour un dépisteur 20/20, 6 pour un 1/20.
export function scoutingDelay(rating) {
  return Math.max(1, Math.min(6, Math.round(6 - (rating / 99) * 5)));
}

export function reliabilityLabel(rating) {
  const r20 = attr20(rating);
  return r20 >= 16 ? "Très fiable" : r20 >= 12 ? "Fiable" : r20 >= 8 ? "Approximative" : "Peu fiable";
}

function gaussian(rng) {
  const u = Math.max(1e-9, rng()), v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

// Rapport de dépistage. Plus le dépisteur est bon, plus ses estimations sont proches de la
// réalité : l'écart type de l'erreur diminue avec sa cote. Le potentiel (long terme) est
// toujours plus incertain que l'habileté actuelle.
export function createScoutReport(player, scout, day) {
  const rng = seededRandom(hashSeed(`${player.id}|${scout.id}|${day}`));
  const q = clamp(scout.rating / 99, 0, 1);
  const attrSd = 1.5 + (1 - q) * 11;
  const potSd = 2 + (1 - q) * 13;
  // Impression d'ensemble : un mauvais dépisteur sur- ou sous-estime tout le joueur d'un bloc,
  // sinon les erreurs individuelles s'annuleraient dans la cote globale.
  const impression = gaussian(rng) * (0.5 + (1 - q) * 7);

  const attrs = {};
  Object.entries(player.attrs).forEach(([k, v]) => { attrs[k] = Math.round(clamp(v + impression + gaussian(rng) * attrSd, 20, 99)); });
  const estOvr = computeOvr(player.pos, attrs);
  const trueGap = player.potential - player.ovr;
  const estPotential = Math.round(clamp(estOvr + trueGap + gaussian(rng) * potSd, estOvr - 4, 99));

  return {
    known: true,
    day,
    scoutId: scout.id,
    scoutName: scout.name,
    quality: scout.rating,
    offSpecialty: scout.offSpecialty,
    estOvr,
    estPotential,
    attrs,
    text: reportText(player, attrs, estOvr, estPotential),
  };
}

// Note générale : on pèse davantage le potentiel chez les jeunes, l'habileté actuelle chez les vétérans.
export function overallEstimate(age, ovr, potential) {
  const wNow = age <= 20 ? 0.4 : age <= 23 ? 0.6 : age <= 27 ? 0.8 : 0.95;
  return ovr * wNow + potential * (1 - wNow);
}

function reportText(player, attrs, estOvr, estPotential) {
  const cats = player.pos === "G" ? GOALIE_CATEGORIES : SKATER_CATEGORIES;
  const sorted = cats.flatMap((c) => c.attrs).map((k) => ({ k, v: attrs[k] })).sort((a, b) => b.v - a.v);
  const strengths = sorted.slice(0, 2).map((a) => ATTR_LABELS[a.k].toLowerCase());
  const weaknesses = sorted.slice(-2).map((a) => ATTR_LABELS[a.k].toLowerCase());
  const gap = estPotential - estOvr;
  let projection;
  if (gap >= 12) projection = "Marge de progression importante — un projet à long terme prometteur.";
  else if (gap >= 5) projection = "Encore de la place pour progresser avec le bon encadrement.";
  else if (gap <= -2) projection = "A probablement atteint son plafond, sinon amorce un déclin.";
  else projection = "Joueur déjà proche de son plein potentiel.";
  return `Points forts: ${strengths.join(" et ")}. À travailler: ${weaknesses.join(" et ")}. ${projection}`;
}

function hashSeed(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return (h % 233280) + 1;
}

// Ce que ton organisation sait d'un joueur. Un rapport de dépistage prime ; sinon les joueurs
// de ton équipe sont connus du personnel interne, et les autres restent cachés.
export function getScoutInfo(player, ownerTeamId, myTeamId, staff, scoutKnowledge) {
  const explicit = scoutKnowledge[player.id];
  if (explicit) return explicit;
  if (ownerTeamId === myTeamId) {
    const best = Math.max(staff?.scoutAmateur?.rating || 0, staff?.scoutPro?.rating || 0, 45);
    return { known: true, day: null, scoutName: "Personnel interne", quality: best };
  }
  return { known: false, day: null, scoutName: null, quality: 0 };
}

// Valeurs à afficher : les estimations du rapport s'il existe, sinon les vraies valeurs.
export function perceivedRatings(player, scoutInfo) {
  if (scoutInfo?.estOvr != null) return { ovr: scoutInfo.estOvr, potential: scoutInfo.estPotential, attrs: scoutInfo.attrs };
  return { ovr: player.ovr, potential: player.potential, attrs: player.attrs };
}

// Comme dans FM : même tes propres joueurs sont vus à travers ton personnel. Le dépisteur
// assigné (amateur/pro selon l'âge) produit une évaluation continue ; le bruit est fixe pour un
// même joueur et un même dépisteur, donc la progression réelle reste visible.
export function staffViewPlayer(player, staff) {
  const scout = assignScout(player, staff);
  const r = createScoutReport(player, scout, 0);
  return { ...player, ovr: r.estOvr, potential: r.estPotential, attrs: r.attrs, staffView: { scoutName: scout.name, quality: scout.rating } };
}
