// Entraînement (façon FM24) : condition physique, cohésion tactique et fatigue en match
// (engine/training.js).
import { describe, it, expect } from "vitest";
import {
  BASE_CONDITION, conditionFactor, weeklyConditionDelta, applyWeeklyCondition,
  strategySignature, resetCohesion, weeklyCohesionDelta, applyWeeklyCohesion,
  cohesionRealization, autoTrainingFocus, autoTrainingSessions, resolveFocus,
  applyGameFatigue, MIN_CONDITION, MIN_COHESION, SLOTS_PER_DAY,
} from "../src/engine/training";
import { DEFAULT_STRATEGY } from "../src/engine/strategy";

describe("conditionFactor", () => {
  it("est neutre (1) à BASE_CONDITION", () => {
    expect(conditionFactor(BASE_CONDITION)).toBe(1);
    expect(conditionFactor()).toBe(1);
  });
  it("monte au-dessus et descend en dessous de BASE_CONDITION, en restant borné", () => {
    expect(conditionFactor(100)).toBeGreaterThan(1);
    expect(conditionFactor(35)).toBeLessThan(1);
    expect(conditionFactor(1000)).toBeLessThanOrEqual(1.08);
    expect(conditionFactor(-1000)).toBeGreaterThanOrEqual(0.85);
  });
});

describe("weeklyConditionDelta / applyWeeklyCondition", () => {
  it("récupère quand aucun match n'a été joué", () => {
    expect(weeklyConditionDelta(BASE_CONDITION, 60, 0)).toBeGreaterThan(0);
  });
  it("baisse davantage avec plus de matchs joués dans la semaine", () => {
    const few = weeklyConditionDelta(BASE_CONDITION, 60, 1);
    const many = weeklyConditionDelta(BASE_CONDITION, 60, 4);
    expect(many).toBeLessThan(few);
  });
  it("une meilleure endurance atténue la fatigue des matchs", () => {
    const lowStamina = weeklyConditionDelta(BASE_CONDITION, 20, 3);
    const highStamina = weeklyConditionDelta(BASE_CONDITION, 95, 3);
    expect(highStamina).toBeGreaterThan(lowStamina);
  });
  it("le programme physique récupère plus que le travail tactique", () => {
    const fitness = weeklyConditionDelta(BASE_CONDITION, 60, 2, "fitness");
    const tactical = weeklyConditionDelta(BASE_CONDITION, 60, 2, "tactical");
    expect(fitness).toBeGreaterThan(tactical);
  });
  it("un bon entraîneur physique accélère la récupération", () => {
    const noCoach = weeklyConditionDelta(BASE_CONDITION, 60, 1, "balanced", null);
    const goodCoach = weeklyConditionDelta(BASE_CONDITION, 60, 1, "balanced", 90);
    const badCoach = weeklyConditionDelta(BASE_CONDITION, 60, 1, "balanced", 25);
    expect(goodCoach).toBeGreaterThan(noCoach);
    expect(noCoach).toBeGreaterThan(badCoach);
  });
  it("applyWeeklyCondition met à jour et borne le roster", () => {
    const roster = [{ id: "a", condition: 40, attrs: { stamina: 30 } }, { id: "b", attrs: { stamina: 80 } }];
    const next = applyWeeklyCondition(roster, 5, "balanced");
    next.forEach((p) => { expect(p.condition).toBeGreaterThanOrEqual(MIN_CONDITION); expect(p.condition).toBeLessThanOrEqual(100); });
    expect(next[1].condition).toBeDefined();
  });
});

describe("cohésion tactique", () => {
  it("strategySignature identifie deux stratégies identiques et distingue un changement", () => {
    const s1 = { ...DEFAULT_STRATEGY };
    const s2 = { ...DEFAULT_STRATEGY, forecheck: "f212" };
    expect(strategySignature(s1)).toBe(strategySignature({ ...DEFAULT_STRATEGY }));
    expect(strategySignature(s1)).not.toBe(strategySignature(s2));
  });
  it("resetCohesion fait chuter la cohésion sans jamais passer sous MIN_COHESION", () => {
    expect(resetCohesion(100)).toBeLessThan(100);
    expect(resetCohesion(10)).toBe(MIN_COHESION);
  });
  it("weeklyCohesionDelta est meilleur avec le travail tactique qu'avec le repos", () => {
    expect(weeklyCohesionDelta("tactical", 50)).toBeGreaterThan(weeklyCohesionDelta("rest", 50));
  });
  it("un meilleur entraîneur-chef accélère la progression de la cohésion", () => {
    expect(weeklyCohesionDelta("balanced", 90)).toBeGreaterThan(weeklyCohesionDelta("balanced", 30));
  });
  it("applyWeeklyCohesion reste borné entre MIN_COHESION et 100", () => {
    expect(applyWeeklyCohesion(99, "tactical", 90)).toBeLessThanOrEqual(100);
    expect(applyWeeklyCohesion(30, "rest", 20)).toBeGreaterThanOrEqual(MIN_COHESION);
  });
  it("cohesionRealization est neutre à 100 et réduit la réalisation à basse cohésion", () => {
    expect(cohesionRealization(100)).toBe(1);
    expect(cohesionRealization(30)).toBeLessThan(cohesionRealization(100));
    expect(cohesionRealization(0)).toBeGreaterThanOrEqual(0.45);
  });
});

describe("resolveFocus (séances multiples au calendrier)", () => {
  it("une seule clé se comporte comme avant (rétrocompatible)", () => {
    expect(resolveFocus("fitness")).toEqual({ conditionBoost: 2.8, cohesionBoost: -1.6 });
  });
  it("moyenne l'effet de deux séances de la même semaine", () => {
    const blended = resolveFocus(["fitness", "tactical"]);
    expect(blended.conditionBoost).toBeCloseTo((2.8 + -1.2) / 2);
    expect(blended.cohesionBoost).toBeCloseTo((-1.6 + 3.0) / 2);
  });
  it("un tableau vide retombe sur le programme équilibré", () => {
    expect(resolveFocus([])).toEqual({ conditionBoost: 0, cohesionBoost: 0 });
  });
});

describe("autoTrainingSessions", () => {
  it("planifie au maximum SLOTS_PER_DAY séances (matin/après-midi)", () => {
    expect(autoTrainingSessions(85, 95, 3).length).toBe(SLOTS_PER_DAY);
    expect(autoTrainingSessions(60, 40, 3).length).toBe(SLOTS_PER_DAY);
  });
  it("repos si aucun match à venir", () => { expect(autoTrainingSessions(85, 100, 0)).toEqual(["rest", "rest"]); });
  it("inclut une séance physique si l'effectif est fatigué", () => { expect(autoTrainingSessions(60, 100, 3)).toContain("fitness"); });
  it("inclut une séance tactique si la cohésion a chuté", () => { expect(autoTrainingSessions(85, 40, 3)).toContain("tactical"); });
});

describe("autoTrainingFocus", () => {
  it("recommande le repos sans match à venir", () => { expect(autoTrainingFocus(85, 100, 0)).toBe("rest"); });
  it("recommande la préparation physique si l'effectif est fatigué", () => { expect(autoTrainingFocus(60, 100, 3)).toBe("fitness"); });
  it("recommande le travail tactique si la cohésion a chuté", () => { expect(autoTrainingFocus(85, 40, 3)).toBe("tactical"); });
  it("recommande l'équilibré sinon", () => { expect(autoTrainingFocus(85, 95, 3)).toBe("balanced"); });
});

describe("applyGameFatigue", () => {
  it("baisse l'énergie de ceux qui jouent, l'augmente pour ceux qui restent au banc", () => {
    const roster = [{ id: "p1", pos: "C", attrs: { stamina: 60 }, condition: 85 }, { id: "p2", pos: "LW", attrs: { stamina: 60 }, condition: 85 }];
    const toi = { p1: 4 };
    const next = applyGameFatigue({}, roster, toi, 4);
    expect(next.p1).toBeLessThan(85);
    expect(next.p2).toBeGreaterThanOrEqual(85);
  });
  it("ignore les gardiens", () => {
    const roster = [{ id: "g1", pos: "G", attrs: { stamina: 60 }, condition: 85 }];
    const next = applyGameFatigue({}, roster, { g1: 4 }, 4);
    expect(next.g1).toBeUndefined();
  });
  it("reste borné entre MIN_CONDITION et 100", () => {
    const roster = [{ id: "p1", pos: "C", attrs: { stamina: 10 }, condition: 40 }];
    const next = applyGameFatigue({}, roster, { p1: 20 }, 20);
    expect(next.p1).toBeGreaterThanOrEqual(MIN_CONDITION);
  });
});
