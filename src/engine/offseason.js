import { expectedSalary, expectedYears } from "./contracts";
import { computeOvr } from "./attributes";
import { seededRandom } from "./random";

export const ROSTER_NEEDS = { C: 4, LW: 4, RW: 4, LD: 3, RD: 3, G: 2 };

// 1er juillet : les contrats avancent d'une saison. Les joueurs dont le contrat est échu
// deviennent agents libres, sauf ceux que leur équipe (ordinateur) réengage.
export function expireContracts(teams, myTeamId, year) {
  const rng = seededRandom(year * 13 + 5);
  const released = [], resigned = [], myExpired = [];
  const nextTeams = teams.map((t) => {
    const roster = [];
    t.roster.forEach((p) => {
      const years = (p.contract?.years ?? 1) - 1;
      if (years > 0) { roster.push({ ...p, contract: { ...p.contract, years } }); return; }
      if (t.id !== myTeamId && rng() < (p.ovr >= 65 ? 0.7 : 0.45) && p.age < 36) {
        const np = { ...p, contract: { years: expectedYears(p), salary: expectedSalary(p) } };
        roster.push(np); resigned.push({ player: np, teamId: t.id });
      } else {
        const fa = { ...p, contract: null };
        released.push(fa);
        if (t.id === myTeamId) myExpired.push(fa);
      }
    });
    return { ...t, roster };
  });
  return { teams: nextTeams, released, resigned, myExpired };
}

// Les équipes de l'ordinateur comblent leurs trous (par position) avec les meilleurs agents libres.
export function aiFreeAgency(teams, freeAgents, myTeamId) {
  let pool = [...freeAgents].sort((a, b) => b.ovr - a.ovr);
  const signings = [];
  const nextTeams = teams.map((t) => {
    if (t.id === myTeamId) return t;
    const roster = [...t.roster];
    Object.entries(ROSTER_NEEDS).forEach(([pos, need]) => {
      let have = roster.filter((p) => p.pos === pos).length;
      while (have < need) {
        const fa = pool.find((p) => p.pos === pos);
        if (!fa) break;
        pool = pool.filter((p) => p.id !== fa.id);
        const signed = { ...fa, contract: { years: expectedYears(fa), salary: expectedSalary(fa) } };
        roster.push(signed); signings.push({ player: signed, teamId: t.id });
        have++;
      }
    });
    return { ...t, roster: roster.sort((a, b) => b.ovr - a.ovr) };
  });
  return { teams: nextTeams, freeAgents: pool, signings };
}

// Passage à la saison suivante : tout le monde vieillit d'un an. Les vétérans perdent un peu,
// les jeunes se rapprochent de leur potentiel (le développement mensuel continue en saison).
export function agePlayers(list) {
  return list.map((p) => {
    const age = p.age + 1;
    const decline = age >= 33 ? Math.min(4, age - 32) : 0;
    if (!decline) return { ...p, age };
    const attrs = Object.fromEntries(Object.entries(p.attrs).map(([k, v]) => [k, Math.max(20, v - (["speed", "acceleration", "agility", "stamina", "reflexes", "lateralMovement"].includes(k) ? decline : Math.floor(decline / 2)))]));
    const ovr = computeOvr(p.pos, attrs);
    return { ...p, age, attrs, ovr, potential: Math.min(p.potential, Math.max(ovr, p.potential - decline)) };
  });
}
