import { marketValue, expectedYears } from "./contracts";
import { computeOvr } from "./attributes";
import { seededRandom } from "./random";
import { fitsUnderCap } from "./cap";

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
        const np = { ...p, contract: { years: expectedYears(p), salary: marketValue(p, year + 1), type: "one" } };
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

// Signatures d'agents libres par l'ordinateur EN SAISON (pas seulement le 1er juillet) : chaque
// mois, quelques équipes avec un trou de position signent le meilleur agent libre disponible à ce
// poste si elles ont l'espace sous le plafond. Bien plus timide que aiFreeAgency (probabilité par
// équipe, `maxSignings` au total) pour ne pas vider le marché d'un coup — juste de quoi donner
// l'impression d'un marché vivant plutôt que figé toute la saison.
export function aiSignFreeAgentsInSeason(teams, freeAgents, myTeamId, year, rng, maxSignings = 3) {
  let pool = [...freeAgents].sort((a, b) => b.ovr - a.ovr);
  const signings = [];
  for (const t of teams) {
    if (t.id === myTeamId || signings.length >= maxSignings) continue;
    if (rng() > 0.35) continue;
    const roster = t.roster;
    const needEntry = Object.entries(ROSTER_NEEDS).find(([pos, n]) => roster.filter((p) => p.pos === pos).length < n);
    if (!needEntry) continue;
    const [pos] = needEntry;
    const fa = pool.find((p) => p.pos === pos && fitsUnderCap(roster, year, marketValue(p, year)));
    if (!fa) continue;
    pool = pool.filter((p) => p.id !== fa.id);
    const signed = { ...fa, contract: { years: expectedYears(fa), salary: marketValue(fa, year), type: "one" } };
    signings.push({ player: signed, teamId: t.id });
  }
  if (!signings.length) return null;
  const nextTeams = teams.map((t) => {
    const s = signings.filter((x) => x.teamId === t.id);
    return s.length ? { ...t, roster: [...t.roster, ...s.map((x) => x.player)].sort((a, b) => b.ovr - a.ovr) } : t;
  });
  return { teams: nextTeams, freeAgents: pool, signings };
}

// Échanges simples entre équipes de l'ordinateur (jamais la tienne) : chaque mois, quelques
// paires s'échangent un joueur chacune pour combler un trou de position avec le surplus de
// l'autre (jamais leur meilleur joueur à ce poste), sous réserve du plafond salarial. Heuristique
// volontairement simple (pas d'évaluation fine de la valeur d'échange) : le but est de donner
// l'impression d'un marché vivant (nouvelles de transactions) plutôt qu'une IA stratège.
export function aiTradesAmongCpu(teams, myTeamId, year, rng, maxTrades = 2) {
  const others = teams.filter((t) => t.id !== myTeamId);
  const used = new Set();
  const trades = [];
  for (let i = 0; i < others.length && trades.length < maxTrades; i++) {
    const a = others[i];
    if (used.has(a.id) || rng() > 0.25) continue;
    const partners = others.filter((t) => !used.has(t.id) && t.id !== a.id);
    if (!partners.length) continue;
    const b = partners[Math.floor(rng() * partners.length)];
    const needA = Object.entries(ROSTER_NEEDS).find(([pos, n]) => a.roster.filter((p) => p.pos === pos).length < n)?.[0];
    const needB = Object.entries(ROSTER_NEEDS).find(([pos, n]) => b.roster.filter((p) => p.pos === pos).length < n)?.[0];
    const surplusB = needA && b.roster.filter((p) => p.pos === needA).sort((x, y) => y.ovr - x.ovr)[1];
    const surplusA = needB && a.roster.filter((p) => p.pos === needB).sort((x, y) => y.ovr - x.ovr)[1];
    if (!surplusA || !surplusB || surplusA.id === surplusB.id) continue;
    const outA = surplusA.contract?.salary || 0, inA = surplusB.contract?.salary || 0;
    if (!fitsUnderCap(a.roster, year, inA, outA) || !fitsUnderCap(b.roster, year, outA, inA)) continue;
    trades.push({ teamAId: a.id, teamBId: b.id, playerFromA: surplusA, playerFromB: surplusB });
    used.add(a.id); used.add(b.id);
  }
  if (!trades.length) return null;
  const nextTeams = teams.map((t) => {
    const asA = trades.find((tr) => tr.teamAId === t.id);
    if (asA) return { ...t, roster: [...t.roster.filter((p) => p.id !== asA.playerFromA.id), asA.playerFromB].sort((a, b) => b.ovr - a.ovr) };
    const asB = trades.find((tr) => tr.teamBId === t.id);
    if (asB) return { ...t, roster: [...t.roster.filter((p) => p.id !== asB.playerFromB.id), asB.playerFromA].sort((a, b) => b.ovr - a.ovr) };
    return t;
  });
  return { teams: nextTeams, trades };
}

// Les équipes de l'ordinateur comblent leurs trous (par position) avec les meilleurs agents libres,
// le 1er juillet. Plafonné à `maxPerTeam` signatures par équipe (comme la vraie ouverture du marché,
// où même les équipes les plus actives ne concluent qu'une poignée d'ententes) : sans ça, les
// 31 autres équipes videraient le marché au complet avant même que le joueur ouvre l'onglet Agents
// libres (chaque équipe pouvant chercher jusqu'à 20 postes à combler — voir ROSTER_NEEDS). Le reste
// des trous se comble plus tard dans la saison via aiSignFreeAgentsInSeason, au compte-gouttes.
// Respecte le plafond salarial de la saison `year` : un joueur trop cher est ignoré.
export function aiFreeAgency(teams, freeAgents, myTeamId, year = 2027, maxPerTeam = 2) {
  let pool = [...freeAgents].sort((a, b) => b.ovr - a.ovr);
  const signings = [];
  const nextTeams = teams.map((t) => {
    if (t.id === myTeamId) return t;
    const roster = [...t.roster];
    let signedHere = 0;
    for (const [pos, need] of Object.entries(ROSTER_NEEDS)) {
      let have = roster.filter((p) => p.pos === pos).length;
      while (have < need && signedHere < maxPerTeam) {
        const fa = pool.find((p) => p.pos === pos && fitsUnderCap(roster, year, marketValue(p, year)));
        if (!fa) break;
        pool = pool.filter((p) => p.id !== fa.id);
        const signed = { ...fa, contract: { years: expectedYears(fa), salary: marketValue(fa, year), type: "one" } };
        roster.push(signed); signings.push({ player: signed, teamId: t.id });
        have++; signedHere++;
      }
      if (signedHere >= maxPerTeam) break;
    }
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
