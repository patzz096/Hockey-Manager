// Classement selon le modèle de la LNH :
//  victoire = 2 pts · défaite en prolongation ou en tirs de barrage (DP) = 1 pt · défaite = 0.
// Départage (dans l'ordre) : points, % de points (moins de matchs joués), victoires en temps
// réglementaire (VR), victoires en temps réglementaire + prolongation (VRP), victoires,
// différentiel de buts, buts pour.
export const CONFERENCES = { Est: ["Atlantique", "Métropolitaine"], Ouest: ["Centrale", "Pacifique"] };
export function conferenceOf(division) {
  return Object.keys(CONFERENCES).find((c) => CONFERENCES[c].includes(division)) || "Est";
}

function emptyRecord(id) {
  return { id, gp: 0, w: 0, l: 0, otl: 0, pts: 0, rw: 0, row: 0, gf: 0, ga: 0, streak: "", homeW: 0, homeL: 0, homeOtl: 0, awayW: 0, awayL: 0, awayOtl: 0, last10: [] };
}

export function compareRecords(a, b) {
  const pct = (r) => (r.gp ? r.pts / (2 * r.gp) : 0);
  return b.pts - a.pts || pct(b) - pct(a) || b.rw - a.rw || b.row - a.row || b.w - a.w || (b.gf - b.ga) - (a.gf - a.ga) || b.gf - a.gf || a.id.localeCompare(b.id);
}

export function computeStandings(teams, games) {
  const table = Object.fromEntries(teams.map((t) => [t.id, emptyRecord(t.id)]));
  const played = games.filter((g) => g.played && !g.playoff);
  played.forEach((g) => {
    const h = table[g.home], a = table[g.away];
    if (!h || !a) return;
    const homeWon = g.homeScore > g.awayScore;
    const extra = g.decidedIn === "OT" || g.decidedIn === "SO";
    [[h, homeWon, "home", g.homeScore, g.awayScore], [a, !homeWon, "away", g.awayScore, g.homeScore]].forEach(([r, won, side, gf, ga]) => {
      r.gp++; r.gf += gf; r.ga += ga;
      let res;
      if (won) { r.w++; r.pts += 2; if (!extra) r.rw++; if (g.decidedIn !== "SO") r.row++; res = "V"; r[`${side}W`]++; }
      else if (extra) { r.otl++; r.pts += 1; res = "P"; r[`${side}Otl`]++; }
      else { r.l++; res = "D"; r[`${side}L`]++; }
      r.last10 = [...r.last10, res].slice(-10);
      const letter = res === "V" ? "V" : res === "P" ? "DP" : "D";
      const n = r.streak.startsWith(letter) && !(letter === "D" && r.streak.startsWith("DP")) ? parseInt(r.streak.slice(letter.length), 10) + 1 : 1;
      r.streak = `${letter}${n}`;
    });
  });
  return Object.values(table).map((r) => ({ ...r, pct: r.gp ? r.pts / (2 * r.gp) : 0, l10: last10Label(r.last10) })).sort(compareRecords);
}
function last10Label(list) {
  const w = list.filter((x) => x === "V").length, l = list.filter((x) => x === "D").length, o = list.filter((x) => x === "P").length;
  return `${w}-${l}-${o}`;
}

// Qualification aux séries (format LNH) : dans chaque association, les 3 premiers de chaque
// division + 2 équipes repêchées (meilleurs dossiers restants de l'association).
export function playoffSeeds(standings, teamsById) {
  const out = {};
  Object.entries(CONFERENCES).forEach(([conf, divisions]) => {
    const confRows = standings.filter((s) => conferenceOf(teamsById[s.id].division) === conf);
    const divTop = Object.fromEntries(divisions.map((d) => [d, confRows.filter((s) => teamsById[s.id].division === d).slice(0, 3)]));
    const qualified = new Set(Object.values(divTop).flat().map((s) => s.id));
    const wildcards = confRows.filter((s) => !qualified.has(s.id)).slice(0, 2);
    out[conf] = { divisions: divTop, wildcards, order: divisions };
  });
  return out;
}

// Étiquette de qualification pour le classement : y = champion de division, x = qualifié,
// w = équipe repêchée (wild card), e = éliminé (mathématiquement impossible non calculé ici).
export function qualificationMarks(standings, teamsById) {
  const seeds = playoffSeeds(standings, teamsById);
  const marks = {};
  Object.values(seeds).forEach((c) => {
    Object.values(c.divisions).forEach((list) => list.forEach((s, i) => { marks[s.id] = i === 0 ? "y" : "x"; }));
    c.wildcards.forEach((s) => { marks[s.id] = "w"; });
  });
  return marks;
}
