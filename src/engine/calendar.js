// Calendrier de saison. Les jours sont comptés depuis le 1er octobre 2026 (jour 0), sans
// jamais revenir à zéro : les délais (dépistage, etc.) restent valables d'une saison à l'autre.
export const EPOCH = Date.UTC(2026, 9, 1);
const DAY_MS = 86400000;
export const FIRST_SEASON = 2026;

export function dayToDate(day) { return new Date(EPOCH + day * DAY_MS); }
export function dateToDay(y, m, d) { return Math.round((Date.UTC(y, m, d) - EPOCH) / DAY_MS); }
const MONTHS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
const MONTHS_LONG = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
export function formatDay(day) { const d = dayToDate(day); return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`; }
export function monthLabel(day) { const d = dayToDate(day); return `${MONTHS_LONG[d.getUTCMonth()]} ${d.getUTCFullYear()}`; }
export function monthIndex(day) { const d = dayToDate(day); return d.getUTCFullYear() * 12 + d.getUTCMonth(); }

// Dates clés de la saison `year` (ex. 2026 = saison 2026-2027).
export const ROUND_SPACING = 3; // un tour du calendrier tous les 3 jours
export function seasonDates(year) {
  const start = dateToDay(year, 9, 7); // 7 octobre : premier match
  const marchFirst = dateToDay(year + 1, 2, 1);
  const dow = dayToDate(marchFirst).getUTCDay(); // 5 = vendredi
  return {
    preseason: dateToDay(year, 9, 1),
    start,
    tradeDeadline: marchFirst + ((5 - dow + 7) % 7), // 1er vendredi de mars
    draft: dateToDay(year + 1, 5, 24),            // une semaine avant le 1er juillet
    freeAgency: dateToDay(year + 1, 6, 1),        // 1er juillet
    nextSeason: dateToDay(year + 1, 9, 1),
  };
}
export function roundDay(year, round) { return seasonDates(year).start + (round - 1) * ROUND_SPACING; }
// Jour réel d'un match donné : les ROUND_SPACING matchs d'une même ronde (voir
// engine/league.js buildSchedule) sont étalés sur autant de jours consécutifs (`game.slot`,
// 0..ROUND_SPACING-1) plutôt que joués tous le même soir par les 32 équipes à la fois — comme
// dans la vraie LNH, où le calendrier complet ne se joue jamais en même temps pour tout le monde.
export function gameDay(year, game) { return roundDay(year, game.round) + (game.slot || 0); }

// Calendrier mensuel (onglet Calendrier, vue "mon équipe") : premier jour du mois contenant
// `day`, et premier jour du mois `n` mois plus loin (n négatif = mois précédents).
export function monthStartDay(day) { const d = dayToDate(day); return dateToDay(d.getUTCFullYear(), d.getUTCMonth(), 1); }
export function addMonths(day, n) { const d = dayToDate(day); return dateToDay(d.getUTCFullYear(), d.getUTCMonth() + n, 1); }

// Échanges et signatures d'agents libres : fermés de la date limite jusqu'au 1er juillet.
export function transactionWindow(year, day) {
  const d = seasonDates(year);
  if (day >= d.tradeDeadline && day < d.freeAgency) return { open: false, reason: `Période gelée : date limite des échanges passée (${formatDay(d.tradeDeadline)}). Réouverture le ${formatDay(d.freeAgency)}.` };
  return { open: true, reason: day < d.tradeDeadline ? `Date limite des échanges : ${formatDay(d.tradeDeadline)}.` : "Marché des agents libres ouvert." };
}
