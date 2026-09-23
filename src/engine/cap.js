// Plafond salarial de la LNH (montants en milliers de $, comme les contrats du jeu).
// Plafond annoncé : 104 M$ en 2026-2027 et 113,5 M$ en 2027-2028 ; ensuite +5 % par saison
// (hypothèse). Plancher ≈ 74 % du plafond (rapport observé en 2025-2026 : 70,6 / 95,5 M$).
// Seuls les salaires de l'alignement LNH comptent (le club-école est exclu).
const KNOWN_CAPS = { 2025: 95500, 2026: 104000, 2027: 113500 };
export const ROSTER_MAX = 23;

export function capFor(year) {
  if (KNOWN_CAPS[year]) return KNOWN_CAPS[year];
  const last = Math.max(...Object.keys(KNOWN_CAPS).map(Number));
  return Math.round(KNOWN_CAPS[last] * Math.pow(1.05, year - last) / 100) * 100;
}
export function floorFor(year) { return Math.round(capFor(year) * 0.74 / 100) * 100; }

export function payroll(roster) { return roster.reduce((a, p) => a + (p.contract?.salary || 0), 0); }

export function capStatus(roster, year) {
  const cap = capFor(year), floor = floorFor(year), used = payroll(roster);
  return { cap, floor, used, space: cap - used, overCap: used > cap, underFloor: used < floor, rosterSize: roster.length };
}

// Vérifie si l'alignement peut ajouter `addSalary` et retirer `removeSalary` (k$).
// Une équipe déjà au-dessus du plafond peut seulement réduire sa masse salariale.
export function fitsUnderCap(roster, year, addSalary, removeSalary = 0) {
  const used = payroll(roster);
  const after = used + addSalary - removeSalary;
  return after <= capFor(year) || after <= used;
}

export function formatMoney(k) { return `${(k / 1000).toLocaleString("fr-CA", { minimumFractionDigits: 1, maximumFractionDigits: 3 })} M$`; }
