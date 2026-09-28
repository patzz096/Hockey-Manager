import { marketValue, CURRENT_YEAR } from "./contracts";

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// Valeur d'échange approximative d'un joueur : cote actuelle, avec un supplément pour le
// potentiel des jeunes joueurs (un espoir vaut plus que sa seule cote actuelle), et un ajustement
// selon son contrat par rapport à sa valeur marchande (`contract`, optionnel) : un joueur payé
// nettement sous le marché vaut plus dans un échange (l'acquéreur profite du rabais), un joueur
// payé au-dessus vaut moins (contrat difficile à assumer) — jusqu'à ± 15 % de la valeur de base.
// Même formule utilisée pour l'aperçu affiché au joueur (TransactionsCenter, sur les valeurs
// perçues/dépistées) et pour la décision de l'IA ci-dessous (toujours sur les vraies valeurs :
// une équipe connaît son propre effectif et celui qu'on lui propose).
export function tradeValue(ovr, potential, age, pos = null, contract = null, year = CURRENT_YEAR) {
  const upside = age <= 24 ? Math.max(0, (potential ?? ovr) - ovr) * 0.4 : 0;
  const base = ovr + upside;
  if (!contract?.salary) return base;
  const fairValue = marketValue({ ovr, potential: potential ?? ovr, age, pos: pos || "C" }, year);
  const surplusRatio = clamp((fairValue - contract.salary) / Math.max(fairValue, 1), -0.5, 0.5);
  return base * (1 + surplusRatio * 0.3);
}

// Valeur approximative d'un choix au repêchage selon la ronde, sur la même échelle que
// tradeValue (un joueur de 50-60 de cote) — un 1er tour vaut une jeune pièce prometteuse, un choix
// de fin de repêchage vaut presque rien.
export const PICK_VALUE_BY_ROUND = [58, 42, 32, 25, 20, 16, 13];
export function pickValue(round) { return PICK_VALUE_BY_ROUND[round - 1] ?? 10; }

// L'IA n'accepte plus de perdre de valeur nette (± 3 % de bruit aléatoire, pour ne pas être un
// seuil parfaitement net) — elle exige au moins l'équivalent, jamais un rabais.
const CPU_TRADE_TOLERANCE = 0;
// Protection de ses bons joueurs : elle refuse de céder un joueur de calibre nettement plus
// valable qu'aucune pièce reçue en retour, même si la somme totale des deux côtés semble
// correcte — un paquet de joueurs de profondeur ne remplace pas un bon joueur, dans la vraie vie
// comme ici. S'applique à CHAQUE joueur envoyé au-dessus du seuil de qualité (pas seulement le
// meilleur) : consolider plusieurs bons joueurs contre une pile de pièces de profondeur dont la
// somme atteint la même valeur nominale ne suffit pas à contourner la protection.
const STAR_PROTECTION_RATIO = 1.15;
const QUALITY_THRESHOLD = 62;

// Évaluation d'une proposition d'échange du point de vue de l'équipe de l'ordinateur qui la
// reçoit. `sentByCpu`/`receivedByCpu` : joueurs (vraies valeurs ovr/potential/age) que l'équipe de
// l'ordinateur enverrait / recevrait. Refuse si la valeur reçue est trop en deçà de la valeur
// envoyée, ou si elle cède un joueur bien plus valable que tout ce qu'elle reçoit — façon DG
// réaliste plutôt qu'un simple garde-fou de plafond salarial.
// `humanGmNegotiation` : critère Négociation du DG de l'équipe humaine qui propose l'échange (null
// si aucun DG en poste, ou échange entre deux équipes de l'ordinateur). Un bon négociateur obtient
// un rabais (l'ordinateur accepte de recevoir un peu moins de valeur que ce qu'il envoie), un
// mauvais négociateur doit au contraire surpayer — jusqu'à ± 15 % du seuil de valeur exigé.
export function evaluateTradeForCpu(sentByCpu, receivedByCpu, rng = Math.random, sentPicks = [], receivedPicks = [], humanGmNegotiation = null) {
  const values = (list) => list.map((p) => tradeValue(p.ovr, p.potential, p.age, p.pos, p.contract));
  const outValues = values(sentByCpu), inValues = values(receivedByCpu);
  const pickValues = (list) => list.reduce((a, k) => a + pickValue(k.round), 0);
  const valueOut = outValues.reduce((a, v) => a + v, 0) + pickValues(sentPicks);
  const valueIn = inValues.reduce((a, v) => a + v, 0) + pickValues(receivedPicks);
  const noise = 1 + (rng() - 0.5) * 0.06; // ± 3 %
  const negotiationEdge = humanGmNegotiation == null ? 0 : clamp((humanGmNegotiation - 60) / 200, -0.15, 0.15);
  const overallOk = valueIn >= valueOut * (1 - CPU_TRADE_TOLERANCE - negotiationEdge) * noise;
  // Chaque joueur de qualité envoyé (au-dessus de QUALITY_THRESHOLD) doit trouver une pièce
  // comparable reçue en retour (appariement glouton, chaque pièce reçue utilisée au plus une
  // fois) : du plus valable au moins valable, sinon refus — peu importe la somme totale.
  const outQuality = outValues.filter((v) => v >= QUALITY_THRESHOLD).sort((a, b) => b - a);
  const inSorted = [...inValues].sort((a, b) => b - a);
  const usedIn = new Array(inSorted.length).fill(false);
  let starProtected = true;
  for (const v of outQuality) {
    const i = inSorted.findIndex((iv, idx) => !usedIn[idx] && iv >= v / STAR_PROTECTION_RATIO);
    if (i === -1) { starProtected = false; break; }
    usedIn[i] = true;
  }
  const accept = overallOk && starProtected;
  // `reason` explique un refus (utilisé pour varier le message de l'IA, voir tradeResponseLine) :
  // "star" si la vraie cause est de céder un joueur trop précieux, "value" sinon.
  const reason = accept ? null : !starProtected ? "star" : "value";
  return { accept, valueOut, valueIn, diff: valueIn - valueOut, reason };
}

// ------------------------- Réponses « typiques » des équipes adverses -------------------------
// Phrases variées façon DG réel, pour ne pas répéter toujours la même ligne de refus/acceptation.
// Le choix est aléatoire (purement cosmétique, n'affecte pas la décision) mais stable pour un
// même essai grâce à `rng` fourni par l'appelant si la reproductibilité importe.
const REJECT_VALUE_LINES = [
  "Cette offre ne reflète pas la valeur de nos joueurs.",
  "On ne peut pas accepter un échange qui nous désavantage à ce point.",
  "Nos dépisteurs jugent cette proposition nettement insuffisante.",
  "Il faudra bonifier l'offre pour qu'on la considère sérieusement.",
  "Notre direction juge que ça ne vaut pas le coup pour nous, désolé.",
  "Reviens avec plus de valeur et on en reparle.",
];
const REJECT_STAR_LINES = [
  "On ne cède pas un joueur de ce calibre pour un groupe de pièces secondaires.",
  "Ce joueur est trop important pour notre équipe pour partir dans un échange comme celui-ci.",
  "Il nous faudrait un joueur de calibre comparable en retour, pas plusieurs pièces de profondeur.",
  "Notre personnel de dépistage n'endosse pas cet échange : rien en retour ne vaut vraiment cette pièce.",
  "Un paquet de joueurs de profondeur ne remplace pas une vedette à nos yeux.",
];
const ACCEPT_GENEROUS_LINES = [
  "Nos dépisteurs recommandent fortement cet échange — marché conclu.",
  "C'est une offre qu'on ne pouvait pas refuser.",
  "Notre direction est ravie de cette transaction.",
  "Franchement, on ne s'attendait pas à une si bonne offre.",
];
const ACCEPT_FAIR_LINES = [
  "Un échange équitable pour les deux équipes — on embarque.",
  "Ça répond à nos besoins actuels, marché conclu.",
  "Notre personnel juge cette offre raisonnable.",
  "Ça nous convient, on signe l'échange.",
];
function pick(list, rng) { return list[Math.floor(rng() * list.length)]; }
// Ligne de réponse « typique » à afficher/annoncer, selon le résultat d'evaluateTradeForCpu.
export function tradeResponseLine(evalResult, rng = Math.random) {
  if (evalResult.accept) return pick(evalResult.diff > evalResult.valueOut * 0.15 ? ACCEPT_GENEROUS_LINES : ACCEPT_FAIR_LINES, rng);
  return pick(evalResult.reason === "star" ? REJECT_STAR_LINES : REJECT_VALUE_LINES, rng);
}
