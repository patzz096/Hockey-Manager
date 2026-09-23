import { describe, it, expect } from "vitest";
import { initLeague, buildSchedule } from "../src/engine/league";
import { simulateGame } from "../src/engine/simulation";
import { seededRandom } from "../src/engine/random";
import { ROLES, ROLE_GROUPS, roleFit, naturalRole, roleOf, roleMods, roleWarnings, naturalRoles } from "../src/engine/roles";

const lg = initLeague();
const byId = Object.fromEntries(lg.teams.map((t) => [t.id, t]));

describe("rôles des joueurs (archétypes)", () => {
  it("définit 5 rôles d'attaquant, 3 de défenseur et le style papillon", () => {
    expect(ROLE_GROUPS.F).toHaveLength(5);
    expect(ROLE_GROUPS.D).toHaveLength(3);
    Object.values(ROLES).forEach((r) => { expect(r.desc && r.priority && r.examples).toBeTruthy(); expect(Object.keys(r.keys).length).toBeGreaterThan(2); });
  });

  it("trouve l'archétype naturel selon le profil", () => {
    const base = byId.MTL.roster.find((p) => p.pos === "C");
    const tune = (vals) => ({ ...base, attrs: { ...Object.fromEntries(Object.keys(base.attrs).map((k) => [k, 55])), ...vals } });
    expect(naturalRole(tune({ shotAccuracy: 85, shotRange: 82, gettingOpen: 80 }))).toBe("sniper");
    expect(naturalRole(tune({ passing: 86, offensiveRead: 84, puckhandling: 80 }))).toBe("playmaker");
    expect(naturalRole(tune({ aggressiveness: 85, checking: 84, hitting: 86 }))).toBe("grinder");
    expect(roleFit(tune({ shotAccuracy: 85, shotRange: 82, gettingOpen: 80, offensiveRead: 80 }), "sniper")).toBeGreaterThan(0.8);
  });

  it("applique le rôle demandé, sinon le rôle naturel, et atténue un contre-emploi", () => {
    const p = byId.MTL.roster.find((x) => x.pos === "LW");
    expect(roleOf({ roles: {} }, p)).toBe(naturalRole(p));
    expect(roleOf({ roles: { [p.id]: "grinder" } }, p)).toBe("grinder");
    expect(roleOf({ roles: { [p.id]: "stayHome" } }, p)).toBe(naturalRole(p)); // rôle de défenseur refusé
    const weak = { ...p, attrs: Object.fromEntries(Object.keys(p.attrs).map((k) => [k, 40])) };
    const strong = { ...p, attrs: Object.fromEntries(Object.keys(p.attrs).map((k) => [k, 80])) };
    const L = { roles: { [p.id]: "sniper" } };
    expect(roleMods(L, strong).shoot).toBeGreaterThan(roleMods(L, weak).shoot);
    expect(roleMods(L, weak).attack).toBeLessThan(roleMods(L, strong).attack);
    expect(Object.keys(naturalRoles(byId.MTL.roster)).length).toBe(byId.MTL.roster.filter((x) => x.pos !== "G").length);
  });

  it("donne plus de tirs aux francs-tireurs et plus de mises en échec aux joueurs d'énergie", () => {
    const team = byId.MTL, lines = Object.fromEntries(lg.teams.map((t) => [t.id, t.lines]));
    const F = team.roster.filter((p) => ["C", "LW", "RW"].includes(p.pos)).map((p) => p.id);
    const count = (roles) => {
      const L = { ...lines, MTL: { ...lines.MTL, roles } };
      const r = seededRandom(3); const shots = {}, hits = {};
      buildSchedule(lg.teams).filter((g) => g.home === "MTL" || g.away === "MTL").forEach((g) => {
        const res = simulateGame(g, byId, r, L); const side = res.home === "MTL" ? "home" : "away";
        Object.entries(res.box[side].shotsBy).forEach(([id, c]) => { shots[id] = (shots[id] || 0) + c; });
        Object.entries(res.box[side].hitsBy).forEach(([id, c]) => { hits[id] = (hits[id] || 0) + c; });
      });
      return { shots, hits };
    };
    const target = F[0];
    const asSniper = count({ [target]: "sniper" }), asGrinder = count({ [target]: "grinder" });
    expect(asSniper.shots[target]).toBeGreaterThan(asGrinder.shots[target]);
    expect(asGrinder.hits[target]).toBeGreaterThan(asSniper.hits[target]);
  });

  it("avertit d'un rôle mal placé dans l'alignement", () => {
    expect(roleWarnings("grinder", { type: "F", idx: 0 }, false, false).length).toBeGreaterThan(0);
    expect(roleWarnings("sniper", { type: "F", idx: 3 }, false, false).length).toBeGreaterThan(0);
    expect(roleWarnings("twoWay", { type: "F", idx: 2 }, false, true)).toHaveLength(0);
  });
});
