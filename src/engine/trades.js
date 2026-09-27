// Valeur d'échange approximative d'un joueur : cote actuelle, avec un supplément pour le
// potentiel des jeunes joueurs (un espoir vaut plus que sa seule cote actuelle). Même formule
// utilisée pour l'aperçu affiché au joueur (TransactionsCenter, sur les valeurs perçues/dépistées)
// et pour la décision de l'IA ci-dessous (toujours sur les vraies valeurs : une équipe connaît
// son propre effectif et celui qu'on lui propose).
export function tradeValue(ovr, potential, age) {
  const upside = age <= 24 ? Math.max(0, (potential ?? ovr) - ovr) * 0.4 : 0;
  return ovr + upside;
}

// Tolérance de l'IA : elle refuse un échange qui lui ferait perdre plus de 12 % de valeur nette
// (avant une petite variation aléatoire stable, pour ne pas être parfaitement prévisible).
const CPU_TRADE_TOLERANCE = 0.12;

// Évaluation d'une proposition d'échange du point de vue de l'équipe de l'ordinateur qui la
// reçoit. `sentByCpu`/`receivedByCpu` : joueurs (vraies valeurs ovr/potential/age) que l'équipe de
// l'ordinateur enverrait / recevrait. Refuse si la valeur reçue est trop en deçà de la valeur
// envoyée — façon DG réaliste plutôt qu'un simple garde-fou de plafond salarial.
export function evaluateTradeForCpu(sentByCpu, receivedByCpu, rng = Math.random) {
  const valueOut = sentByCpu.reduce((a, p) => a + tradeValue(p.ovr, p.potential, p.age), 0);
  const valueIn = receivedByCpu.reduce((a, p) => a + tradeValue(p.ovr, p.potential, p.age), 0);
  const noise = 1 + (rng() - 0.5) * 0.1; // ± 5 %, pour ne pas être un seuil parfaitement net
  const accept = valueIn >= valueOut * (1 - CPU_TRADE_TOLERANCE) * noise;
  return { accept, valueOut, valueIn, diff: valueIn - valueOut };
}
