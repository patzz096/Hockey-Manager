import { REAL_ROSTERS } from "../data/rosters";
import { TEAM_SEED } from "../data/teams";
import { buildLines } from "./lines";
import { buildRealRoster, buildRoster, buildFreeAgentPool, buildFarmRoster, assignDraftInfo } from "./players";
import { seededRandom } from "./random";
import { buildStaffMarket } from "./staff";

// custom : base de données personnalisée ({ teams: { ID: [joueurs] }, teamInfo: { ID: {...} } }).
// Ses alignements remplacent ceux par défaut ; teamInfo renomme ou recolore les équipes.
export function initLeague(custom = null) {
  const rng = seededRandom(42);
  const teams = TEAM_SEED.map((seed, idx) => {
    const t = { ...seed, ...(custom?.teamInfo?.[seed.id] || {}), id: seed.id };
    const realData = custom?.teams?.[t.id]?.length ? custom.teams[t.id] : REAL_ROSTERS[t.id];
    const roster = realData ? buildRealRoster(realData, idx, rng) : buildRoster(idx, rng);
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
        games.push({ id: `${round}-${i}`, round, home: h, away: a, played: false, homeScore: null, awayScore: null, box: null });
      }
      arr.splice(1, 0, arr.pop());
    }
  }
  return games;
}

// Classement : voir standings.js (modèle de points de la LNH).
export { computeStandings } from "./standings";
