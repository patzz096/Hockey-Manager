import { playoffSeeds, CONFERENCES, compareRecords } from "./standings";

// Séries éliminatoires au format LNH : 16 équipes, 4 rondes de séries 4 de 7.
//  Ronde 1 (dans chaque division) : le meilleur champion de division de l'association affronte
//  la 2e équipe repêchée, l'autre champion affronte la 1re ; 2e contre 3e de chaque division.
//  Ronde 2 : finales de division. Ronde 3 : finales d'association. Ronde 4 : finale de la Coupe.
//  Pas de réalignement : le tableau est fixe. Avantage de la glace au meilleur dossier.
//  Domicile : matchs 1, 2, 5 et 7 chez l'équipe favorisée (2-2-1-1-1).
export const ROUND_NAMES = ["Premier tour", "Deuxième tour", "Finales d'association", "Finale de la Coupe Stanley"];
const HOME_PATTERN = [true, true, false, false, true, false, true];

function series(id, round, a, b, rank, conf = null) {
  const [high, low] = rank(a) <= rank(b) ? [a, b] : [b, a];
  return { id, round, conf, high, low, winsHigh: 0, winsLow: 0, games: [], winner: null };
}

export function createPlayoffs(standings, teamsById, year) {
  const rankOf = Object.fromEntries(standings.map((s, i) => [s.id, i]));
  const rank = (id) => rankOf[id];
  const seeds = playoffSeeds(standings, teamsById);
  const first = [];
  Object.entries(seeds).forEach(([conf, c]) => {
    const [d1, d2] = c.order;
    const winners = [c.divisions[d1][0], c.divisions[d2][0]].sort(compareRecords);
    const [wc1, wc2] = c.wildcards;
    // Le meilleur champion de division affronte la 2e équipe repêchée.
    const wcFor = { [winners[0].id]: wc2, [winners[1].id]: wc1 };
    [d1, d2].forEach((d) => {
      const div = c.divisions[d];
      first.push(series(`R1-${conf}-${d}-A`, 0, div[0].id, wcFor[div[0].id].id, rank, conf));
      first.push(series(`R1-${conf}-${d}-B`, 0, div[1].id, div[2].id, rank, conf));
    });
  });
  return { year, rounds: [first], rankOf, champion: null };
}

export function nextGameOf(s) {
  const n = s.games.length;
  const highHome = HOME_PATTERN[n];
  return { home: highHome ? s.high : s.low, away: highHome ? s.low : s.high, number: n + 1 };
}

// Enregistre un match joué dans une série (copie de l'état des séries).
export function recordPlayoffGame(playoffs, seriesId, game) {
  const rounds = playoffs.rounds.map((r) => r.map((s) => {
    if (s.id !== seriesId || s.winner) return s;
    const winnerId = game.homeScore > game.awayScore ? game.home : game.away;
    const next = { ...s, games: [...s.games, game], winsHigh: s.winsHigh + (winnerId === s.high ? 1 : 0), winsLow: s.winsLow + (winnerId === s.low ? 1 : 0) };
    if (next.winsHigh === 4) next.winner = s.high;
    if (next.winsLow === 4) next.winner = s.low;
    return next;
  }));
  return advanceRounds({ ...playoffs, rounds });
}

// Quand toutes les séries d'une ronde sont terminées, crée la ronde suivante.
function advanceRounds(playoffs) {
  const current = playoffs.rounds[playoffs.rounds.length - 1];
  if (current.some((s) => !s.winner)) return playoffs;
  const r = playoffs.rounds.length;
  if (r === 4) return { ...playoffs, champion: current[0].winner };
  const rank = (id) => playoffs.rankOf[id];
  const next = [];
  if (r < 3) {
    for (let i = 0; i < current.length; i += 2) next.push(series(`R${r + 1}-${i / 2}`, r, current[i].winner, current[i + 1].winner, rank, current[i].conf));
  } else {
    next.push(series("R4-final", 3, current[0].winner, current[1].winner, rank, null));
  }
  return { ...playoffs, rounds: [...playoffs.rounds, next] };
}

export function activeSeries(playoffs) {
  if (!playoffs || playoffs.champion) return [];
  return playoffs.rounds[playoffs.rounds.length - 1].filter((s) => !s.winner);
}

// Série de l'équipe, si elle est encore en vie.
export function seriesOfTeam(playoffs, teamId) {
  return activeSeries(playoffs).find((s) => s.high === teamId || s.low === teamId) || null;
}

// Ordre du repêchage : équipes hors séries (pire dossier d'abord), puis équipes éliminées par
// ronde (pire dossier d'abord dans chaque ronde), finaliste avant-dernier, champion dernier.
// Les deux premiers choix sont ensuite fixés par la loterie (voir runDraftLottery).
export function draftOrder(standings, playoffs) {
  const worstFirst = (ids) => [...ids].sort((a, b) => playoffs.rankOf[b] - playoffs.rankOf[a]);
  const inPlayoffs = new Set(playoffs.rounds[0].flatMap((s) => [s.high, s.low]));
  const order = worstFirst(standings.map((s) => s.id).filter((id) => !inPlayoffs.has(id)));
  playoffs.rounds.forEach((round) => {
    order.push(...worstFirst(round.map((s) => (s.winner === s.high ? s.low : s.high))));
  });
  if (playoffs.champion) order.push(playoffs.champion);
  return order;
}

// Loterie de la LNH (format en vigueur depuis 2022) : les 16 équipes hors séries participent,
// deux tirages (1er et 2e choix), chances de 18,5 % à 0,5 %. Une équipe ne peut monter de plus
// de 10 rangs : si une équipe trop loin est tirée, elle monte de 10 rangs et le choix revient à
// l'équipe restante qui a les meilleures chances (le pire dossier). Une équipe ne gagne qu'une fois.
export const LOTTERY_ODDS = [18.5, 13.5, 11.5, 9.5, 8.5, 7.5, 6.5, 6.0, 5.0, 3.5, 3.0, 2.5, 2.0, 1.5, 0.5, 0.5];

// history : [{ year, winners: [ids] }] des loteries précédentes. Règle LNH : une équipe ne peut
// pas gagner la loterie plus de deux fois en cinq ans ; elle est alors exclue des tirages.
export function lotteryIneligible(history = [], year) {
  const count = {};
  history.filter((h) => h.year > year - 5 && h.year < year).forEach((h) => h.winners.forEach((id) => { count[id] = (count[id] || 0) + 1; }));
  return new Set(Object.keys(count).filter((id) => count[id] >= 2));
}

export function runDraftLottery(order, nonPlayoffCount, rng, ineligible = new Set()) {
  const pool = order.slice(0, nonPlayoffCount);
  const fixed = {}; // position (1 = premier choix) -> équipe
  const placed = new Set();
  const draws = [];
  for (let pick = 1; pick <= 2; pick++) {
    if (fixed[pick]) continue; // déjà attribué par la montée de 10 rangs du tirage précédent
    const candidates = pool.map((id, i) => ({ id, rank: i + 1, odds: LOTTERY_ODDS[i] ?? 0 })).filter((c) => !placed.has(c.id) && !ineligible.has(c.id));
    const total = candidates.reduce((a, c) => a + c.odds, 0);
    let r = rng() * total, drawn = candidates[candidates.length - 1];
    for (const c of candidates) { r -= c.odds; if (r <= 0) { drawn = c; break; } }
    if (drawn.rank - pick <= 10) {
      fixed[pick] = drawn.id; placed.add(drawn.id);
      draws.push({ pick, drawn: drawn.id, winner: drawn.id, from: drawn.rank });
    } else {
      let target = drawn.rank - 10;
      while (fixed[target]) target++;
      fixed[target] = drawn.id; placed.add(drawn.id);
      const best = pool.map((id, i) => ({ id, rank: i + 1 })).find((c) => !placed.has(c.id));
      fixed[pick] = best.id; placed.add(best.id);
      draws.push({ pick, drawn: drawn.id, winner: best.id, from: best.rank, movedTo: target });
    }
  }
  const rest = order.filter((id) => !placed.has(id));
  const result = [];
  // Gagnants au sens de la règle des 5 ans : les équipes tirées (même celles qui montent de 10 rangs).
  for (let pos = 1; pos <= order.length; pos++) result.push(fixed[pos] || rest.shift());
  return { order: result, draws, winners: draws.map((d) => d.drawn) };
}

export { CONFERENCES };
