// Statistiques individuelles cumulées à partir des feuilles de match.
// `everyone` : { id: { player, team } } pour retrouver l'équipe actuelle d'un joueur ; un joueur
// parti (échange, marché) garde ses statistiques, rattachées à sa dernière équipe connue.
export function aggregateStats(games, teamsById, everyone, seedTeams = []) {
  const stats = {};
  const entry = (id, team) => {
    if (!stats[id]) stats[id] = { g: 0, a: 0, pts: 0, hits: 0, pim: 0, shots: 0, plusMinus: 0, blocks: 0, faceoffWins: 0, gp: 0, gwg: 0, player: everyone[id]?.player || { id, name: "?", pos: "?" }, team: everyone[id]?.team || team };
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
  });
  Object.values(stats).forEach((s) => (s.pts = s.g + s.a));
  return stats;
}

export function leadersOf(stats) {
  return Object.values(stats).filter((s) => s.player.pos !== "G" && s.gp > 0).sort((a, b) => b.pts - a.pts || b.g - a.g);
}
