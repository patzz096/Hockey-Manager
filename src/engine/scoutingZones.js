import { SCOUT_REGIONS, regionOfLeague } from "./minorLeagues";
import { createScoutReport, overallEstimate, INTERNAL_SCOUT_RATING } from "./scouting";
import { attr20 } from "./attributes";

// ---------------------------------------------------------------------------------------
// Zones de dépistage, à la Football Manager : chaque dépisteur est déployé dans une zone.
//  - La couverture d'une zone (0-100 %) monte chaque semaine où un dépisteur y travaille
//    (plus vite s'il est bon) et s'érode lentement sinon.
//  - Chaque semaine, le dépisteur rédige des rapports sur des joueurs de sa zone : il repère
//    surtout les meilleurs, d'autant mieux que la zone est bien couverte.
//  - Les joueurs intéressants deviennent des suggestions notées A (recommandé fortement),
//    B (recommandé) ou C (à suivre).
// ---------------------------------------------------------------------------------------

export const SCOUT_SLOTS = [
  { key: "scoutAmateur", label: "Dépisteur amateur", specialty: "junior" },
  { key: "scoutPro", label: "Dépisteur professionnel", specialty: "pro" },
];
export const DEFAULT_ASSIGNMENTS = { scoutAmateur: "quebec", scoutPro: "pro" };
export const DEFAULT_COVERAGE = Object.fromEntries(SCOUT_REGIONS.map((r) => [r.id, r.id === "pro" ? 40 : r.id === "quebec" || r.id === "ontario" ? 20 : 10]));

export const GRADES = {
  A: { label: "Recommandé fortement", color: "#2DBE74" },
  B: { label: "Recommandé", color: "#5CC8FF" },
  C: { label: "À suivre", color: "#FFC247" },
  D: { label: "Sans intérêt pour l'instant", color: "#8C97A3" },
};

// Couverture gagnée par semaine : 7 % pour un dépisteur 8/20, 12 % pour un 18/20.
export function coverageGain(rating) { return 3 + rating / 10; }
export function reportsPerWeek(rating) { return 1 + (rating >= 60 ? 1 : 0) + (rating >= 80 ? 1 : 0); }

// Dépisteur effectif d'un poste : hors de sa spécialité (junior / pro), il perd 15 %.
export function scoutForSlot(staff, slotKey, regionId) {
  const s = staff?.[slotKey];
  const slot = SCOUT_SLOTS.find((x) => x.key === slotKey);
  const base = s ? { id: s.id, name: s.name, rating: s.rating } : { id: `internal-${slotKey}`, name: "Personnel interne", rating: INTERNAL_SCOUT_RATING };
  const off = (slot.specialty === "pro") !== (regionId === "pro");
  return { ...base, rating: off ? Math.round(base.rating * 0.85) : base.rating, offSpecialty: off };
}

// Note d'un rapport. Espoirs : selon le potentiel estimé. Professionnels : comparés à la
// moyenne de ton équipe (un joueur qui l'améliorerait tout de suite est recommandé).
export function gradeReport(player, report, benchmark) {
  if (player.draftProspect || player.age <= 20) {
    const p = report.estPotential;
    return p >= 70 ? "A" : p >= 65 ? "B" : p >= 60 ? "C" : "D";
  }
  const d = report.estOvr - benchmark;
  return d >= 6 ? "A" : d >= 2 ? "B" : d >= -2 ? "C" : "D";
}
function gradeNote(grade, player, report) {
  const young = player.draftProspect || player.age <= 20;
  const r20 = (v) => attr20(v);
  if (young) return `${GRADES[grade].label} : habileté ${r20(report.estOvr)}/20, potentiel estimé ${r20(report.estPotential)}/20. ${report.text}`;
  return `${GRADES[grade].label} : niveau estimé ${r20(report.estOvr)}/20. ${report.text}`;
}

// Une semaine de dépistage. candidatesOf(regionId) → [{ player, ownerTeamId }] ;
// lastReportDay(playerId) → jour du dernier rapport (ou null).
export function weeklyScouting({ assignments, coverage, staff, candidatesOf, lastReportDay, day, rng, benchmark }) {
  const next = { ...coverage };
  const active = new Set(Object.values(assignments).filter(Boolean));
  SCOUT_REGIONS.forEach((r) => { if (!active.has(r.id)) next[r.id] = Math.max(0, (next[r.id] ?? 0) - 1); });
  const reports = [];
  const taken = new Set();
  SCOUT_SLOTS.forEach(({ key }) => {
    const regionId = assignments[key];
    if (!regionId) return;
    const scout = scoutForSlot(staff, key, regionId);
    next[regionId] = Math.min(100, (next[regionId] ?? 0) + coverageGain(scout.rating));
    const cov = next[regionId] / 100;
    // Pas de nouveau rapport sur un joueur vu depuis moins de 120 jours.
    const pool = candidatesOf(regionId).filter(({ player }) => !taken.has(player.id) && (lastReportDay(player.id) == null || day - lastReportDay(player.id) > 120));
    for (let n = 0; n < reportsPerWeek(scout.rating) && pool.length; n++) {
      // Une zone bien couverte fait ressortir les meilleurs joueurs.
      const weights = pool.map(({ player }) => Math.exp((overallEstimate(player.age, player.ovr, player.potential) - 55) / (9 - cov * 5)));
      const total = weights.reduce((a, b) => a + b, 0);
      let x = rng() * total, i = 0;
      while (i < pool.length - 1 && (x -= weights[i]) > 0) i++;
      const { player, ownerTeamId } = pool.splice(i, 1)[0];
      taken.add(player.id);
      const report = createScoutReport(player, scout, day);
      const grade = gradeReport(player, report, benchmark);
      reports.push({ player, ownerTeamId, report, grade, note: gradeNote(grade, player, report), regionId, scoutName: scout.name, day });
    }
  });
  return { coverage: next, reports };
}

export const regionLabel = (id) => SCOUT_REGIONS.find((r) => r.id === id)?.label || "—";
export { regionOfLeague };
