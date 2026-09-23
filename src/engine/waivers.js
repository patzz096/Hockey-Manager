import { payroll, fitsUnderCap, ROSTER_MAX } from "./cap";

// Ballottage (règles de la LNH, article 13 de la convention collective, table simplifiée) :
//  - un joueur est exempté tant qu'il n'a pas dépassé NI le nombre de saisons NI le nombre de
//    matchs LNH prévus selon son âge à la signature de son premier contrat (voir EXEMPTION) ;
//  - sinon, il passe 24 heures au ballottage avant d'aller au club-école ; les autres équipes
//    peuvent le réclamer avec son contrat, priorité au pire classement ;
//  - non réclamé, il rejoint le club-école de son équipe.
export const WAIVER_DAYS = 1;

// Âge à la signature → [saisons, matchs] d'exemption (patineurs ; gardiens entre parenthèses
// dans la convention : plus de saisons, moins de matchs).
export const EXEMPTION = {
  skater: { 18: [3, 160], 19: [3, 160], 20: [3, 160], 21: [3, 80], 22: [3, 70], 23: [3, 60], 24: [2, 60], 25: [1, 0] },
  goalie: { 18: [4, 80], 19: [4, 60], 20: [4, 60], 21: [3, 60], 22: [3, 60], 23: [3, 60], 24: [2, 60], 25: [1, 0] },
};

// Données de signature d'un joueur : fournies (repêchés, signés dans le jeu) ou estimées à partir
// de l'âge pour les alignements de départ (un joueur de 20 ans « a signé » à 18-20 ans, etc.).
export function signingInfo(player, seasonYear) {
  if (player.signedAge != null && player.signedYear != null) return { signedAge: player.signedAge, signedYear: player.signedYear };
  const signedAge = Math.max(18, Math.min(player.age, player.age <= 22 ? player.age - 1 : 22));
  return { signedAge, signedYear: seasonYear - (player.age - signedAge) };
}

export function waiverExemption(player, careerGames = 0, seasonYear = 2026) {
  const { signedAge, signedYear } = signingInfo(player, seasonYear);
  const table = player.pos === "G" ? EXEMPTION.goalie : EXEMPTION.skater;
  const [seasons, games] = table[Math.min(25, Math.max(18, signedAge))];
  const seasonsUsed = seasonYear - signedYear + 1;
  const exempt = seasonsUsed <= seasons && careerGames < games;
  return { exempt, seasons, games, seasonsUsed, careerGames, signedAge };
}

export function waiverExempt(player, careerGames = 0, seasonYear = 2026) {
  return waiverExemption(player, careerGames, seasonYear).exempt;
}

export function placeOnWaivers(player, fromTeamId, day) {
  return { player, fromTeamId, placedDay: day, expiresDay: day + WAIVER_DAYS };
}

// Intérêt d'une équipe de l'ordinateur : le joueur doit être meilleur que son pire joueur à
// cette position, tenir sous le plafond et laisser une place dans l'alignement.
export function aiWantsClaim(team, player, year) {
  if (team.roster.length >= ROSTER_MAX) return false;
  if (!fitsUnderCap(team.roster, year, player.contract?.salary || 0)) return false;
  const same = team.roster.filter((p) => p.pos === player.pos);
  if (same.length === 0) return true;
  return player.ovr > Math.min(...same.map((p) => p.ovr)) + 1;
}

// Résout les ballottages échus. priority : identifiants d'équipes du pire au meilleur classement.
// myClaims : ensemble des joueurs réclamés par l'usager. Renvoie les attributions.
export function resolveWaivers(waivers, day, teams, priority, myTeamId, myClaims, year, myCapOpts = {}) {
  const byId = Object.fromEntries(teams.map((t) => [t.id, t]));
  const remaining = [], results = [];
  waivers.forEach((w) => {
    if (w.expiresDay > day) { remaining.push(w); return; }
    const claimer = priority.find((id) => {
      if (id === w.fromTeamId || !byId[id]) return false;
      if (id === myTeamId) return myClaims.has(w.player.id) && byId[id].roster.filter((p) => !(myCapOpts.ltirIds || []).includes(p.id)).length < ROSTER_MAX && fitsUnderCap(byId[id].roster, year, w.player.contract?.salary || 0, 0, myCapOpts);
      return aiWantsClaim(byId[id], w.player, year);
    });
    results.push({ ...w, claimedBy: claimer || null });
  });
  return { remaining, results };
}

// Les équipes de l'ordinateur au-delà de 23 joueurs placent leurs joueurs superflus au ballottage.
export function aiWaiverCandidates(team, day, year = 2026) {
  const extra = team.roster.length - ROSTER_MAX;
  if (extra <= 0) return [];
  return [...team.roster].filter((p) => !waiverExempt(p, 0, year)).sort((a, b) => a.ovr - b.ovr).slice(0, extra).map((p) => placeOnWaivers(p, team.id, day));
}

export { payroll };

// Mouvements d'effectif des équipes de l'ordinateur (chaque mois) : parfois, une équipe place
// son joueur le plus faible (non exempté) au ballottage et rappelle son meilleur espoir du
// club-école à la même position. C'est la principale source de joueurs à réclamer.
export function aiMonthlyMoves(teams, farmByTeam, myTeamId, day, rng, chance = 0.2, year = 2026) {
  const placed = [];
  const farm = { ...farmByTeam };
  const nextTeams = teams.map((t) => {
    if (t.id === myTeamId || rng() >= chance) return t;
    const candidates = t.roster.filter((p) => p.pos !== "G" && !waiverExempt(p, 0, year)).sort((a, b) => a.ovr - b.ovr);
    const out = candidates[0];
    if (!out) return t;
    const pool = (farm[t.id] || []).filter((p) => p.pos === out.pos).sort((a, b) => b.ovr - a.ovr);
    const up = pool[0];
    placed.push(placeOnWaivers(out, t.id, day));
    let roster = t.roster.filter((p) => p.id !== out.id);
    if (up) {
      farm[t.id] = farm[t.id].filter((p) => p.id !== up.id);
      roster = [...roster, { ...up, level: undefined }];
    }
    return { ...t, roster: roster.sort((a, b) => b.ovr - a.ovr) };
  });
  return { teams: nextTeams, farmByTeam: farm, placed };
}
