import { describe, it, expect } from "vitest";
import { initLeague, buildSchedule, computeStandings } from "../src/engine/league";
import { simulateGame, simulateChunk, emptyLiveAccum, mergeLivePeriod, TOTAL_CHUNKS } from "../src/engine/simulation";
import { seededRandom } from "../src/engine/random";

function simulateSeason(seed) {
  const league = initLeague();
  const teamsById = Object.fromEntries(league.teams.map((t) => [t.id, t]));
  const linesByTeam = Object.fromEntries(league.teams.map((t) => [t.id, t.lines]));
  const rng = seededRandom(seed);
  const games = buildSchedule(league.teams).map((g) => simulateGame(g, teamsById, rng, linesByTeam));
  return { league, teamsById, linesByTeam, games };
}

describe("moteur", () => {
  it("construit 32 équipes et un calendrier aller-retour complet", () => {
    const { league, games } = simulateSeason(1000);
    expect(league.teams).toHaveLength(32);
    expect(games).toHaveLength(32 * 31);
    expect(games.every((g) => g.played && g.homeScore !== g.awayScore)).toBe(true);
  });

  it("est déterministe pour une même graine", () => {
    const a = simulateSeason(1000).games.map((g) => [g.homeScore, g.awayScore]);
    const b = simulateSeason(1000).games.map((g) => [g.homeScore, g.awayScore]);
    expect(a).toEqual(b);
  }, 20000);

  it("produit un classement cohérent", () => {
    const { league, games } = simulateSeason(1000);
    const standings = computeStandings(league.teams, games);
    expect(standings.reduce((a, s) => a + s.w, 0)).toBe(games.length);
    standings.forEach((s) => expect(s.gp).toBe(62));
  });

  it("simule un match en direct par tranches", () => {
    const { teamsById, linesByTeam } = simulateSeason(1000);
    const rng = seededRandom(7);
    let accum = emptyLiveAccum();
    for (let c = 1; c <= TOTAL_CHUNKS; c++) {
      accum = mergeLivePeriod(accum, simulateChunk(teamsById.MTL, teamsById.TOR, linesByTeam.MTL, linesByTeam.TOR, {}, c, rng));
    }
    expect(accum.home.shots).toBeGreaterThan(0);
    expect(accum.goalLog.every((g) => g.period >= 1 && g.period <= 3)).toBe(true);
  });
});
