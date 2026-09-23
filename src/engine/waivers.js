import { payroll, fitsUnderCap, ROSTER_MAX } from "./cap";

// Ballottage (version simplifiée des règles de la LNH) :
//  - un joueur de 23 ans ou plus (ou ayant joué 160 matchs et plus) doit passer au ballottage
//    avant d'être envoyé au club-école ; les plus jeunes en sont exemptés ;
//  - il reste 24 heures (1 jour) au ballottage ; les autres équipes peuvent le réclamer
//    avec son contrat, par ordre de priorité : pire classement d'abord ;
//  - non réclamé, il rejoint le club-école de son équipe.
export const WAIVER_DAYS = 1;

export function waiverExempt(player, careerGames = 0) {
  return player.age <= 22 && careerGames < 160;
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
export function resolveWaivers(waivers, day, teams, priority, myTeamId, myClaims, year) {
  const byId = Object.fromEntries(teams.map((t) => [t.id, t]));
  const remaining = [], results = [];
  waivers.forEach((w) => {
    if (w.expiresDay > day) { remaining.push(w); return; }
    const claimer = priority.find((id) => {
      if (id === w.fromTeamId || !byId[id]) return false;
      if (id === myTeamId) return myClaims.has(w.player.id) && byId[id].roster.length < ROSTER_MAX && fitsUnderCap(byId[id].roster, year, w.player.contract?.salary || 0);
      return aiWantsClaim(byId[id], w.player, year);
    });
    results.push({ ...w, claimedBy: claimer || null });
  });
  return { remaining, results };
}

// Les équipes de l'ordinateur au-delà de 23 joueurs placent leurs joueurs superflus au ballottage.
export function aiWaiverCandidates(team, day) {
  const extra = team.roster.length - ROSTER_MAX;
  if (extra <= 0) return [];
  return [...team.roster].filter((p) => !waiverExempt(p)).sort((a, b) => a.ovr - b.ovr).slice(0, extra).map((p) => placeOnWaivers(p, team.id, day));
}

export { payroll };

// Mouvements d'effectif des équipes de l'ordinateur (chaque mois) : parfois, une équipe place
// son joueur le plus faible (non exempté) au ballottage et rappelle son meilleur espoir du
// club-école à la même position. C'est la principale source de joueurs à réclamer.
export function aiMonthlyMoves(teams, farmByTeam, myTeamId, day, rng, chance = 0.2) {
  const placed = [];
  const farm = { ...farmByTeam };
  const nextTeams = teams.map((t) => {
    if (t.id === myTeamId || rng() >= chance) return t;
    const candidates = t.roster.filter((p) => p.pos !== "G" && !waiverExempt(p)).sort((a, b) => a.ovr - b.ovr);
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
