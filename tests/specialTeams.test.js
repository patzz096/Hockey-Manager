import { describe, it, expect } from "vitest";
import { initLeague, buildSchedule } from "../src/engine/league";
import { simulateGame } from "../src/engine/simulation";
import { seededRandom } from "../src/engine/random";
import { dressTeam } from "../src/engine/injuries";
import { lineLabel } from "../src/engine/lines";
import { SPECIAL_SYSTEMS, SLOT_KEYS, specialUnits, specialUnitOf, autoUnits, bestSpecial, unitFit, systemEffects, systemValue } from "../src/engine/specialTeams";

const lg = initLeague();
const byId = Object.fromEntries(lg.teams.map((t) => [t.id, t]));
const mtl = byId.MTL;

describe("unités spéciales (avantage et désavantage numérique)", () => {
  it("aligne deux unités distinctes par type, sans gardien", () => {
    ["pp", "pk"].forEach((kind) => {
      const units = specialUnits(mtl.lines, kind);
      expect(units).toHaveLength(2);
      const ids = units.flatMap((u) => SLOT_KEYS[kind].map((k) => u[k]));
      expect(ids.every(Boolean)).toBe(true);
      expect(new Set(ids).size).toBe(ids.length);
      expect(ids.every((id) => mtl.roster.find((p) => p.id === id).pos !== "G")).toBe(true);
    });
    expect(lineLabel(specialUnits(mtl.lines, "pp")[1].s1, mtl.lines)).toMatch(/AN2/);
  });

  it("accepte l'ancien format (un tableau de 5 identifiants)", () => {
    const ids = mtl.roster.filter((p) => p.pos !== "G").slice(0, 5).map((p) => p.id);
    const units = specialUnits({ pp: ids }, "pp");
    expect(units[0].s1).toBe(ids[0]);
    expect(units[0].s5).toBe(ids[4]);
    expect(specialUnitOf({ pp: ids }, "pp", ids[2])).toBe(1);
  });

  it("place les meilleurs joueurs du poste sur l'unité 1", () => {
    SPECIAL_SYSTEMS.pp.forEach((sys) => {
      const [u1, u2] = autoUnits(mtl.roster, "pp", sys.id);
      expect(unitFit(u1, mtl.roster, "pp", sys.id)).toBeGreaterThanOrEqual(unitFit(u2, mtl.roster, "pp", sys.id));
    });
  });

  it("équilibre les systèmes : aucun n'est choisi par toute la ligue", () => {
    ["pp", "pk"].forEach((kind) => {
      const picks = new Set(lg.teams.map((t) => bestSpecial(t.roster, kind).id));
      expect(picks.size).toBeGreaterThan(1);
    });
    // Une bonne adéquation rapporte plus qu'une mauvaise, pour chaque système.
    ["pp", "pk"].forEach((kind) => SPECIAL_SYSTEMS[kind].forEach((sys) => {
      expect(systemValue(kind, systemEffects(kind, sys.id, 1))).toBeGreaterThan(systemValue(kind, systemEffects(kind, sys.id, -1)));
    }));
  });

  it("comble les postes d'un blessé sans doublon", () => {
    const hurtId = specialUnits(mtl.lines, "pp")[0].s2;
    const d = dressTeam(mtl, mtl.lines, { [hurtId]: { until: 99, type: "Genou" } }, 0);
    const ids = specialUnits(d.lines, "pp").flatMap((u) => Object.values(u));
    expect(ids).not.toContain(hurtId);
    expect(ids.every(Boolean)).toBe(true);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("produit des buts en avantage et en désavantage numérique cohérents", () => {
    const rng = seededRandom(7);
    const lines = Object.fromEntries(lg.teams.map((t) => [t.id, t.lines]));
    const games = buildSchedule(lg.teams).slice(0, 400).map((g) => simulateGame(g, byId, rng, lines));
    let sh = 0;
    games.forEach((g) => ["home", "away"].forEach((s) => {
      const log = g.box.goalLog.filter((e) => e.side === s);
      expect(log.filter((e) => e.type === "PP")).toHaveLength(g.box[s].ppGoals);
      expect(log.filter((e) => e.type === "SH")).toHaveLength(g.box[s].shGoals);
      sh += g.box[s].shGoals;
    }));
    expect(sh).toBeGreaterThan(0);
  });
});
