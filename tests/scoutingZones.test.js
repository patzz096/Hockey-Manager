import { describe, it, expect } from "vitest";
import { upcomingDraftClass, createDraft, DRAFT_CLASS_SIZE } from "../src/engine/draft";
import { MINOR_LEAGUES, SCOUT_REGIONS, minorSeasonStats, promoteFromJunior, leagueOf } from "../src/engine/minorLeagues";
import { weeklyScouting, DEFAULT_COVERAGE, gradeReport, missionWeeklyCost, scoutRoster, buildScoutMarket } from "../src/engine/scoutingZones";
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

describe("équipe de dépistage et missions", () => {
  const scout = { id: "s1", name: "Amateur", rating: 80, specialty: "junior", home: "quebec" };
  const mission = (patch = {}) => ({ region: "quebec", league: null, focus: "general", focusValue: null, target: "draft", weeks: 4, weeksDone: 0, ...patch });
  const candidatesOf = (r) => cls.filter((p) => SCOUT_REGIONS.find((x) => x.id === r).leagues.includes(p.league)).map((player) => ({ player, ownerTeamId: null }));
  const week = (missions, extra = {}) => weeklyScouting({ missions, coverage: DEFAULT_COVERAGE, candidatesOf, lastReportDay: () => null, day: 20, rng: seededRandom(5), benchmark: 65, ...extra });

  it("augmente la couverture de la zone en mission et rédige des rapports dans cette zone", () => {
    const res = week([{ scout, mission: mission() }]);
    expect(res.coverage.quebec).toBeGreaterThan(DEFAULT_COVERAGE.quebec);
    expect(res.coverage.sweden).toBeLessThan(DEFAULT_COVERAGE.sweden);
    expect(res.reports.length).toBe(3);
    res.reports.forEach((r) => expect(r.player.league).toBe("QMJHL"));
    expect(res.cost).toBe(missionWeeklyCost(scout, mission()));
  });

  it("fait payer plus cher une mission lointaine et moins cher une seule ligue", () => {
    const here = missionWeeklyCost(scout, mission());
    expect(missionWeeklyCost(scout, mission({ region: "ontario" }))).toBeGreaterThan(here);
    expect(missionWeeklyCost(scout, mission({ region: "sweden" }))).toBeGreaterThan(missionWeeklyCost(scout, mission({ region: "ontario" })));
    expect(missionWeeklyCost(scout, mission({ region: "sweden", league: "J20" }))).toBeLessThan(missionWeeklyCost(scout, mission({ region: "sweden" })));
    expect(missionWeeklyCost(scout, { region: null })).toBe(0);
  });

  it("respecte la recherche par position et par rôle", () => {
    const d = week([{ scout, mission: mission({ region: "ontario", focus: "pos", focusValue: "D" }) }]);
    d.reports.forEach((r) => expect(["LD", "RD"]).toContain(r.player.pos));
    const role = week([{ scout, mission: mission({ region: "ontario", focus: "role", focusValue: "sniper" }) }]);
    role.reports.forEach((r) => { expect(["C", "LW", "RW"]).toContain(r.player.pos); expect(r.note).toMatch(/Profil de franc-tireur/); });
    const lg = week([{ scout, mission: mission({ region: "usa", league: "USHL" }) }]);
    lg.reports.forEach((r) => expect(r.player.league).toBe("USHL"));
  });

  it("termine une mission à la fin de sa durée", () => {
    expect(week([{ scout, mission: mission({ weeks: 2, weeksDone: 1 }) }]).finished).toEqual(["s1"]);
    expect(week([{ scout, mission: mission({ weeks: null, weeksDone: 30 }) }]).finished).toEqual([]);
  });

  it("repère surtout les meilleurs espoirs quand la zone est bien couverte", () => {
    const pool = candidatesOf("ontario");
    const mean = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;
    const found = [];
    for (let w = 0; w < 30; w++) found.push(...week([{ scout, mission: mission({ region: "ontario" }) }], { coverage: { ...DEFAULT_COVERAGE, ontario: 100 }, day: w * 7, rng: seededRandom(w + 1) }).reports.map((x) => x.player.potential));
    expect(mean(found)).toBeGreaterThan(mean(pool.map((x) => x.player.potential)) + 2);
  });

  it("donne aux dépisteurs en chef un identifiant de poste stable", () => {
    const r = scoutRoster({ scoutAmateur: { id: "X", name: "A", rating: 70, salary: 500 } }, [scout], "MTL");
    expect(r.map((x) => x.id)).toEqual(["scoutAmateur", "scoutPro", "s1"]);
    expect(r[0].home).toBe("quebec");
    expect(buildScoutMarket(seededRandom(3), 4)).toHaveLength(4);
  });

  it("note les espoirs selon le potentiel estimé", () => {
    const p = cls[0];
    expect(gradeReport(p, { estPotential: 72, estOvr: 50 }, 65)).toBe("A");
    expect(gradeReport(p, { estPotential: 55, estOvr: 50 }, 65)).toBe("D");
  });
});
