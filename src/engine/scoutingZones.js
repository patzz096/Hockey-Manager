import { SCOUT_REGIONS, MINOR_LEAGUES, regionOfLeague } from "./minorLeagues";
import { createScoutReport, overallEstimate, INTERNAL_SCOUT_RATING } from "./scouting";
import { attr20 } from "./attributes";
import { ROLES, roleFit, roleGroupOf } from "./roles";
import { FIRST_NAMES, LAST_NAMES } from "../data/names";
import { pickNationality } from "./players";

// ---------------------------------------------------------------------------------------
// Dépistage à la Football Manager : une équipe de dépisteurs, chacun envoyé en mission.
//  Mission = zone (ou une seule ligue de la zone), type de recherche (générale, par position
//  ou par rôle), cible (cuvée du repêchage ou tous les joueurs) et durée (en semaines, ou
//  continue). Chaque semaine :
//   - la couverture de la zone (0-100 %) monte, plus vite pour un bon dépisteur et pour une
//     seule ligue ; les zones délaissées s'érodent lentement ;
//   - le dépisteur rédige des rapports sur les joueurs qui correspondent à sa recherche ; il
//     repère surtout les meilleurs, d'autant mieux que la zone est couverte ;
//   - la mission coûte des frais (déplacements, hébergement) selon son étendue et la distance
//     entre le port d'attache du dépisteur et la zone.
// Les joueurs intéressants deviennent des suggestions notées A, B ou C.
// ---------------------------------------------------------------------------------------

export const MAX_EXTRA_SCOUTS = 12;
export const NORTH_AMERICA = ["quebec", "ontario", "west", "usa", "pro"];
export const GRADES = {
  A: { label: "Recommandé fortement", color: "#2DBE74" },
  B: { label: "Recommandé", color: "#5CC8FF" },
  C: { label: "À suivre", color: "#FFC247" },
  D: { label: "Sans intérêt pour l'instant", color: "#8C97A3" },
};
export const DURATIONS = [{ weeks: 2, label: "2 semaines" }, { weeks: 4, label: "1 mois" }, { weeks: 8, label: "2 mois" }, { weeks: 12, label: "3 mois" }, { weeks: null, label: "Continue (jusqu'à rappel)" }];
export const POSITION_FOCUS = [
  { id: "F", label: "Attaquants" }, { id: "D", label: "Défenseurs" }, { id: "G", label: "Gardiens" },
  { id: "C", label: "Centres" }, { id: "LW", label: "Ailiers gauches" }, { id: "RW", label: "Ailiers droits" }, { id: "LD", label: "Défenseurs gauches" }, { id: "RD", label: "Défenseurs droits" },
];
const FORWARD = ["C", "LW", "RW"], DEF = ["LD", "RD"];
const matchesPosition = (p, id) => (id === "F" ? FORWARD.includes(p.pos) : id === "D" ? DEF.includes(p.pos) : p.pos === id);

// Port d'attache des dépisteurs en chef : la région de l'équipe.
const HOME_BY_TEAM = { MTL: "quebec", OTT: "ontario", TOR: "ontario", WPG: "west", CGY: "west", EDM: "west", VAN: "west", SEA: "west" };
export const teamHomeRegion = (teamId) => HOME_BY_TEAM[teamId] || "usa";

// Dépisteurs de l'organisation : les deux dépisteurs en chef (personnel, ou personnel interne
// si le poste est vacant) et les dépisteurs engagés en plus.
export function scoutRoster(staff, extra = [], teamId) {
  const home = teamHomeRegion(teamId);
  const head = (key, specialty, label) => {
    const s = staff?.[key];
    // L'identifiant est celui du poste : la mission reste en place si le titulaire change.
    return s ? { id: key, name: s.name, rating: s.rating, salary: s.salary, specialty, home, head: label } : { id: key, name: "Personnel interne", rating: INTERNAL_SCOUT_RATING, salary: 0, specialty, home, head: label, internal: true };
  };
  return [head("scoutAmateur", "junior", "Dépisteur amateur en chef"), head("scoutPro", "pro", "Dépisteur professionnel en chef"), ...extra];
}
export const DEFAULT_MISSIONS = {
  scoutAmateur: { region: "quebec", league: null, focus: "general", focusValue: null, target: "draft", weeks: null, weeksDone: 0 },
  scoutPro: { region: "pro", league: null, focus: "general", focusValue: null, target: "all", weeks: null, weeksDone: 0 },
};
export const DEFAULT_COVERAGE = Object.fromEntries(SCOUT_REGIONS.map((r) => [r.id, r.id === "pro" ? 40 : r.id === "quebec" || r.id === "ontario" ? 20 : 10]));

// Distance port d'attache → zone : même zone, même continent, outre-mer.
export function distanceFactor(home, region) {
  if (home === region) return 1;
  return NORTH_AMERICA.includes(home) === NORTH_AMERICA.includes(region) ? 1.5 : 2.5;
}
export function distanceLabel(home, region) {
  const f = distanceFactor(home, region);
  return f === 1 ? "sur place" : f === 1.5 ? "même continent" : "outre-mer";
}
// Frais hebdomadaires ($) : 12 000 $ de base × étendue (une ligue 0,6 ; toute la zone 1) ×
// distance × niveau du dépisteur (un bon dépisteur voyage et voit plus de matchs).
export function missionWeeklyCost(scout, mission) {
  if (!mission?.region) return 0;
  const extent = mission.league ? 0.6 : 1;
  return Math.round(12000 * extent * distanceFactor(scout.home, mission.region) * (0.8 + scout.rating / 250) / 100) * 100;
}
export function missionTotalCost(scout, mission) {
  return mission.weeks ? missionWeeklyCost(scout, mission) * mission.weeks : null;
}

// Hors de sa spécialité (junior / pro), un dépisteur perd 15 %.
export function effectiveScout(scout, region) {
  const off = (scout.specialty === "pro") !== (region === "pro");
  return { ...scout, rating: off ? Math.round(scout.rating * 0.85) : scout.rating, offSpecialty: off };
}
export function coverageGain(rating, mission) { return (3 + rating / 10) * (mission?.league ? 1.3 : 1); }
export function reportsPerWeek(rating) { return 1 + (rating >= 60 ? 1 : 0) + (rating >= 80 ? 1 : 0); }

export function focusLabel(mission) {
  if (!mission || mission.focus === "general") return "Recherche générale";
  if (mission.focus === "pos") return `Par position : ${POSITION_FOCUS.find((x) => x.id === mission.focusValue)?.label || "—"}`;
  return `Par rôle : ${ROLES[mission.focusValue]?.label || "—"}`;
}
export function missionSummary(mission) {
  if (!mission?.region) return "En réserve";
  const where = mission.league ? `${MINOR_LEAGUES[mission.league]?.short || "LNH"} (${regionLabel(mission.region)})` : regionLabel(mission.region);
  return `${where} · ${focusLabel(mission)} · ${mission.target === "draft" ? "cuvée du repêchage" : mission.target === "fa" ? "agents libres seulement" : "tous les joueurs"}`;
}

// Joueurs visés par la mission parmi les candidats de la zone.
export function missionFilter(mission) {
  return (p) => {
    if (mission.league && (p.league || (p.level === "LAH" ? "AHL" : "NHL")) !== mission.league) return false;
    if (mission.focus === "pos") return matchesPosition(p, mission.focusValue);
    if (mission.focus === "role") return p.pos !== "G" ? roleGroupOf(p) === ROLES[mission.focusValue]?.group : ROLES[mission.focusValue]?.group === "G";
    return true;
  };
}

// Note d'un rapport. Espoirs : selon le potentiel estimé. Professionnels : comparés à la
// moyenne de ton équipe. Une recherche par rôle exige aussi le bon profil.
export function gradeReport(player, report, benchmark, mission = null) {
  let g;
  if (player.draftProspect || player.age <= 20) { const p = report.estPotential; g = p >= 70 ? "A" : p >= 65 ? "B" : p >= 60 ? "C" : "D"; }
  else { const d = report.estOvr - benchmark; g = d >= 6 ? "A" : d >= 2 ? "B" : d >= -2 ? "C" : "D"; }
  if (mission?.focus === "role" && player.pos !== "G") {
    const fit = roleFit({ ...player, attrs: report.attrs }, mission.focusValue);
    if (fit < 0) g = g === "A" ? "B" : g === "B" ? "C" : "D";
  }
  return g;
}
function gradeNote(grade, player, report, mission) {
  const young = player.draftProspect || player.age <= 20;
  const r20 = (v) => attr20(v);
  let role = "";
  if (mission?.focus === "role" && player.pos !== "G") {
    const f = roleFit({ ...player, attrs: report.attrs }, mission.focusValue);
    role = ` Profil de ${ROLES[mission.focusValue].label.toLowerCase()} : ${f >= 0.5 ? "idéal" : f >= 0.15 ? "bon" : f > -0.15 ? "passable" : "à contre-emploi"}.`;
  }
  const lvl = young ? `habileté ${r20(report.estOvr)}/20, potentiel estimé ${r20(report.estPotential)}/20` : `niveau estimé ${r20(report.estOvr)}/20`;
  return `${GRADES[grade].label} : ${lvl}.${role} ${report.text}`;
}

// Une semaine de dépistage pour toutes les missions actives.
//  missions : [{ scout, mission }] ; candidatesOf(regionId, mission) → [{ player, ownerTeamId }].
// Renvoie la couverture, les rapports, les frais de la semaine et les missions terminées.
export function weeklyScouting({ missions, coverage, candidatesOf, lastReportDay, day, rng, benchmark }) {
  const next = { ...coverage };
  const active = missions.filter((m) => m.mission?.region);
  const regions = new Set(active.map((m) => m.mission.region));
  SCOUT_REGIONS.forEach((r) => { if (!regions.has(r.id)) next[r.id] = Math.max(0, (next[r.id] ?? 0) - 1); });
  const reports = [], finished = [];
  const taken = new Set();
  let cost = 0;
  active.forEach(({ scout: base, mission }) => {
    const scout = effectiveScout(base, mission.region);
    cost += missionWeeklyCost(base, mission);
    next[mission.region] = Math.min(100, (next[mission.region] ?? 0) + coverageGain(scout.rating, mission));
    const cov = next[mission.region] / 100;
    const keep = missionFilter(mission);
    const pool = candidatesOf(mission.region, mission).filter(({ player }) => keep(player) && !taken.has(player.id) && (lastReportDay(player.id) == null || day - lastReportDay(player.id) > 120));
    for (let n = 0; n < reportsPerWeek(scout.rating) && pool.length; n++) {
      // Les meilleurs joueurs ressortent d'autant plus que la zone est couverte ; une recherche
      // par rôle favorise les joueurs qui en ont le profil.
      const weights = pool.map(({ player }) => {
        const w = Math.exp((overallEstimate(player.age, player.ovr, player.potential) - 55) / (9 - cov * 5));
        return mission.focus === "role" && player.pos !== "G" ? w * Math.exp(roleFit(player, mission.focusValue) * 1.5) : w;
      });
      const total = weights.reduce((a, b) => a + b, 0);
      let x = rng() * total, i = 0;
      while (i < pool.length - 1 && (x -= weights[i]) > 0) i++;
      const { player, ownerTeamId } = pool.splice(i, 1)[0];
      taken.add(player.id);
      const report = createScoutReport(player, scout, day);
      const grade = gradeReport(player, report, benchmark, mission);
      reports.push({ player, ownerTeamId, report, grade, note: gradeNote(grade, player, report, mission), regionId: mission.region, scoutId: base.id, scoutName: base.name, day });
    }
    if (mission.weeks && mission.weeksDone + 1 >= mission.weeks) finished.push(base.id);
  });
  return { coverage: next, reports, cost, finished };
}

// Marché des dépisteurs : cote, spécialité (junior ou pro), port d'attache, âge, nationalité et
// salaire (k$/an). Bassin volontairement large (façon FM/EHM) pour renouveler les visages.
export function buildScoutMarket(rng, count = 14) {
  const homes = SCOUT_REGIONS.map((r) => r.id);
  return Array.from({ length: count }, (_, i) => {
    const rating = Math.round(35 + rng() * 60);
    const specialty = rng() < 0.7 ? "junior" : "pro";
    const home = specialty === "pro" && rng() < 0.6 ? "pro" : homes[Math.floor(rng() * (homes.length - 1))];
    const fn = FIRST_NAMES[Math.floor(rng() * FIRST_NAMES.length)], ln = LAST_NAMES[Math.floor(rng() * LAST_NAMES.length)];
    const age = 30 + Math.floor(rng() * 40);
    return { id: `SCOUT-${Math.floor(rng() * 1e9)}-${i}`, name: `${fn} ${ln}`, rating, specialty, home, age, nationality: pickNationality(rng), salary: Math.round(180 * Math.pow(rating / 60, 1.7) / 10) * 10 };
  });
}

export const regionLabel = (id) => SCOUT_REGIONS.find((r) => r.id === id)?.label || "—";
export { regionOfLeague };
