// Valeur d'échange approximative d'un joueur : cote actuelle, avec un supplément pour le
// potentiel des jeunes joueurs (un espoir vaut plus que sa seule cote actuelle). Même formule
// utilisée pour l'aperçu affiché au joueur (TransactionsCenter, sur les valeurs perçues/dépistées)
// et pour la décision de l'IA ci-dessous (toujours sur les vraies valeurs : une équipe connaît
// son propre effectif et celui qu'on lui propose).
export function tradeValue(ovr, potential, age) {
  const upside = age <= 24 ? Math.max(0, (potential ?? ovr) - ovr) * 0.4 : 0;
  return ovr + upside;
}

// Valeur approximative d'un choix au repêchage selon la ronde, sur la même échelle que
// tradeValue (un joueur de 50-60 de cote) — un 1er tour vaut une jeune pièce prometteuse, un choix
// de fin de repêchage vaut presque rien.
export const PICK_VALUE_BY_ROUND = [58, 42, 32, 25, 20, 16, 13];
export function pickValue(round) { return PICK_VALUE_BY_ROUND[round - 1] ?? 10; }

// L'IA n'accepte plus de perdre de valeur nette (± 3 % de bruit aléatoire, pour ne pas être un
// seuil parfaitement net) — elle exige au moins l'équivalent, jamais un rabais.
const CPU_TRADE_TOLERANCE = 0;
// Protection de ses meilleurs joueurs : elle refuse de céder un joueur nettement plus valable que
// le meilleur qu'elle recevrait, même si la somme totale des deux côtés semble correcte — un
// paquet de joueurs de profondeur ne remplace pas une vedette, dans la vraie vie comme ici.
const STAR_PROTECTION_RATIO = 1.15;

// Évaluation d'une proposition d'échange du point de vue de l'équipe de l'ordinateur qui la
// reçoit. `sentByCpu`/`receivedByCpu` : joueurs (vraies valeurs ovr/potential/age) que l'équipe de
// l'ordinateur enverrait / recevrait. Refuse si la valeur reçue est trop en deçà de la valeur
// envoyée, ou si elle cède un joueur bien plus valable que tout ce qu'elle reçoit — façon DG
// réaliste plutôt qu'un simple garde-fou de plafond salarial.
export function evaluateTradeForCpu(sentByCpu, receivedByCpu, rng = Math.random, sentPicks = [], receivedPicks = []) {
  const values = (list) => list.map((p) => tradeValue(p.ovr, p.potential, p.age));
  const outValues = values(sentByCpu), inValues = values(receivedByCpu);
  const pickValues = (list) => list.reduce((a, k) => a + pickValue(k.round), 0);
  const valueOut = outValues.reduce((a, v) => a + v, 0) + pickValues(sentPicks);
  const valueIn = inValues.reduce((a, v) => a + v, 0) + pickValues(receivedPicks);
  const noise = 1 + (rng() - 0.5) * 0.06; // ± 3 %
  const overallOk = valueIn >= valueOut * (1 - CPU_TRADE_TOLERANCE) * noise;
  const bestOut = outValues.length ? Math.max(...outValues) : 0;
  const bestIn = inValues.length ? Math.max(...inValues) : 0;
  const starProtected = bestOut === 0 || bestOut <= bestIn * STAR_PROTECTION_RATIO;
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
