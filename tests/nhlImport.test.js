import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { convertRoster, mapPosition, ageAt } from "../src/data/nhlImport";
import { buildRealRoster } from "../src/engine/players";
import { seededRandom } from "../src/engine/random";
import { REAL_ROSTERS } from "../src/data/rosters";

const rows = JSON.parse(readFileSync(new URL("./fixtures/nhl-sample.json", import.meta.url), "utf8"));
const roster = buildRealRoster(convertRoster(rows, { refDate: "2026-10-01" }).XXX, 0, seededRandom(1));
const byName = (n) => roster.find((p) => p.name.endsWith(n));

describe("import LNH", () => {
  it("convertit positions, âge, bio et nationalité", () => {
    expect(mapPosition("D", "R")).toBe("RD");
    expect(mapPosition("D", "L")).toBe("LD");
    expect(mapPosition("L", "L")).toBe("LW");
    expect(ageAt("1997-01-13", "2026-10-01")).toBe(29);
    const v = byName("Vedette");
    expect(v).toMatchObject({ pos: "C", age: 29, nationality: "CA", shoots: "Gauche", heightCm: 185 });
    expect(byName("Numero2").nationality).toBe("DE");
  });

  it("est calibré sur l'échelle des alignements faits à la main", () => {
    const handmade = ["MTL", "TOR", "BOS", "TBL"].map((id) => buildRealRoster(REAL_ROSTERS[id], 0, seededRandom(1)));
    const top18 = (r) => { const t = r.slice(0, 18); return t.reduce((a, p) => a + p.ovr, 0) / t.length; };
    const handmadeTop = handmade.map(top18).reduce((a, b) => a + b, 0) / handmade.length;
    const handmadeStar = Math.max(...handmade.map((r) => r[0].ovr));
    expect(Math.abs(top18(roster) - handmadeTop)).toBeLessThan(2.5);
    expect(roster[0].ovr).toBeLessThanOrEqual(handmadeStar + 2);
    expect(roster[0].ovr).toBeGreaterThanOrEqual(handmadeStar - 4);
  });

  it("classe les joueurs selon leurs statistiques", () => {
    expect(byName("Vedette").ovr).toBeGreaterThan(byName("Ailier3").ovr);
    expect(byName("DefNo1").ovr).toBeGreaterThan(byName("Def6").ovr);
    expect(byName("Partant").ovr).toBeGreaterThan(byName("Troisieme").ovr);
    expect(byName("Tough").attrs.fighting).toBeGreaterThan(byName("Vedette").attrs.fighting);
    expect(byName("Espoir1").potential).toBeGreaterThan(byName("Espoir1").ovr);
  });
});
