// Calibrage statistique du moteur : 3 saisons simulées, comparées aux ordres de grandeur LNH.
// Le rapport s'affiche avec : npx vitest run tests/simulation-calibration.test.js --reporter=verbose
import { describe, it, expect } from "vitest";
import { initLeague, buildSchedule } from "../src/engine/league";
import { simulateGame, teamRatings } from "../src/engine/simulation";
import { seededRandom } from "../src/engine/random";
import { STRATEGY_PHASES, bestStrategy, computeStrategyFits, optionEffects, optionValue } from "../src/engine/strategy";

const lg = initLeague();
const byId = Object.fromEntries(lg.teams.map((t) => [t.id, t]));
const lines = Object.fromEntries(lg.teams.map((t) => [t.id, t.lines]));
const rng = seededRandom(2024);
const games = [];
for (let s = 0; s < 3; s++) buildSchedule(lg.teams).forEach((g) => games.push(simulateGame(g, byId, rng, lines)));
const n = games.length;
const mean = (f) => games.reduce((a, g) => a + f(g), 0) / n;
const sumGoals = (box) => Object.values(box.goalsBy).reduce((a, b) => a + b, 0);
function corr(x, y) {
  const mx = x.reduce((a, b) => a + b) / x.length, my = y.reduce((a, b) => a + b) / y.length;
  let c = 0, vx = 0, vy = 0;
  x.forEach((v, i) => { c += (v - mx) * (y[i] - my); vx += (v - mx) ** 2; vy += (y[i] - my) ** 2; });
  return c / Math.sqrt(vx * vy);
}

const goals = mean((g) => g.homeScore + g.awayScore) / 2;
const shots = mean((g) => g.box.home.shots + g.box.away.shots) / 2;
const corsi = mean((g) => g.box.home.corsiFor + g.box.away.corsiFor) / 2;
const svPct = mean((g) => g.box.homeGoalie.saves + g.box.awayGoalie.saves) / mean((g) => g.box.homeGoalie.shotsAgainst + g.box.awayGoalie.shotsAgainst);
const ppPct = games.reduce((a, g) => a + g.box.home.ppGoals + g.box.away.ppGoals, 0) / games.reduce((a, g) => a + g.box.home.penalties + g.box.away.penalties, 0);
const shPerTeam = mean((g) => (g.box.home.shGoals || 0) + (g.box.away.shGoals || 0)) / 2;
const homeWin = mean((g) => (g.homeScore > g.awayScore ? 1 : 0));
const shotGoalCorr = corr(games.map((g) => g.box.home.shots - g.box.away.shots), games.map((g) => g.homeScore - g.awayScore));
const blowouts = games.filter((g) => Math.abs(g.homeScore - g.awayScore) >= 5);
const blowoutShotEdge = blowouts.reduce((a, g) => a + (g.homeScore > g.awayScore ? 1 : -1) * (g.box.home.shots - g.box.away.shots), 0) / blowouts.length;

describe("calibrage de la simulation", () => {
  it("affiche le rapport", () => {
    console.log([
      `${n} matchs · buts/équipe ${goals.toFixed(2)} · tirs/équipe ${shots.toFixed(1)} · corsi/équipe ${corsi.toFixed(1)}`,
      `% arrêts ${svPct.toFixed(3)} · AN ${(ppPct * 100).toFixed(1)} % · buts en DN/équipe ${shPerTeam.toFixed(3)} · victoires à domicile ${(homeWin * 100).toFixed(1)} %`,
      `corrélation écart aux tirs / écart au score ${shotGoalCorr.toFixed(2)}`,
      `écarts de 5 buts et plus ${(blowouts.length / n * 100).toFixed(1)} % · avance du gagnant aux tirs ${blowoutShotEdge.toFixed(1)}`,
    ].join("\n"));
  });

  it("produit des moyennes réalistes (ordres de grandeur LNH)", () => {
    expect(goals).toBeGreaterThan(2.8); expect(goals).toBeLessThan(3.4);
    expect(shots).toBeGreaterThan(28); expect(shots).toBeLessThan(33);
    expect(corsi).toBeGreaterThan(50); expect(corsi).toBeLessThan(63);
    expect(svPct).toBeGreaterThan(0.893); expect(svPct).toBeLessThan(0.912);
    expect(ppPct).toBeGreaterThan(0.16); expect(ppPct).toBeLessThan(0.25);
    expect(shPerTeam).toBeGreaterThan(0.04); expect(shPerTeam).toBeLessThan(0.2);
    expect(homeWin).toBeGreaterThan(0.51); expect(homeWin).toBeLessThan(0.58);
  });

  it("lie le score aux tirs : un gros écart au score se voit aux tirs", () => {
    expect(shotGoalCorr).toBeGreaterThan(0.18);
    expect(blowouts.length / n).toBeLessThan(0.09);
    expect(blowoutShotEdge).toBeGreaterThan(3);
  });

  it("garde une feuille de match cohérente", () => {
    games.forEach((g) => {
      if (g.decidedIn !== "SO") {
        expect(sumGoals(g.box.home)).toBe(g.homeScore);
        expect(sumGoals(g.box.away)).toBe(g.awayScore);
      }
      ["home", "away"].forEach((s) => {
        Object.entries(g.box[s].goalsBy).forEach(([id, c]) => expect(c).toBeLessThanOrEqual(g.box[s].shotsBy[id] || 0));
        expect(Object.values(g.box[s].shotsBy).reduce((a, b) => a + b, 0)).toBe(g.box[s].shots);
        expect(g.box[s].corsiFor).toBeGreaterThanOrEqual(g.box[s].shots);
      });
      expect(g.box.homeGoalie.shotsAgainst).toBe(g.box.away.shots);
      expect(g.box.homeGoalie.shotsAgainst - g.box.homeGoalie.saves).toBe(g.awayScore - (g.decidedIn === "SO" && g.awayScore > g.homeScore ? 1 : 0));
    });
  });

  it("fait gagner plus souvent les équipes les plus fortes", () => {
    const power = (t) => { const r = teamRatings(t, lines[t.id]); return r.attack + r.defense + r.finish + r.goalieQ; };
    const ranked = [...lg.teams].sort((a, b) => power(b) - power(a));
    const winPct = (ids) => { let w = 0, gp = 0; games.forEach((g) => { [["home", g.home], ["away", g.away]].forEach(([s, id]) => { if (ids.includes(id)) { gp++; if ((s === "home") === (g.homeScore > g.awayScore)) w++; } }); }); return w / gp; };
    expect(winPct(ranked.slice(0, 8).map((t) => t.id))).toBeGreaterThan(winPct(ranked.slice(-8).map((t) => t.id)) + 0.05);
  });

  it("récompense une stratégie adaptée à l'effectif", () => {
    const team = byId.MTL;
    const fits = computeStrategyFits(team, lines.MTL);
    // Pire combinaison : la moins bonne option de chaque phase pour cet effectif.
    const worst = Object.fromEntries(STRATEGY_PHASES.map((ph) => [ph.key, [...ph.options].sort((a, b) => optionValue(optionEffects(ph.key, a.id, fits[ph.key][a.id])) - optionValue(optionEffects(ph.key, b.id, fits[ph.key][b.id])))[0].id]));
    const goalDiff = (strategy) => {
      const r = seededRandom(7), L = { ...lines, MTL: { ...lines.MTL, strategy } };
      let d = 0;
      for (let i = 0; i < 600; i++) { const g = simulateGame({ id: "t", home: i % 2 ? "MTL" : "BOS", away: i % 2 ? "BOS" : "MTL" }, byId, r, L); d += (g.home === "MTL" ? 1 : -1) * (g.homeScore - g.awayScore); }
      return d / 600;
    };
    expect(goalDiff(bestStrategy(team, lines.MTL))).toBeGreaterThan(goalDiff(worst));
  });

});
