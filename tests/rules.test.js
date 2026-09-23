import { describe, it, expect } from "vitest";
import { initLeague, buildSchedule } from "../src/engine/league";
import { simulateGame } from "../src/engine/simulation";
import { seededRandom } from "../src/engine/random";
import { capFor, floorFor, capStatus, fitsUnderCap, ROSTER_MAX } from "../src/engine/cap";
import { runDraftLottery, LOTTERY_ODDS } from "../src/engine/playoffs";
import { waiverExempt, placeOnWaivers, resolveWaivers, aiWaiverCandidates } from "../src/engine/waivers";
import { aggregateStats } from "../src/engine/stats";
import { aiFreeAgency } from "../src/engine/offseason";

const lg = initLeague();
const byId = Object.fromEntries(lg.teams.map((t) => [t.id, t]));

describe("plafond salarial", () => {
  it("suit les plafonds annoncés puis +5 %", () => {
    expect(capFor(2026)).toBe(104000);
    expect(capFor(2027)).toBe(113500);
    expect(capFor(2028)).toBeGreaterThan(capFor(2027));
    expect(floorFor(2026)).toBeLessThan(capFor(2026));
  });
  it("bloque une dépense qui ferait dépasser le plafond, permet de réduire", () => {
    const roster = [{ contract: { salary: 100000 } }];
    expect(fitsUnderCap(roster, 2026, 3000)).toBe(true);
    expect(fitsUnderCap(roster, 2026, 5000)).toBe(false);
    const over = [{ contract: { salary: 110000 } }];
    expect(fitsUnderCap(over, 2026, 1000, 5000)).toBe(true); // réduit la masse
    expect(capStatus(over, 2026).overCap).toBe(true);
    lg.teams.forEach((t) => expect(capStatus(t.roster, 2026).overCap).toBe(false));
  });
  it("l'ordinateur ne signe pas au-delà du plafond", () => {
    const full = { ...lg.teams[0], roster: lg.teams[0].roster.filter((p) => p.pos !== "G").map((p) => ({ ...p, contract: { years: 2, salary: 5500 } })) };
    const star = { ...lg.teams[1].roster.find((p) => p.pos === "G"), id: "FA-G", contract: null, ovr: 90, potential: 90 };
    const res = aiFreeAgency([full], [star], "XXX", 2026);
    expect(capStatus(res.teams[0].roster, 2026).used).toBeLessThanOrEqual(capFor(2026) + 0);
  });
});

describe("loterie du repêchage", () => {
  const order = lg.teams.map((t) => t.id);
  it("respecte les chances et la montée maximale de 10 rangs", () => {
    const wins = {};
    for (let i = 0; i < 4000; i++) {
      const r = runDraftLottery(order, 16, seededRandom(i + 1));
      expect(new Set(r.order).size).toBe(32);
      expect(r.order.slice(16)).toEqual(order.slice(16)); // les équipes des séries ne bougent pas
      r.order.slice(0, 16).forEach((id, pos) => expect(order.indexOf(id) - pos).toBeLessThanOrEqual(10));
      wins[r.order[0]] = (wins[r.order[0]] || 0) + 1;
    }
    const worst = wins[order[0]] / 4000;
    expect(worst).toBeGreaterThan(0.15); expect(worst).toBeLessThan(0.30); // 18,5 % + redistributions
    expect((wins[order[15]] || 0) / 4000).toBeLessThan(0.02);
    expect(LOTTERY_ODDS.reduce((a, b) => a + b, 0)).toBeCloseTo(100, 5);
  });
});

describe("ballottage", () => {
  it("exempte les jeunes, attribue au pire classement qui réclame", () => {
    expect(waiverExempt({ age: 20 }, 50)).toBe(true);
    expect(waiverExempt({ age: 26 }, 300)).toBe(false);
    expect(waiverExempt({ age: 21 }, 200)).toBe(false);
    const star = { ...byId.MTL.roster[0], id: "W1", age: 27 };
    const w = placeOnWaivers(star, "MTL", 10);
    const teams = lg.teams.map((t) => ({ ...t, roster: t.roster.slice(0, 18) }));
    const priority = teams.map((t) => t.id).reverse();
    const early = resolveWaivers([w], 10, teams, priority, "TOR", new Set(), 2026);
    expect(early.results).toHaveLength(0);
    const res = resolveWaivers([w], 11, teams, priority, "TOR", new Set(), 2026);
    // La première équipe prioritaire qui a de l'espace sous le plafond réclame le joueur.
    const byTeam = Object.fromEntries(teams.map((t) => [t.id, t]));
    expect(res.results[0].claimedBy).toBe(priority.find((id) => id !== "MTL" && id !== "TOR" && fitsUnderCap(byTeam[id].roster, 2026, star.contract.salary)));
    const mine = resolveWaivers([w], 11, teams, ["TOR", ...priority], "TOR", new Set(["W1"]), 2026);
    expect(mine.results[0].claimedBy).toBe("TOR");
  });
  it("l'ordinateur place ses joueurs en trop (au-delà de 23)", () => {
    const big = { ...lg.teams[5], roster: [...lg.teams[5].roster, ...lg.teams[6].roster].map((p) => ({ ...p, age: 28 })) };
    expect(aiWaiverCandidates(big, 1)).toHaveLength(big.roster.length - ROSTER_MAX);
  });
});

describe("statistiques des séries", () => {
  it("cumule buts, passes et buts gagnants à partir des feuilles de match", () => {
    const lines = Object.fromEntries(lg.teams.map((t) => [t.id, t.lines]));
    const rng = seededRandom(3);
    const games = buildSchedule(lg.teams).slice(0, 40).map((g) => simulateGame({ ...g, playoff: true }, byId, rng, lines, {}, { playoff: true }));
    const everyone = {};
    lg.teams.forEach((t) => t.roster.forEach((p) => { everyone[p.id] = { player: p, team: t }; }));
    const st = aggregateStats(games, byId, everyone);
    const goals = Object.values(st).reduce((a, s) => a + s.g, 0);
    expect(goals).toBe(games.reduce((a, g) => a + g.homeScore + g.awayScore, 0));
    expect(Object.values(st).reduce((a, s) => a + s.gwg, 0)).toBe(games.length);
  });
});

describe("mouvements mensuels de l'ordinateur", () => {
  it("place des joueurs au ballottage et rappelle des espoirs", async () => {
    const { aiMonthlyMoves } = await import("../src/engine/waivers");
    const res = aiMonthlyMoves(lg.teams, lg.farmByTeam, "MTL", 30, seededRandom(1), 1);
    expect(res.placed.length).toBeGreaterThan(20);
    expect(res.placed.every((w) => w.fromTeamId !== "MTL")).toBe(true);
    res.teams.forEach((t, i) => expect(t.roster.length).toBeLessThanOrEqual(lg.teams[i].roster.length));
  });
});

describe("rachats, rétention, cap mort", async () => {
  const { buyoutTerms, retentionEntry, deadCapFor, capStatus: cs, fitsUnderCap: fits } = await import("../src/engine/cap");
  it("rachète à 2/3 (1/3 avant 26 ans) sur le double des années restantes", () => {
    const vet = { name: "V", age: 30, contract: { years: 4, salary: 6000 } };
    const t = buyoutTerms(vet, 2026);
    expect(t.seasons).toEqual([2027, 2028, 2029, 2030, 2031, 2032]); // 3 années restantes × 2
    expect(t.perYear).toBe(2000); // 6000 × 2/3 / 2
    expect(buyoutTerms({ ...vet, age: 24 }, 2026).perYear).toBe(1000);
    expect(buyoutTerms({ ...vet, contract: { years: 1, salary: 6000 } }, 2026)).toBeNull();
  });
  it("compte le cap mort et l'allègement LTIR", () => {
    const e = retentionEntry({ name: "R", contract: { years: 2, salary: 8000 } }, 0.5, 2026);
    expect(e).toMatchObject({ amount: 4000, seasons: [2026, 2027] });
    expect(deadCapFor([e], 2027)).toBe(4000);
    expect(deadCapFor([e], 2028)).toBe(0);
    const roster = [{ id: "a", contract: { salary: 100000 } }, { id: "b", contract: { salary: 6000 } }];
    expect(cs(roster, 2026).overCap).toBe(true);
    const withLtir = cs(roster, 2026, { relief: 6000, ltirIds: ["b"] });
    expect(withLtir.overCap).toBe(false);
    expect(withLtir.rosterSize).toBe(1);
    expect(fits([{ contract: { salary: 100000 } }], 2026, 3000, 0, { dead: 2000 })).toBe(false);
  });
});

describe("blessures et LTIR", async () => {
  const { injuriesFromGame, dressTeam, ltirEligible, injuryDuration } = await import("../src/engine/injuries");
  it("blesse environ un joueur par 6 matchs par équipe, surtout brièvement", () => {
    const lines = Object.fromEntries(lg.teams.map((t) => [t.id, t.lines]));
    const r = seededRandom(12);
    const games = buildSchedule(lg.teams).slice(0, 400).map((g) => simulateGame(g, byId, r, lines));
    let n = 0; const ir = seededRandom(4);
    games.forEach((g) => { n += Object.keys(injuriesFromGame(g, byId, 10, ir)).length; });
    expect(n / (games.length * 2)).toBeGreaterThan(0.1); expect(n / (games.length * 2)).toBeLessThan(0.22);
    const d = Array.from({ length: 2000 }, () => injuryDuration(ir));
    expect(d.filter((x) => x <= 6).length / 2000).toBeGreaterThan(0.45);
    expect(d.filter((x) => x >= 24).length / 2000).toBeGreaterThan(0.08);
  });
  it("retire les blessés et complète les trios", () => {
    const t = byId.MTL, star = t.lines.forwards[0].C;
    const { team, lines } = dressTeam(t, t.lines, { [star]: { until: 50 } }, 10);
    expect(team.roster.some((p) => p.id === star)).toBe(false);
    expect(lines.forwards[0].C).toBeTruthy();
    expect(lines.forwards[0].C).not.toBe(star);
    const ids = [...lines.forwards.flatMap((l) => [l.LW, l.C, l.RW]), ...lines.defense.flatMap((l) => [l.LD, l.RD])].filter(Boolean);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ltirEligible({ until: 40 }, 10)).toBe(true);
    expect(ltirEligible({ until: 20 }, 10)).toBe(false);
  });
});

describe("exemption du ballottage (table LNH) et loterie 2 en 5 ans", async () => {
  const { waiverExemption } = await import("../src/engine/waivers");
  const { lotteryIneligible, runDraftLottery: lottery } = await import("../src/engine/playoffs");
  it("applique la table selon l'âge à la signature", () => {
    expect(waiverExemption({ pos: "C", age: 20, signedAge: 18, signedYear: 2025 }, 50, 2026).exempt).toBe(true);
    expect(waiverExemption({ pos: "C", age: 21, signedAge: 18, signedYear: 2024 }, 170, 2026).exempt).toBe(false); // 160 matchs
    expect(waiverExemption({ pos: "C", age: 22, signedAge: 18, signedYear: 2023 }, 20, 2026).exempt).toBe(false); // 4e saison
    expect(waiverExemption({ pos: "C", age: 22, signedAge: 22, signedYear: 2026 }, 69, 2026).exempt).toBe(true);
    expect(waiverExemption({ pos: "C", age: 22, signedAge: 22, signedYear: 2026 }, 70, 2026).exempt).toBe(false);
    expect(waiverExemption({ pos: "C", age: 27, signedAge: 27, signedYear: 2026 }, 0, 2026).exempt).toBe(false);
    expect(waiverExemption({ pos: "G", age: 22, signedAge: 19, signedYear: 2023 }, 10, 2026).exempt).toBe(true); // gardien : 4 saisons
  });
  it("exclut une équipe qui a gagné 2 loteries en 5 ans", () => {
    const history = [{ year: 2023, winners: ["AAA"] }, { year: 2025, winners: ["AAA", "BBB"] }];
    expect([...lotteryIneligible(history, 2026)]).toEqual(["AAA"]);
    expect(lotteryIneligible(history, 2029).size).toBe(0); // 2023 hors de la fenêtre
    const order = ["AAA", ...lg.teams.map((t) => t.id).slice(1)];
    for (let i = 0; i < 300; i++) {
      const r = lottery(order, 16, seededRandom(i + 1), new Set(["AAA"]));
      expect(r.winners).not.toContain("AAA");
    }
  });
});
