import { describe, it, expect } from "vitest";
import { initLeague } from "../src/engine/league";
import { assignScout, scoutingDelay, createScoutReport, getScoutInfo, perceivedRatings, staffViewPlayer, INTERNAL_SCOUT_RATING } from "../src/engine/scouting";

const players = initLeague().teams.flatMap((t) => t.roster);

function meanError(rating, field, estField) {
  const scout = { id: `S${rating}`, name: "Test", rating };
  const errors = players.map((p) => Math.abs(createScoutReport(p, scout, 5)[estField] - p[field]));
  return errors.reduce((a, b) => a + b, 0) / errors.length;
}

describe("dépistage", () => {
  it("un meilleur dépisteur estime plus précisément l'habileté et le potentiel", () => {
    expect(meanError(95, "ovr", "estOvr")).toBeLessThan(meanError(30, "ovr", "estOvr"));
    expect(meanError(95, "potential", "estPotential")).toBeLessThan(meanError(30, "potential", "estPotential"));
  });

  it("le potentiel est plus incertain que l'habileté actuelle", () => {
    expect(meanError(60, "potential", "estPotential")).toBeGreaterThan(meanError(60, "ovr", "estOvr"));
  });

  it("un meilleur dépisteur est plus rapide", () => {
    expect(scoutingDelay(99)).toBe(1);
    expect(scoutingDelay(20)).toBeGreaterThan(scoutingDelay(80));
  });

  it("un rapport est reproductible pour le même joueur, dépisteur et jour", () => {
    const scout = { id: "S1", name: "Test", rating: 60 };
    expect(createScoutReport(players[0], scout, 3)).toEqual(createScoutReport(players[0], scout, 3));
  });

  it("assigne le dépisteur selon l'âge, avec repli", () => {
    const amateur = { id: "A", name: "Ama", rating: 80 };
    const pro = { id: "P", name: "Pro", rating: 70 };
    expect(assignScout({ age: 19 }, { scoutAmateur: amateur, scoutPro: pro }).id).toBe("A");
    expect(assignScout({ age: 28 }, { scoutAmateur: amateur, scoutPro: pro }).id).toBe("P");
    const fallback = assignScout({ age: 28 }, { scoutAmateur: amateur });
    expect(fallback).toMatchObject({ id: "A", offSpecialty: true, rating: 68 });
    expect(assignScout({ age: 28 }, {}).rating).toBe(INTERNAL_SCOUT_RATING);
  });

  it("affiche les estimations du rapport plutôt que les vraies valeurs", () => {
    const p = players[0];
    const report = createScoutReport(p, { id: "S", name: "T", rating: 30 }, 1);
    const info = getScoutInfo(p, "X", "MTL", {}, { [p.id]: report });
    expect(perceivedRatings(p, info).ovr).toBe(report.estOvr);
    expect(getScoutInfo(p, "X", "MTL", {}, {}).known).toBe(false);
  });

  it("tes joueurs sont vus à travers ton personnel, plus justement avec un bon dépisteur", () => {
    const err = (staff) => players.reduce((a, p) => a + Math.abs(staffViewPlayer(p, staff).ovr - p.ovr), 0) / players.length;
    const good = { scoutAmateur: { id: "A", name: "A", rating: 95 }, scoutPro: { id: "P", name: "P", rating: 95 } };
    expect(err(good)).toBeLessThan(err({}));
    expect(staffViewPlayer(players[0], {})).toEqual(staffViewPlayer(players[0], {}));
  });
});
