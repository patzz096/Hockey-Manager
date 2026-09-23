import { describe, it, expect } from "vitest";
import { upcomingDraftClass, createDraft, DRAFT_CLASS_SIZE } from "../src/engine/draft";
import { MINOR_LEAGUES, SCOUT_REGIONS, minorSeasonStats, promoteFromJunior, leagueOf } from "../src/engine/minorLeagues";
import { weeklyScouting, DEFAULT_COVERAGE, gradeReport } from "../src/engine/scoutingZones";
import { seededRandom } from "../src/engine/random";

const cls = upcomingDraftClass(2026);

describe("ligues mineures (simulation rapide)", () => {
  it("place chaque espoir de la cuvée dans une ligue et un club, toujours les mêmes", () => {
    expect(cls).toHaveLength(DRAFT_CLASS_SIZE);
    cls.forEach((p) => { expect(MINOR_LEAGUES[p.league]).toBeTruthy(); expect(p.club).toBeTruthy(); });
    // Le bassin du repêchage est la même cuvée (mêmes identifiants, mêmes ligues).
    const d = createDraft(2026, Array.from({ length: 32 }, (_, i) => `T${i}`));
    expect(d.pool.map((p) => p.id)).toEqual(cls.map((p) => p.id));
  });

  it("produit des statistiques progressives et cohérentes", () => {
    const p = cls.find((x) => x.pos === "C");
    const half = minorSeasonStats(p, p.league, 2026, 0.5), full = minorSeasonStats(p, p.league, 2026, 1);
    expect(full.gp).toBeGreaterThanOrEqual(half.gp);
    expect(full.pts).toBe(full.g + full.a);
    expect(full.pts).toBeGreaterThanOrEqual(half.pts);
    expect(minorSeasonStats(p, p.league, 2026, 1)).toEqual(full);
  });

  it("fait produire davantage les meilleurs joueurs", () => {
    const base = cls.find((x) => x.pos === "C");
    const avgPts = (ovr) => { let t = 0; for (let i = 0; i < 40; i++) t += minorSeasonStats({ ...base, id: `x${i}`, ovr }, "OHL", 2026, 1).pts; return t / 40; };
    expect(avgPts(58)).toBeGreaterThan(avgPts(42) * 1.5);
  });

  it("envoie un espoir de 21 ans du junior à la LAH", () => {
    const p = { id: "a", age: 21, level: "LAH", league: "OHL", club: "Knights de London" };
    expect(leagueOf(promoteFromJunior(p)).league).toBe("AHL");
    expect(promoteFromJunior({ ...p, age: 19 }).league).toBe("OHL");
  });
});

describe("zones de dépistage", () => {
  const staff = { scoutAmateur: { id: "s1", name: "Amateur", rating: 80 }, scoutPro: null };
  const candidatesOf = (r) => cls.filter((p) => SCOUT_REGIONS.find((x) => x.id === r).leagues.includes(p.league)).map((player) => ({ player, ownerTeamId: null }));

  it("augmente la couverture de la zone déployée et rédige des rapports dans cette zone", () => {
    const res = weeklyScouting({ assignments: { scoutAmateur: "quebec", scoutPro: null }, coverage: DEFAULT_COVERAGE, staff, candidatesOf, lastReportDay: () => null, day: 20, rng: seededRandom(5), benchmark: 65 });
    expect(res.coverage.quebec).toBeGreaterThan(DEFAULT_COVERAGE.quebec);
    expect(res.coverage.sweden).toBeLessThan(DEFAULT_COVERAGE.sweden);
    expect(res.reports.length).toBe(3);
    res.reports.forEach((r) => expect(r.player.league).toBe("QMJHL"));
  });

  it("repère surtout les meilleurs espoirs quand la zone est bien couverte", () => {
    const pool = candidatesOf("ontario");
    const mean = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;
    const found = [];
    for (let w = 0; w < 30; w++) {
      const r = weeklyScouting({ assignments: { scoutAmateur: "ontario" }, coverage: { ...DEFAULT_COVERAGE, ontario: 100 }, staff, candidatesOf, lastReportDay: () => null, day: w * 7, rng: seededRandom(w + 1), benchmark: 65 });
      found.push(...r.reports.map((x) => x.player.potential));
    }
    expect(mean(found)).toBeGreaterThan(mean(pool.map((x) => x.player.potential)) + 2);
  });

  it("note les espoirs selon le potentiel estimé", () => {
    const p = cls[0];
    expect(gradeReport(p, { estPotential: 72, estOvr: 50 }, 65)).toBe("A");
    expect(gradeReport(p, { estPotential: 55, estOvr: 50 }, 65)).toBe("D");
  });
});
