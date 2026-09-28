import { gameDay } from "./calendar";

// Numéro (1er, 2e, ...) du but marqué par `scorerId` dans sa saison, au sens du calendrier
// (jour réel du match, voir engine/calendar.js gameDay) : compte tous ses buts dans les matchs
// joués jusqu'à ce jour inclusivement (matchs d'un autre jour), plus ceux du match `game`
// jusqu'à l'index `goalIndex` inclusivement (dans l'ordre chronologique de son goalLog).
export function seasonGoalNumber(schedule, seasonYear, game, scorerId, goalIndex) {
  const day = gameDay(seasonYear, game);
  let count = 0;
  schedule.forEach((g) => {
    if (!g.played || !g.box) return;
    const gDay = gameDay(seasonYear, g);
    if (gDay > day || (gDay === day && g.id !== game.id)) return;
    const goals = g.box.goalLog || [];
    const limit = g.id === game.id ? goalIndex + 1 : goals.length;
    for (let i = 0; i < limit; i++) if (goals[i].scorerId === scorerId) count++;
  });
  return count;
}

// Statistiques individuelles cumulées à partir des feuilles de match.
// `everyone` : { id: { player, team } } pour retrouver l'équipe actuelle d'un joueur ; un joueur
// parti (échange, marché) garde ses statistiques, rattachées à sa dernière équipe connue.
export function aggregateStats(games, teamsById, everyone, seedTeams = []) {
  const stats = {};
  const entry = (id, team) => {
    if (!stats[id]) stats[id] = { g: 0, a: 0, pts: 0, hits: 0, pim: 0, shots: 0, plusMinus: 0, blocks: 0, faceoffWins: 0, gp: 0, gwg: 0, w: 0, player: everyone[id]?.player || { id, name: "?", pos: "?" }, team: everyone[id]?.team || team };
    return stats[id];
  };
  seedTeams.forEach((t) => t.roster.forEach((p) => entry(p.id, t)));
  games.filter((g) => g.played).forEach((g) => {
    [[g.box.home, teamsById[g.home]], [g.box.away, teamsById[g.away]]].forEach(([box, team]) => {
      Object.entries(box.toiBy || {}).forEach(([id, toi]) => { if (toi > 0) entry(id, team).gp++; });
      const add = (field, key) => Object.entries(box[field] || {}).forEach(([id, c]) => { entry(id, team)[key] += c; });
      add("goalsBy", "g"); add("assistsBy", "a"); add("hitsBy", "hits"); add("pimBy", "pim"); add("shotsBy", "shots");
      add("plusMinusBy", "plusMinus"); add("blocksBy", "blocks"); add("faceoffsWonBy", "faceoffWins");
    });
    // But gagnant : le but qui donne au vainqueur un but de plus que le total final du perdant.
    const winSide = g.homeScore > g.awayScore ? "home" : "away";
    const loserGoals = Math.min(g.homeScore, g.awayScore);
    const goals = (g.box.goalLog || []).filter((e) => e.side === winSide && e.type !== "SO");
    const gw = goals[loserGoals];
    if (gw?.scorerId) entry(gw.scorerId, teamsById[g[winSide]]).gwg++;
    // Victoire créditée au gardien partant du côté vainqueur (simplification : pas de relève).
    const winnerGoalieId = winSide === "home" ? g.box.homeGoalie?.playerId : g.box.awayGoalie?.playerId;
    if (winnerGoalieId) entry(winnerGoalieId, teamsById[g[winSide]]).w++;
  });
  Object.values(stats).forEach((s) => (s.pts = s.g + s.a));
  return stats;
}

export function leadersOf(stats) {
  return Object.values(stats).filter((s) => s.player.pos !== "G" && s.gp > 0).sort((a, b) => b.pts - a.pts || b.g - a.g);
}

const clamp10 = (v) => Math.max(0, Math.min(10, v));
const round1 = (v) => Math.round(v * 10) / 10;
// Cote de performance sur 10 (offensive/défensive/générale), utile en présaison pour juger les
// matchs préparatoires avant que la saison régulière ne compte pour vrai (voir App.jsx
// preseasonRatings) : dérivée des statistiques déjà accumulées (aggregateStats), ramenées par
// match joué. 5/10 = rendement moyen ; les gardiens (aucun suivi des arrêts par joueur pour
// l'instant, seulement la victoire créditée au partant) sont notés uniquement sur leur fiche de
// décisions.
export function ratingsOf(stats) {
  return Object.values(stats).filter((s) => s.gp > 0).map((s) => {
    if (s.player.pos === "G") {
      const winPct = s.w / s.gp;
      const def = clamp10(5 + (winPct - 0.5) * 6);
      return { player: s.player, team: s.team, gp: s.gp, off: null, def: round1(def), overall: round1(def) };
    }
    const off = clamp10(5 + (s.g / s.gp) * 3 + (s.a / s.gp) * 1.8 + (s.shots / s.gp) * 0.3);
    const def = clamp10(5 + (s.plusMinus / s.gp) * 1.1 + (s.hits / s.gp) * 0.35 + (s.blocks / s.gp) * 0.4 - (s.pim / s.gp) * 0.25);
    return { player: s.player, team: s.team, gp: s.gp, off: round1(off), def: round1(def), overall: round1((off + def) / 2) };
  }).sort((a, b) => b.overall - a.overall);
}

const FWD_POS = ["C", "LW", "RW"], D_POS = ["LD", "RD"];
// Équipe de la semaine (façon FM) : les 3 attaquants et 2 défenseurs les plus productifs (points,
// puis buts) et le gardien le plus efficace (% d'arrêts, minimum 1 départ, victoires en
// départage) sur les 7 derniers jours de calendrier (jour réel du match, voir engine/calendar.js
// gameDay). Retourne null tant qu'aucun match n'a été joué cette semaine-là.
export function teamOfTheWeek(schedule, seasonYear, currentDay, teamsById, everyone) {
  const weekStart = currentDay - 6;
  const weekGames = schedule.filter((g) => g.played && g.box && gameDay(seasonYear, g) >= weekStart && gameDay(seasonYear, g) <= currentDay);
  if (weekGames.length === 0) return null;
  const stats = aggregateStats(weekGames, teamsById, everyone);
  const skaters = Object.values(stats).filter((s) => s.gp > 0 && s.player.pos !== "G");
  const byPts = (a, b) => b.pts - a.pts || b.g - a.g;
  const forwards = skaters.filter((s) => FWD_POS.includes(s.player.pos)).sort(byPts).slice(0, 3);
  const defense = skaters.filter((s) => D_POS.includes(s.player.pos)).sort(byPts).slice(0, 2);
  const goalieTotals = {};
  weekGames.forEach((g) => {
    [[g.box.homeGoalie, teamsById[g.home]], [g.box.awayGoalie, teamsById[g.away]]].forEach(([gl, team]) => {
      if (!gl?.playerId) return;
      const e = (goalieTotals[gl.playerId] ||= { saves: 0, shotsAgainst: 0, gp: 0, w: 0, player: everyone[gl.playerId]?.player, team });
      e.saves += gl.saves || 0; e.shotsAgainst += gl.shotsAgainst || 0; e.gp++;
    });
    const winSide = g.homeScore > g.awayScore ? "home" : "away";
    const wGoalie = winSide === "home" ? g.box.homeGoalie : g.box.awayGoalie;
    if (wGoalie?.playerId && goalieTotals[wGoalie.playerId]) goalieTotals[wGoalie.playerId].w++;
  });
  const goalie = Object.values(goalieTotals).filter((g) => g.player).sort((a, b) => (b.shotsAgainst ? b.saves / b.shotsAgainst : 0) - (a.shotsAgainst ? a.saves / a.shotsAgainst : 0) || b.w - a.w)[0] || null;
  if (forwards.length < 3 || defense.length < 2 || !goalie) return null;
  return { forwards, defense, goalie, weekStart, weekEnd: currentDay };
}
