import { describe, it, expect } from "vitest";
import { initLeague } from "../src/engine/league";
import { STRATEGY_PHASES, DEFAULT_STRATEGY, normalizeStrategy, computeStrategyFits, optionEffects, optionValue, bestStrategy, playersForOption, strategyOption } from "../src/engine/strategy";

const lg = initLeague();

describe("systèmes de jeu (guide LNH)", () => {
  it("offre 5 phases de 5 systèmes, chacun documenté", () => {
    expect(STRATEGY_PHASES.map((p) => p.key)).toEqual(["defense", "breakout", "offense", "forecheck", "backcheck"]);
    STRATEGY_PHASES.forEach((ph) => {
      expect(ph.options).toHaveLength(5);
      ph.options.forEach((o) => { expect(o.desc && o.good && o.bad).toBeTruthy(); expect(o.groups.length).toBeGreaterThan(0); });
      expect(ph.options.some((o) => o.id === DEFAULT_STRATEGY[ph.key])).toBe(true);
    });
  });

  it("remplace un ancien format ou une valeur inconnue par le défaut", () => {
    expect(normalizeStrategy({ forecheck: "aggressive", entry: "dump" })).toEqual(DEFAULT_STRATEGY);
    expect(normalizeStrategy({ ...DEFAULT_STRATEGY, offense: "lowCycle" }).offense).toBe("lowCycle");
  });

  it("mesure l'adéquation selon le profil des joueurs", () => {
    const base = lg.teams[3];
    const tune = (keys, v) => ({ ...base, roster: base.roster.map((p) => ({ ...p, attrs: { ...p.attrs, ...Object.fromEntries(keys.map((k) => [k, v])) } })) });
    const fast = tune(["speed", "aggressiveness", "hitting", "stamina", "acceleration"], 85);
    const slow = tune(["speed", "aggressiveness", "hitting", "stamina", "acceleration"], 45);
    expect(computeStrategyFits(fast, base.lines).forecheck.f212).toBeGreaterThan(0.8);
    expect(computeStrategyFits(slow, base.lines).forecheck.f212).toBeLessThan(-0.8);
    // Un bon effectif tire mieux parti du même système qu'un mauvais.
    const good = optionValue(optionEffects("forecheck", "f212", 1));
    const bad = optionValue(optionEffects("forecheck", "f212", -1));
    expect(good).toBeGreaterThan(0);
    expect(bad).toBeLessThan(0);
  });

  it("choisit des systèmes variés selon les effectifs (aucun système dominant)", () => {
    STRATEGY_PHASES.forEach((ph) => {
      const picks = new Set(lg.teams.map((t) => bestStrategy(t, t.lines)[ph.key]));
      expect(picks.size).toBeGreaterThan(2);
    });
  });

  it("désigne les joueurs les mieux et les moins adaptés du bon groupe", () => {
    const t = lg.teams.find((x) => x.id === "MTL");
    const res = playersForOption(t, strategyOption("backcheck", "lwLock"), 3);
    expect(res.best.every((r) => r.p.pos === "LW")).toBe(true);
    expect(res.best[0].v).toBeGreaterThanOrEqual(res.worst[0].v);
  });
});
