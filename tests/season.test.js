import { describe, it, expect } from "vitest";
import { initLeague, buildSchedule } from "../src/engine/league";
import { simulateGame, nextStoppage } from "../src/engine/simulation";
import { seededRandom } from "../src/engine/random";
import { computeStandings, playoffSeeds, conferenceOf } from "../src/engine/standings";
import { createPlayoffs, recordPlayoffGame, activeSeries, nextGameOf, draftOrder } from "../src/engine/playoffs";
import { createDraft, aiPick, makePick, draftDone, DRAFT_ROUNDS } from "../src/engine/draft";
import { expireContracts, aiFreeAgency, agePlayers, ROSTER_NEEDS } from "../src/engine/offseason";
import { seasonDates, transactionWindow, formatDay } from "../src/engine/calendar";
import { clockDisplay } from "../src/components/match/LiveSimPanel";

const lg = initLeague();
const byId = Object.fromEntries(lg.teams.map((t) => [t.id, t]));
const lines = Object.fromEntries(lg.teams.map((t) => [t.id, t.lines]));
const rng = seededRandom(99);
const games = buildSchedule(lg.teams).map((g) => simulateGame(g, byId, rng, lines));
const standings = computeStandings(lg.teams, games);

function playAll(p) {
  let guard = 0;
  while (!p.champion && guard++ < 200) {
    const act = activeSeries(p);
    const min = Math.min(...act.map((s) => s.games.length));
    act.filter((s) => s.games.length === min).forEach((s) => {
      const n = nextGameOf(s);
      p = recordPlayoffGame(p, s.id, simulateGame({ id: `${s.id}-${n.number}`, home: n.home, away: n.away, playoff: true, seriesId: s.id }, byId, rng, lines, {}, { playoff: true }));
    });
  }
  return p;
}

describe("classement LNH", () => {
  it("compte 2 pts par victoire, 1 par défaite en prolongation", () => {
    standings.forEach((s) => {
      expect(s.pts).toBe(2 * s.w + s.otl);
      expect(s.w + s.l + s.otl).toBe(s.gp);
      expect(s.rw).toBeLessThanOrEqual(s.row);
      expect(s.row).toBeLessThanOrEqual(s.w);
    });
    expect(standings.reduce((a, s) => a + s.otl, 0)).toBeGreaterThan(0);
  });
  it("trie par points puis départage", () => {
    for (let i = 1; i < standings.length; i++) expect(standings[i - 1].pts).toBeGreaterThanOrEqual(standings[i].pts);
  });
});

describe("séries éliminatoires", () => {
  const seeds = playoffSeeds(standings, byId);
  const p0 = createPlayoffs(standings, byId, 2026);
  it("qualifie 3 équipes par division + 2 repêchées par association", () => {
    Object.values(seeds).forEach((c) => { Object.values(c.divisions).forEach((d) => expect(d).toHaveLength(3)); expect(c.wildcards).toHaveLength(2); });
    expect(p0.rounds[0]).toHaveLength(8);
    const teams = p0.rounds[0].flatMap((s) => [s.high, s.low]);
    expect(new Set(teams).size).toBe(16);
    p0.rounds[0].forEach((s) => expect(conferenceOf(byId[s.high].division)).toBe(conferenceOf(byId[s.low].division)));
  });
  it("donne l'avantage de la glace au meilleur dossier (2-2-1-1-1)", () => {
    const s = p0.rounds[0][0];
    expect(p0.rankOf[s.high]).toBeLessThan(p0.rankOf[s.low]);
    expect(nextGameOf(s).home).toBe(s.high);
  });
  it("va jusqu'à la Coupe : séries 4 de 7, pas de tirs de barrage", () => {
    const p = playAll(p0);
    expect(p.rounds).toHaveLength(4);
    expect(p.champion).toBeTruthy();
    p.rounds.flat().forEach((s) => {
      expect(Math.max(s.winsHigh, s.winsLow)).toBe(4);
      expect(s.games.length).toBeGreaterThanOrEqual(4);
      expect(s.games.length).toBeLessThanOrEqual(7);
      s.games.forEach((g) => expect(g.decidedIn).not.toBe("SO"));
    });
    // Finale : un représentant de chaque association.
    const f = p.rounds[3][0];
    expect(conferenceOf(byId[f.high].division)).not.toBe(conferenceOf(byId[f.low].division));
    const order = draftOrder(standings, p);
    expect(order).toHaveLength(32);
    expect(order[31]).toBe(p.champion);
    expect(new Set(order).size).toBe(32);
  });
});

describe("repêchage et saison morte", () => {
  it("déroule 7 rondes, chaque espoir choisi une seule fois", () => {
    let d = createDraft(2026, lg.teams.map((t) => t.id));
    while (!draftDone(d)) d = makePick(d, aiPick(d, d.picks[d.current].teamId).id).draft;
    expect(d.picks).toHaveLength(32 * DRAFT_ROUNDS);
    expect(new Set(d.picks.map((k) => k.playerId)).size).toBe(d.picks.length);
    const res = makePick(createDraft(2026, ["MTL"]), "DRAFT-2026-0");
    expect(res.player).toMatchObject({ contract: { years: 3, salary: 1025, elc: true, type: "two" }, draftPick: 1, level: "LAH" });
  });
  it("fait expirer les contrats le 1er juillet et comble les alignements", () => {
    const exp = expireContracts(lg.teams, "MTL", 2026);
    expect(exp.released.length).toBeGreaterThan(0);
    exp.teams.forEach((t) => t.roster.forEach((p) => expect(p.contract.years).toBeGreaterThan(0)));
    const fa = aiFreeAgency(exp.teams, exp.released, "MTL");
    expect(fa.signings.length).toBeGreaterThan(0);
    const aged = agePlayers(lg.teams[0].roster);
    expect(aged[0].age).toBe(lg.teams[0].roster[0].age + 1);
    expect(Object.keys(ROSTER_NEEDS)).toHaveLength(6);
  });
});

describe("calendrier et direct", () => {
  it("place la date limite des échanges avant les séries et gèle jusqu'au 1er juillet", () => {
    const d = seasonDates(2026);
    expect(formatDay(d.tradeDeadline)).toBe("5 mars 2027");
    expect(formatDay(d.draft)).toBe("24 juin 2027");
    expect(transactionWindow(2026, d.tradeDeadline - 1).open).toBe(true);
    expect(transactionWindow(2026, d.tradeDeadline).open).toBe(false);
    expect(transactionWindow(2026, d.draft).open).toBe(false);
    expect(transactionWindow(2026, d.freeAgency).open).toBe(true);
  });
  it("affiche l'horloge qui descend de 20:00 à 00:00", () => {
    expect(clockDisplay(0)).toBe("20:00");
    expect(clockDisplay(5.5)).toBe("14:30");
    expect(clockDisplay(20)).toBe("00:00");
    expect(clockDisplay(23)).toBe("17:00");
    expect(clockDisplay(60)).toBe("00:00");
  });
  it("arrête le jeu à des moments variables, jamais au-delà de la période", () => {
    const r = seededRandom(5);
    const stops = new Set();
    let m = 0;
    while (m < 60) { const s = nextStoppage(m, r); expect(s.minute).toBeGreaterThan(m); expect(Math.floor((s.minute - 1e-9) / 20)).toBe(Math.floor(m / 20)); stops.add(Math.round((s.minute - m) * 60)); m = s.minute; }
    expect(stops.size).toBeGreaterThan(5);
  });
});
