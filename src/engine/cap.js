// Plafond salarial de la LNH (montants en milliers de $, comme les contrats du jeu).
// Plafond annoncé : 104 M$ en 2026-2027 et 113,5 M$ en 2027-2028 ; ensuite +5 % par saison
// (hypothèse). Plancher ≈ 74 % du plafond (rapport observé en 2025-2026 : 70,6 / 95,5 M$).
// Seuls les salaires de l'alignement LNH comptent (le club-école est exclu), plus le « cap mort »
// (rachats, salaires retenus dans des échanges). La LTIR permet de dépasser le plafond.
const KNOWN_CAPS = { 2025: 95500, 2026: 104000, 2027: 113500 };
export const ROSTER_MAX = 23;
export const MAX_RETAINED_CONTRACTS = 3;
export const MAX_RETENTION = 0.5;

export function capFor(year) {
  if (KNOWN_CAPS[year]) return KNOWN_CAPS[year];
  const last = Math.max(...Object.keys(KNOWN_CAPS).map(Number));
  return Math.round(KNOWN_CAPS[last] * Math.pow(1.05, year - last) / 100) * 100;
}
export function floorFor(year) { return Math.round(capFor(year) * 0.74 / 100) * 100; }

// Masse salariale de l'alignement. Les joueurs en LTIR comptent toujours (comme dans la LNH).
export function payroll(roster) { return roster.reduce((a, p) => a + (p.contract?.salary || 0), 0); }

// Cap mort de la saison `year` : [{ label, amount, seasons: [2027, 2028, ...], kind }].
export function deadCapFor(entries = [], year) {
  return entries.filter((e) => e.seasons.includes(year)).reduce((a, e) => a + e.amount, 0);
}

// opts : { dead: k$ de cap mort, relief: allègement LTIR (k$), ltirIds: joueurs en LTIR }.
export function capStatus(roster, year, opts = {}) {
  const cap = capFor(year), floor = floorFor(year);
  const dead = opts.dead || 0, relief = opts.relief || 0;
  const used = payroll(roster) + dead;
  const limit = cap + relief;
  const ltir = new Set(opts.ltirIds || []);
  return { cap, floor, dead, relief, limit, used, space: limit - used, overCap: used > limit, underFloor: used < floor, rosterSize: roster.filter((p) => !ltir.has(p.id)).length };
}

// Vérifie si l'alignement peut ajouter `addSalary` et retirer `removeSalary` (k$).
// Une équipe déjà au-dessus du plafond peut seulement réduire sa masse salariale.
export function fitsUnderCap(roster, year, addSalary, removeSalary = 0, opts = {}) {
  const used = payroll(roster) + (opts.dead || 0);
  const after = used + addSalary - removeSalary;
  return after <= capFor(year) + (opts.relief || 0) || after <= used;
}

// Rachat de contrat (règle de la LNH, pour un salaire constant) : l'équipe paie 2/3 du salaire
// restant (1/3 si le joueur a moins de 26 ans), étalé sur le double des années restantes.
// Impact sur le plafond chaque saison = paiement annuel (salaire × fraction / 2).
// Les années restantes excluent la saison qui se termine (rachat en juin).
export function buyoutTerms(player, seasonYear) {
  const remaining = (player.contract?.years ?? 0) - 1;
  if (remaining <= 0) return null;
  const salary = player.contract.salary;
  const fraction = player.age < 26 ? 1 / 3 : 2 / 3;
  const perYear = Math.round((salary * fraction) / 2);
  const seasons = Array.from({ length: remaining * 2 }, (_, i) => seasonYear + 1 + i);
  return { fraction, perYear, seasons, total: perYear * seasons.length, saving: salary - perYear };
}

// Rétention de salaire dans un échange : l'équipe qui cède garde jusqu'à 50 % du salaire
// jusqu'à la fin du contrat (3 contrats retenus au maximum en même temps).
export function retentionEntry(player, rate, seasonYear) {
  const amount = Math.round((player.contract?.salary || 0) * rate);
  const seasons = Array.from({ length: player.contract?.years ?? 1 }, (_, i) => seasonYear + i);
  return { label: `Salaire retenu — ${player.name}`, amount, seasons, kind: "retention", playerId: player.id };
}

export function formatMoney(k) { return `${(k / 1000).toLocaleString("fr-CA", { minimumFractionDigits: 1, maximumFractionDigits: 3 })} M$`; }
