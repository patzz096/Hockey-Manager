import { describe, it, expect } from "vitest";
import { initLeague } from "../src/engine/league";
import { marketValue, entryLevelContract, bonusRules, earnedBonuses, interestFactors, evaluateOffer, agentAsk, minSalaryFor, maxSalaryFor, homeRegionOf, lineupContext, capHit } from "../src/engine/contracts";
import { capStatus, payroll } from "../src/engine/cap";

const lg = initLeague();
const mtl = lg.teams.find((t) => t.id === "MTL");
const base = { id: "x", name: "Test Joueur", pos: "C", age: 27, ovr: 64, potential: 64, nationality: "CA", attrs: {} };
const ctxFor = (team, player, rank = 5, isRenewal = false) => ({ team, teamRank: rank, teamCount: 32, isRenewal, ...lineupContext(player, team.roster) });

describe("contrats LNH", () => {
  it("suit l'échelle salariale de la LNH (minimum, vedettes, maximum de 20 %)", () => {
    expect(marketValue({ ...base, ovr: 44, potential: 44 }, 2026)).toBeLessThan(minSalaryFor(2026) + 50);
    expect(marketValue({ ...base, ovr: 62 }, 2026)).toBeGreaterThan(2000);
    expect(marketValue({ ...base, ovr: 62 }, 2026)).toBeLessThan(3500);
    expect(marketValue({ ...base, ovr: 68 }, 2026)).toBeGreaterThan(8000);
    expect(marketValue({ ...base, ovr: 90 }, 2026)).toBe(maxSalaryFor(2026));
    expect(marketValue({ ...base, age: 35 }, 2026)).toBeLessThan(marketValue(base, 2026));
    lg.teams.forEach((t) => expect(capStatus(t.roster, 2026).overCap).toBe(false));
  });

  it("donne un contrat d'entrée selon le rang et l'âge", () => {
    const first = entryLevelContract(1, 18, 2027), late = entryLevelContract(150, 18, 2027), older = entryLevelContract(40, 22, 2027);
    expect(first).toMatchObject({ years: 3, elc: true, type: "two" });
    expect(first.salary).toBeGreaterThan(late.salary);
    expect(late.salary).toBe(minSalaryFor(2027));
    expect(first.bonuses.length).toBeGreaterThan(0);
    expect(late.bonuses).toHaveLength(0);
    expect(older.years).toBe(2);
  });

  it("réserve les primes de rendement aux recrues et aux 35 ans et plus (contrat d'un an)", () => {
    expect(bonusRules({ age: 36 }, { years: 1 }).allowed).toBe(true);
    expect(bonusRules({ age: 36 }, { years: 2 }).allowed).toBe(false);
    expect(bonusRules({ age: 28 }, { years: 1 }).allowed).toBe(false);
    const c = { salary: 800, bonuses: [{ kind: "pts", target: 40, amount: 300 }, { kind: "g", target: 30, amount: 200 }] };
    expect(earnedBonuses(c, { pts: 45, g: 12 })).toHaveLength(1);
    expect(capHit(c)).toBe(1300);
    expect(payroll([{ contract: c }])).toBe(1300);
  });

  it("compte les contrats à un volet enfouis dans la LAH", () => {
    expect(capStatus([], 2026, { buried: 1200 }).used).toBe(1200);
  });

  it("rend un joueur plus intéressé par une équipe proche de chez lui et gagnante", () => {
    let qc = null;
    for (let i = 0; i < 50 && !qc; i++) { const p = { ...base, id: `q${i}` }; if (homeRegionOf(p) === "quebec") qc = p; }
    const other = lg.teams.find((t) => t.id === "FLA");
    const iHome = interestFactors(qc, ctxFor(mtl, qc, 10)).interest;
    const iAway = interestFactors(qc, ctxFor(other, qc, 10)).interest;
    expect(iHome).toBeGreaterThan(iAway);
    expect(interestFactors(qc, ctxFor(mtl, qc, 0)).interest).toBeGreaterThan(interestFactors(qc, ctxFor(mtl, qc, 31)).interest);
    // Un joueur qui aime l'équipe demande moins.
    expect(agentAsk(qc, ctxFor(mtl, qc, 0), 2026).salary).toBeLessThan(agentAsk(qc, ctxFor(other, qc, 31), 2026).salary);
  });

  it("accepte plus volontiers une offre généreuse, refuse un deux volets s'il est de calibre LNH", () => {
    const ctx = ctxFor(mtl, base);
    const ask = agentAsk(base, ctx, 2026).salary;
    const p = (offer) => evaluateOffer(base, { years: 4, type: "one", ...offer }, ctx, 2026, null, () => 1).probability;
    expect(p({ salary: ask * 1.2 })).toBeGreaterThan(p({ salary: ask }));
    expect(p({ salary: ask })).toBeGreaterThan(p({ salary: ask * 0.8 }));
    expect(p({ salary: ask, type: "two", ahlSalary: 200 })).toBeLessThan(p({ salary: ask }) - 0.2);
  });
});
