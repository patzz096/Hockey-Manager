import { REAL_ROSTERS } from "../data/rosters";
import { TEAM_SEED } from "../data/teams";
import { buildLines } from "./lines";
import { buildRealRoster, buildRoster, buildFreeAgentPool, buildFarmRoster, assignDraftInfo } from "./players";
import { seededRandom } from "./random";
import { buildStaffMarket } from "./staff";
import { capFor, payroll } from "./cap";
import { CURRENT_YEAR, minSalaryFor } from "./contracts";
import { ROUND_SPACING } from "./calendar";

// Les contrats générés (joueurs sans vrai contrat) sont réduits au besoin pour que chaque équipe
// commence à 96 % du plafond au plus.
function fitUnderCap(roster) {
  const over = payroll(roster) - capFor(CURRENT_YEAR) * 0.96;
  const gen = roster.filter((p) => p.contract?.generated);
  const genTotal = gen.reduce((a, p) => a + p.contract.salary, 0);
  if (over <= 0 || !genTotal) return roster;
  const k = Math.max(0.3, 1 - over / genTotal);
  return roster.map((p) => (p.contract?.generated ? { ...p, contract: { ...p.contract, salary: Math.max(minSalaryFor(CURRENT_YEAR), Math.round((p.contract.salary * k) / 25) * 25) } } : p));
}

// custom : base de données personnalisée ({ teams: { ID: [joueurs] }, teamInfo: { ID: {...} } }).
// Ses alignements remplacent ceux par défaut ; teamInfo renomme ou recolore les équipes.
export function initLeague(custom = null) {
  const rng = seededRandom(42);
  const teams = TEAM_SEED.map((seed, idx) => {
    const t = { ...seed, ...(custom?.teamInfo?.[seed.id] || {}), id: seed.id };
    const realData = custom?.teams?.[t.id]?.length ? custom.teams[t.id] : REAL_ROSTERS[t.id];
    const roster = fitUnderCap(realData ? buildRealRoster(realData, idx, rng) : buildRoster(idx, rng));
    return { ...t, roster, lines: buildLines(roster) };
  });
  const farmByTeam = {};
  teams.forEach((t, idx) => { farmByTeam[t.id] = buildFarmRoster(idx, rng, 10); });
  const freeAgents = buildFreeAgentPool(rng, 16);
  const allPlayers = [...teams.flatMap((t) => t.roster), ...Object.values(farmByTeam).flat(), ...freeAgents];
  assignDraftInfo(allPlayers, rng);
  const staffMarket = buildStaffMarket(rng, 12);
  return { teams, freeAgents, staffMarket, farmByTeam };
}

// Chaque ronde du calendrier (toutes les équipes s'affrontent une fois) est étalée sur
// ROUND_SPACING jours consécutifs plutôt que jouée le même soir par tout le monde à la fois
// (`slot`, voir engine/calendar.js `gameDay`) : plus proche d'un calendrier LNH réel, où toutes
// les équipes ne jouent jamais toutes en même temps.
export function buildSchedule(teams) {
  const ids = teams.map((t) => t.id);
  const games = [];
  let round = 0;
  for (let leg = 0; leg < 2; leg++) {
    const arr = [...ids];
    const n = arr.length;
    for (let r = 0; r < n - 1; r++) {
      round++;
      for (let i = 0; i < n / 2; i++) {
        const home = arr[i], away = arr[n - 1 - i];
        const [h, a] = leg === 0 ? [home, away] : [away, home];
        const slot = i % ROUND_SPACING;
        games.push({ id: `${round}-${i}`, round, slot, home: h, away: a, played: false, homeScore: null, awayScore: null, box: null });
      }
      arr.splice(1, 0, arr.pop());
    }
  }
  return games;
}

// Classement : voir standings.js (modèle de points de la LNH).
export { computeStandings } from "./standings";
