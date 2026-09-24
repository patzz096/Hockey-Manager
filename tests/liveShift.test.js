// Sim en direct : choix du trio et de la paire envoyés sur la glace pour une mise au jeu
// (engine/lines.js `lineInfo`/`computeTOI` avec `lines.shift`, engine/simulation.js `aiPickShift`).
import { describe, it, expect } from "vitest";
import { initLeague } from "../src/engine/league";
import { lineInfo } from "../src/engine/lines";
import { simulateStretch, computeTOI, aiPickShift } from "../src/engine/simulation";
import { seededRandom } from "../src/engine/random";

const lg = initLeague();
const mtl = lg.teams.find((t) => t.id === "MTL");
const opp = lg.teams.find((t) => t.id === "TOR");

describe("choix du trio et de la paire pour une mise au jeu (sim en direct)", () => {
  it("concentre le poids d'ice time sur le trio et la paire choisis", () => {
    const lines = { ...mtl.lines, shift: { forwardIdx: 1, defenseIdx: 2 } };
    const onIceF = lines.forwards[1], offF = lines.forwards[0];
    const onIceD = lines.defense[2], offD = lines.defense[0];
    expect(lineInfo(onIceF.C, lines).bonus).toBeGreaterThan(lineInfo(offF.C, lines).bonus * 5);
    expect(lineInfo(onIceD.LD, lines).bonus).toBeGreaterThan(lineInfo(offD.LD, lines).bonus * 5);
    // Sans shift, le comportement habituel (FORWARD_BONUS/DEFENSE_BONUS) reste inchangé.
    expect(lineInfo(mtl.lines.forwards[0].C, mtl.lines).bonus).toBe(1.2);
  });

  it("attribue presque tout le temps de glace au trio et à la paire choisis", () => {
    const lines = { ...mtl.lines, shift: { forwardIdx: 2, defenseIdx: 0 } };
    const rng = seededRandom(7);
    const toi = computeTOI(lines, rng, 5 / 60);
    const onIceLine = lines.forwards[2], onIcePair = lines.defense[0];
    [onIceLine.LW, onIceLine.C, onIceLine.RW].forEach((id) => expect(toi[id]).toBeGreaterThan(1));
    [lines.forwards[0].LW, lines.forwards[1].C].forEach((id) => expect(toi[id]).toBeLessThan(toi[onIceLine.C]));
    [onIcePair.LD, onIcePair.RD].forEach((id) => expect(toi[id]).toBeGreaterThan(1));
  });

  it("simule une mise au jeu sans plantage et rattache les tirs surtout au trio/paire choisis", () => {
    const rng = seededRandom(42);
    const linesHome = { ...mtl.lines, shift: { forwardIdx: 0, defenseIdx: 0 } };
    const linesAway = { ...opp.lines, shift: { forwardIdx: 2, defenseIdx: 1 } };
    let onLineShots = 0, offLineShots = 0;
    const onIds = new Set([mtl.lines.forwards[0].LW, mtl.lines.forwards[0].C, mtl.lines.forwards[0].RW, mtl.lines.defense[0].LD, mtl.lines.defense[0].RD]);
    const offIds = new Set([mtl.lines.forwards[2].LW, mtl.lines.forwards[2].C, mtl.lines.forwards[2].RW]);
    for (let i = 0; i < 15; i++) {
      const seg = simulateStretch(mtl, opp, linesHome, linesAway, {}, 10, 4, rng, { home: 0, away: 0 });
      expect(seg.home.shots).toBeGreaterThanOrEqual(0);
      Object.entries(seg.home.shotsBy || {}).forEach(([id, n]) => { if (onIds.has(id)) onLineShots += n; if (offIds.has(id)) offLineShots += n; });
    }
    expect(onLineShots).toBeGreaterThan(offLineShots * 3);
  });

  it("choisit un trio et une paire valides, biaisés par l'écart au score en fin de match", () => {
    const rng = seededRandom(3);
    for (let i = 0; i < 50; i++) {
      const { forwardIdx, defenseIdx } = aiPickShift(0, 10, rng);
      expect(forwardIdx).toBeGreaterThanOrEqual(0); expect(forwardIdx).toBeLessThan(4);
      expect(defenseIdx).toBeGreaterThanOrEqual(0); expect(defenseIdx).toBeLessThan(3);
    }
    // En fin de match, en retard : envoie le trio no 1 nettement plus souvent.
    const trailing = Array.from({ length: 400 }, () => aiPickShift(-2, 55, rng).forwardIdx);
    const neutral = Array.from({ length: 400 }, () => aiPickShift(0, 10, rng).forwardIdx);
    const share = (arr, idx) => arr.filter((x) => x === idx).length / arr.length;
    expect(share(trailing, 0)).toBeGreaterThan(share(neutral, 0));
    // En avance en fin de match : envoie la paire défensive no 1 (repli) plus souvent.
    const leading = Array.from({ length: 400 }, () => aiPickShift(2, 55, rng).defenseIdx);
    const neutralD = Array.from({ length: 400 }, () => aiPickShift(0, 10, rng).defenseIdx);
    expect(share(leading, 0)).toBeGreaterThan(share(neutralD, 0));
  });
});
