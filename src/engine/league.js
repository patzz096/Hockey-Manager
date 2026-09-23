import { REAL_ROSTERS } from "../data/rosters";
import { TEAM_SEED } from "../data/teams";
import { buildLines } from "./lines";
import { buildRealRoster, buildRoster, buildFreeAgentPool, buildFarmRoster, assignDraftInfo } from "./players";
import { seededRandom } from "./random";
import { buildStaffMarket } from "./staff";

export function initLeague() {
  const rng = seededRandom(42);
  const teams = TEAM_SEED.map((t, idx) => {
    const realData = REAL_ROSTERS[t.id];
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

export function computeStandings(teams, games) {
  const table = {};
  teams.forEach((t) => (table[t.id] = { id: t.id, w: 0, l: 0, gf: 0, ga: 0, pts: 0, gp: 0 }));
  games.filter((g) => g.played).forEach((g) => {
    const h = table[g.home], a = table[g.away];
    h.gp++; a.gp++; h.gf += g.homeScore; h.ga += g.awayScore; a.gf += g.awayScore; a.ga += g.homeScore;
    if (g.homeScore > g.awayScore) { h.w++; h.pts += 2; a.l++; } else { a.w++; a.pts += 2; h.l++; }
  });
  return Object.values(table).sort((x, y) => y.pts - x.pts || (y.gf - y.ga) - (x.gf - x.ga));
}
