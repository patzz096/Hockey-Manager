export function formatTOI(min) {
  if (min == null) return "—";
  const m = Math.floor(min);
  const s = Math.round((min - m) * 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function starsText(value) {
  const rounded = Math.round(value * 2) / 2;
  const full = Math.floor(rounded);
  const half = rounded - full >= 0.5;
  return "★".repeat(full) + (half ? "⯨" : "") + "☆".repeat(Math.max(0, 5 - full - (half ? 1 : 0)));
}

// Montant en milliers de $ (unité des contrats) affiché en chiffre complet : 7 875 000 $,
// 850 000 $ (plutôt que l'abréviation "7,875 M$", moins lisible pour comparer des offres).
export function money(k) {
  if (k == null || isNaN(k)) return "—";
  return `${Math.round(k * 1000).toLocaleString("fr-CA")} $`;
}

export function contractLabel(contract) {
  if (!contract) return "Agent libre";
  const bonus = (contract.bonuses || []).reduce((a, b) => a + b.amount, 0);
  const parts = [`${contract.years} an${contract.years > 1 ? "s" : ""}`, `${money(contract.salary)} par saison`];
  if (contract.elc) parts.push("contrat d'entrée");
  parts.push(contract.type === "two" ? `2 volets (LAH ${money(contract.ahlSalary || 80)})` : "1 volet");
  if (bonus) parts.push(`primes jusqu'à ${money(bonus)}`);
  if (contract.noTrade) parts.push("NTC");
  return parts.join(" · ");
}

export function draftLabel(player) {
  return player.draftPick ? `${player.draftPick}e rang (${player.draftYear})` : "Non repêché";
}

export function ordinalFr(n) { return n === 1 ? "1er" : `${n}e`; }
