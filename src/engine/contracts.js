import { capFor } from "./cap";

// ---------------------------------------------------------------------------------------
// Contrats à la LNH (montants en milliers de $).
//  - Valeur marchande selon l'échelle de la LNH (voir SALARY_CURVE) : ≈ 1,8 M$ à une cote de 60,
//    3,2 M$ à 62, 5,3 M$ à 64, 7,8 M$ à 66, 10,3 M$ à 68, 13,2 M$ à 70 ; plafonnée à 20 % du
//    plafond salarial (salaire maximal de la LNH), jamais sous le salaire minimum.
//  - Contrat d'entrée (recrue, « ELC ») : durée selon l'âge à la signature, salaire de base
//    selon le rang au repêchage, primes de rendement de l'annexe A pour les 1ers tours.
//  - Un volet (même salaire en LNH et en LAH) ou deux volets (salaire réduit dans la LAH).
//  - Primes de rendement permises pour les contrats d'entrée et les joueurs de 35 ans et plus
//    sur un contrat d'un an (règle de la LNH) ; elles comptent sur le plafond (montant maximal).
// Hypothèses (convention 2025-2030) : salaire minimum 850 k$ en 2026-27, 900 k$ ensuite ;
// salaire maximal d'une recrue 1 M$ en 2026-27.
// ---------------------------------------------------------------------------------------

export const CURRENT_YEAR = 2026;
const MIN_SALARY = { 2025: 775, 2026: 850, 2027: 900 };
const ELC_MAX = { 2025: 975, 2026: 1000, 2027: 1025 };
const byYear = (table, year, step) => { const ys = Object.keys(table).map(Number); const last = Math.max(...ys); return table[year] ?? (year > last ? table[last] + step * (year - last) : table[Math.min(...ys)]); };
export const minSalaryFor = (year) => byYear(MIN_SALARY, year, 25);
export const elcMaxFor = (year) => byYear(ELC_MAX, year, 25);
export const maxSalaryFor = (year) => Math.round(capFor(year) * 0.2 / 25) * 25;
export const ELC_BONUS_MAX = 1000;
export const VETERAN_BONUS_MAX = 3000;
export const MAX_TERM = { renewal: 8, freeAgent: 7 };
export const BURIAL_ALLOWANCE = 375; // un volet dans la LAH : seul le salaire au-delà de minimum + 375 k$ compte

const round25 = (v) => Math.round(v / 25) * 25;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// Coût d'un contrat pour le plafond : salaire + primes de rendement maximales + prime à la
// signature étalée sur la durée d'origine du contrat (voir engine/cap.js `hitOf`, même formule).
export function bonusTotal(contract) { return (contract?.bonuses || []).reduce((a, b) => a + (b.amount || 0), 0); }
export function signingBonusHit(contract) { return (contract?.signingBonus || 0) / (contract?.originalYears || contract?.years || 1); }
export function capHit(contract) { return (contract?.salary || 0) + bonusTotal(contract) + signingBonusHit(contract); }
export const isTwoWay = (contract) => contract?.type === "two";

// Valeur marchande (k$/an) d'un joueur, selon sa cote, son âge et son potentiel. `perf` :
// production de la dernière saison (points par match), qui fait monter ou baisser les attentes.
// Points d'ancrage cote → salaire (k$, plafond 2026-27 de 104 M$) : cotes du jeu p10 = 59,
// médiane 62, p90 = 66, p99 = 70 ; salaires de la LNH : un bon joueur de premier trio touche
// 8-10 M$, une vedette 10-13 M$, une supervedette 14-17 M$.
const SALARY_CURVE = [[55, 850], [57, 900], [59, 1300], [60, 1800], [61, 2400], [62, 3200], [63, 4200], [64, 5300], [65, 6500], [66, 7800], [67, 9000], [68, 10300], [69, 11700], [70, 13200], [72, 15500], [75, 18500]];
function curve(q) {
  if (q <= SALARY_CURVE[0][0]) return SALARY_CURVE[0][1];
  for (let i = 1; i < SALARY_CURVE.length; i++) {
    const [x1, y1] = SALARY_CURVE[i], [x0, y0] = SALARY_CURVE[i - 1];
    if (q <= x1) return y0 + ((q - x0) / (x1 - x0)) * (y1 - y0);
  }
  return 20800;
}
export function marketValue(player, year = CURRENT_YEAR, perf = null) {
  const young = player.age <= 24 ? (player.potential - player.ovr) * (player.age <= 21 ? 0.35 : 0.2) : 0;
  const q = player.ovr + Math.max(0, young);
  // Les salaires suivent la croissance du plafond.
  let v = curve(q) * (capFor(year) / 104000);
  // Les cotes des gardiens s'étalent davantage ; le marché les paie un peu moins (élite : 8-11 M$).
  if (player.pos === "G") v *= 0.85;
  if (player.age >= 32) v *= Math.max(0.5, 1 - 0.08 * (player.age - 31));
  if (perf != null && player.pos !== "G") v *= clamp(0.85 + perf * 0.3, 0.85, 1.25);
  return round25(clamp(v, minSalaryFor(year), maxSalaryFor(year)));
}

export function expectedYears(player) {
  if (player.age >= 35) return 1;
  if (player.age >= 32) return 2;
  if (player.age <= 24 && player.potential - player.ovr > 6) return 5;
  if (player.age <= 27 && player.ovr >= 64) return 7;
  if (player.age >= 29) return 3;
  return 4;
}
// Compatibilité : attentes « de base » (sans intérêt ni concurrence).
export const expectedSalary = (player, year = CURRENT_YEAR) => marketValue(player, year);

// Contrat réaliste pour un joueur généré (alignements fictifs, club-école, éditeur).
export function randomContract(rng, player = null, year = CURRENT_YEAR) {
  if (!player) return { years: 1, salary: minSalaryFor(year), type: "one" };
  const salary = round25(clamp(marketValue(player, year) * (0.75 + rng() * 0.5), minSalaryFor(year), maxSalaryFor(year)));
  const years = clamp(Math.round(expectedYears(player) * (0.5 + rng() * 0.7)), 1, 8);
  const twoWay = player.level === "LAH" || player.ovr < 58 || (player.age <= 24 && salary < 1200);
  return twoWay ? { years, salary: Math.min(salary, 1200), type: "two", ahlSalary: round25(80 + rng() * 270) } : { years, salary, type: "one" };
}
export function randomContractRT(player = null) { return randomContract(Math.random, player); }

// Contrat d'entrée d'un joueur repêché : durée selon l'âge, salaire selon le rang.
export function entryLevelContract(pickOverall, age, year) {
  const max = elcMaxFor(year), min = minSalaryFor(year);
  const years = age <= 21 ? 3 : age <= 23 ? 2 : 1;
  const salary = pickOverall <= 10 ? max : pickOverall <= 32 ? round25(max - 25 - (pickOverall - 10) * 2) : pickOverall <= 64 ? round25((max + min) / 2) : min;
  const bonuses = pickOverall <= 10
    ? [{ kind: "g", target: 20, amount: 250 }, { kind: "pts", target: 60, amount: 350 }, { kind: "gp", target: 60, amount: 200 }]
    : pickOverall <= 32 ? [{ kind: "pts", target: 50, amount: 250 }, { kind: "gp", target: 50, amount: 150 }] : [];
  return { years, originalYears: years, salary, type: "two", ahlSalary: 80, elc: true, signingBonus: pickOverall <= 32 ? round25(salary * 0.1) : 0, bonuses };
}

// ------------------------------- Primes de rendement -------------------------------
export const BONUS_KINDS = {
  gp: { label: "Matchs joués", short: "PJ", skater: true, goalie: true },
  g: { label: "Buts", short: "B", skater: true },
  a: { label: "Passes", short: "A", skater: true },
  pts: { label: "Points", short: "PTS", skater: true },
  plusMinus: { label: "Différentiel (+/-)", short: "+/-", skater: true },
  w: { label: "Victoires", short: "V", goalie: true },
};
// Primes de performance façon FM24 (buts, points, victoires, etc.) : permises sur n'importe quel
// contrat, avec un maximum plus élevé pour les cas prévus par la vraie convention de la LNH
// (contrat d'entrée, 35 ans et plus sur un an) et un maximum standard sinon.
export const STANDARD_BONUS_MAX = 2000;
export function bonusRules(player, offer, year) {
  const veteran = player.age >= 35 && offer.years === 1;
  if (offer.elc) return { allowed: true, max: ELC_BONUS_MAX, why: "Contrat d'entrée : primes de l'annexe A permises." };
  if (veteran) return { allowed: true, max: VETERAN_BONUS_MAX, why: "Joueur de 35 ans et plus sur un contrat d'un an : primes permises." };
  return { allowed: true, max: STANDARD_BONUS_MAX, why: "Primes de performance ajoutées au contrat." };
}
const fmt = (k) => (k >= 1000 ? `${(k / 1000).toLocaleString("fr-CA", { maximumFractionDigits: 3 })} M$` : `${Math.round(k * 1000).toLocaleString("fr-CA")} $`);
export function bonusLabel(b) { return `${b.target} ${BONUS_KINDS[b.kind]?.short || b.kind} : ${fmt(b.amount)}`; }
// Primes gagnées selon les statistiques de la saison (st : { gp, g, a, pts, plusMinus }).
export function earnedBonuses(contract, st) {
  return (contract?.bonuses || []).filter((b) => (st?.[b.kind] ?? 0) >= b.target);
}

// --------------------------- Intérêt d'un joueur pour ton équipe ---------------------------
// Région d'origine (hypothétique, stable pour un joueur) et région de chaque équipe.
const TEAM_REGION = {
  MTL: "quebec", OTT: "ontario", TOR: "ontario", WPG: "canada-ouest", CGY: "canada-ouest", EDM: "canada-ouest", VAN: "canada-ouest",
  SEA: "usa-ouest", SJS: "usa-ouest", LAK: "usa-ouest", ANA: "usa-ouest", VGK: "usa-ouest", UTA: "usa-ouest", COL: "usa-ouest",
  CHI: "usa-centre", STL: "usa-centre", MIN: "usa-centre", DAL: "usa-centre", NSH: "usa-centre", DET: "usa-centre", CBJ: "usa-centre",
};
export const teamRegion = (teamId) => TEAM_REGION[teamId] || "usa-est";
const REGION_LABEL = { quebec: "Québec", ontario: "Ontario", "canada-ouest": "Ouest canadien", "usa-est": "Est américain", "usa-centre": "Centre des États-Unis", "usa-ouest": "Ouest américain" };
function hash(s) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; }
export function homeRegionOf(player) {
  const r = (hash(player.id + player.name) % 100) / 100;
  if (player.nationality === "CA") return r < 0.28 ? "quebec" : r < 0.68 ? "ontario" : "canada-ouest";
  if (player.nationality === "US") return r < 0.45 ? "usa-est" : r < 0.8 ? "usa-centre" : "usa-ouest";
  return player.nationality || "CA";
}
export const homeRegionLabel = (player) => REGION_LABEL[homeRegionOf(player)] || { SE: "Suède", FI: "Finlande", RU: "Russie", CZ: "Tchéquie", SK: "Slovaquie", CH: "Suisse", DE: "Allemagne" }[homeRegionOf(player)] || "—";

const FWD = ["C", "LW", "RW"];
// Facteurs d'intérêt (−1 à +1) et leur poids selon l'âge.
//  ctx : { team, teamRank (0 = 1er), teamCount, isRenewal, lineupRank (rang du joueur à sa
//          position dans ton équipe s'il signait, 0 = meilleur), slots (postes réguliers) }
export function interestFactors(player, ctx) {
  const home = homeRegionOf(player), tr = teamRegion(ctx.team.id);
  const countrymen = ctx.team.roster.filter((p) => p.id !== player.id && p.nationality === player.nationality).length;
  let proximity;
  if (home === tr) proximity = 1;
  else if (["CA", "US"].includes(player.nationality)) proximity = (tr.startsWith("usa") ? "US" : "CA") === player.nationality ? 0.4 : -0.2;
  else proximity = Math.min(0.8, countrymen * 0.3) - 0.2;
  const win = ctx.teamCount > 1 ? 1 - (2 * ctx.teamRank) / (ctx.teamCount - 1) : 0;
  const slotShare = ctx.lineupRank / Math.max(1, ctx.slots);
  const role = slotShare < 0.25 ? 1 : slotShare < 0.5 ? 0.5 : slotShare < 1 ? 0 : -0.7;
  const w = {
    win: player.age >= 30 ? 0.35 : player.age >= 26 ? 0.25 : 0.15,
    home: 0.2,
    role: player.age <= 25 ? 0.3 : 0.2,
    loyalty: ctx.isRenewal ? 0.15 : 0,
  };
  const factors = [
    { key: "win", label: "Équipe gagnante", value: win, weight: w.win, note: `${ctx.teamRank + 1}e de la ligue` },
    { key: "home", label: "Proximité et attaches", value: proximity, weight: w.home, note: `Origine : ${homeRegionLabel(player)}${countrymen && !["CA", "US"].includes(player.nationality) ? ` · ${countrymen} compatriote${countrymen > 1 ? "s" : ""}` : ""}` },
    { key: "role", label: "Rôle et temps de glace", value: role, weight: w.role, note: ctx.lineupRank < ctx.slots ? `Serait n° ${ctx.lineupRank + 1} à sa position` : "Peu de place dans ton alignement" },
  ];
  if (ctx.isRenewal) factors.push({ key: "loyalty", label: "Attachement à l'équipe", value: 0.6, weight: w.loyalty, note: "Déjà chez toi" });
  const total = factors.reduce((a, f) => a + f.weight, 0);
  const interest = factors.reduce((a, f) => a + f.value * f.weight, 0) / total;
  return { factors, interest };
}
export function interestLabel(i) { return i >= 0.45 ? "Très intéressé" : i >= 0.15 ? "Intéressé" : i > -0.15 ? "Neutre" : i > -0.45 ? "Peu intéressé" : "Réticent"; }

// Rang qu'occuperait le joueur à sa position dans ton alignement (pour le temps de glace).
export function lineupContext(player, roster) {
  const group = player.pos === "G" ? ["G"] : FWD.includes(player.pos) ? FWD : ["LD", "RD"];
  const slots = player.pos === "G" ? 1 : FWD.includes(player.pos) ? 6 : 4;
  const better = roster.filter((p) => p.id !== player.id && group.includes(p.pos) && p.ovr > player.ovr).length;
  return { lineupRank: better, slots };
}

// --------------------------- Négociation : lassitude du joueur ---------------------------
// Trop d'offres refusées d'affilée pour le même joueur : son agent en demande plus (il se sent
// méprisé) et, au-delà de MAX_OFFER_ATTEMPTS, il refuse carrément de négocier davantage pour
// le reste de la saison (façon FM24 : un joueur qu'on relance trop se braque).
export const MAX_OFFER_ATTEMPTS = 3;
export function frustrationMultiplier(rejections = 0) { return 1 + Math.min(rejections, MAX_OFFER_ATTEMPTS) * 0.08; }

// Demande de l'agent : valeur marchande, rabais si le joueur aime ton équipe (ou prime s'il
// ne l'aime pas), prime de concurrence pour un agent libre recherché, majorée si tu l'as déjà
// relancé sans succès (`rejections` : offres refusées d'affilée pour ce joueur).
export function agentAsk(player, ctx, year, perf = null, rejections = 0) {
  const market = marketValue(player, year, perf) * frustrationMultiplier(rejections);
  const { interest } = interestFactors(player, ctx);
  const competition = ctx.isRenewal ? 0 : clamp((player.ovr - 60) / 10, 0, 1) * 0.12;
  return { salary: round25(clamp(market * (1 - 0.15 * interest) * (1 + competition), minSalaryFor(year), maxSalaryFor(year))), years: expectedYears(player), market, interest };
}

// Évaluation d'une offre. offer : { salary, years, type, ahlSalary, signingBonus, noTrade,
// bonuses }. Renvoie la probabilité d'acceptation, le détail et une contre-offre.
export function evaluateOffer(player, offer, ctx, year = CURRENT_YEAR, perf = null, rng = Math.random, rejections = 0) {
  const ask = agentAsk(player, ctx, year, perf, rejections);
  const { factors, interest } = interestFactors(player, ctx);
  const perYear = offer.salary + (offer.signingBonus || 0) / Math.max(1, offer.years) + bonusTotal(offer) * 0.4;
  const money = (perYear / ask.salary - 1) * 2.5;
  const term = -Math.min(1, Math.abs(offer.years - ask.years) * 0.15);
  const nhlLevel = player.ovr >= 60;
  const twoWay = offer.type === "two" ? (nhlLevel ? -0.8 : -0.15) : 0;
  const ntc = offer.noTrade ? (player.ovr >= 64 ? 0.12 : 0.04) : 0;
  const score = money + 0.35 * term + twoWay + ntc + 0.6 * interest;
  const probability = clamp(1 / (1 + Math.exp(-4 * score)), 0.02, 0.98);
  return {
    accept: rng() < probability, probability, ask, interest, factors,
    parts: { money, term, twoWay, ntc },
    counter: { salary: ask.salary, years: ask.years, type: "one" },
  };
}

// --------------------------- Estimation du directeur général ---------------------------
// Le DG estime les attentes du joueur (montant, durée) à la place de l'agent : sans DG en poste,
// ou avec un DG peu compétent, l'estimation est large et peu fiable ; un excellent DG cerne
// presque exactement la vraie demande. `gmRating` : cote du DG (20-99), ou null si le poste est
// vacant (estimation la plus large possible). Le bruit est stable pour un joueur/DG donnés
// (basé sur son id), pour ne pas changer à chaque rendu.
// Imprécision de l'estimation d'un DG selon sa cote (20-99) : large et peu fiable sans DG ou
// avec un DG faible, resserrée avec un excellent DG. Réutilisée pour les contrats (gmEstimate)
// et pour l'évaluation d'échange (TransactionsCenter).
export function gmSpread(gmRating = null) {
  return gmRating == null ? 0.4 : clamp(0.42 - (clamp(gmRating, 20, 99) - 20) / 79 * 0.37, 0.05, 0.4);
}
export function gmEstimate(player, ask, gmRating = null) {
  const spread = gmSpread(gmRating);
  const n = (hash(player.id + "gm") % 1000) / 1000 - 0.5; // -0.5..0.5, stable par joueur
  const salary = round25(ask.salary * (1 + n * 2 * spread));
  const yearsNoise = spread > 0.2 ? (n >= 0 ? 1 : -1) : 0;
  const years = clamp(ask.years + yearsNoise, 1, MAX_TERM.freeAgent);
  return { salary, years, spread };
}
