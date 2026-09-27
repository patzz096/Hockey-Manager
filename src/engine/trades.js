// Valeur d'échange approximative d'un joueur : cote actuelle, avec un supplément pour le
// potentiel des jeunes joueurs (un espoir vaut plus que sa seule cote actuelle). Même formule
// utilisée pour l'aperçu affiché au joueur (TransactionsCenter, sur les valeurs perçues/dépistées)
// et pour la décision de l'IA ci-dessous (toujours sur les vraies valeurs : une équipe connaît
// son propre effectif et celui qu'on lui propose).
export function tradeValue(ovr, potential, age) {
  const upside = age <= 24 ? Math.max(0, (potential ?? ovr) - ovr) * 0.4 : 0;
  return ovr + upside;
}

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
export function evaluateTradeForCpu(sentByCpu, receivedByCpu, rng = Math.random) {
  const values = (list) => list.map((p) => tradeValue(p.ovr, p.potential, p.age));
  const outValues = values(sentByCpu), inValues = values(receivedByCpu);
  const valueOut = outValues.reduce((a, v) => a + v, 0);
  const valueIn = inValues.reduce((a, v) => a + v, 0);
  const noise = 1 + (rng() - 0.5) * 0.06; // ± 3 %
  const overallOk = valueIn >= valueOut * (1 - CPU_TRADE_TOLERANCE) * noise;
  const bestOut = outValues.length ? Math.max(...outValues) : 0;
  const bestIn = inValues.length ? Math.max(...inValues) : 0;
  const starProtected = bestOut === 0 || bestOut <= bestIn * STAR_PROTECTION_RATIO;
  return { accept: overallOk && starProtected, valueOut, valueIn, diff: valueIn - valueOut };
}
