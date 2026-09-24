import { OFFENSIVE, DEFENSIVE, GOALIE_TECH, avg } from "./attributes";
import { FORWARD_BONUS, DEFENSE_BONUS, lineInfo } from "./lines";
import { poisson, weightedPick } from "./random";
import { roleMods } from "./roles";
import { unitsForSim } from "./specialTeams";
import { DEFAULT_STRATEGY, computeStrategyFits, getStrategyMultipliers, shooterMods } from "./strategy";

// ---------------------------------------------------------------------------------------
// Modèle de match : tout découle des tirs, pour que la feuille de match soit cohérente.
//  1. Volume de tirs à forces égales : attaque de l'équipe contre défense adverse, puis
//     stratégies (volume pour / contre).
//  2. Chaque tir devient un but avec une probabilité qui dépend de la finition des tireurs
//     contre le gardien adverse, puis des stratégies (qualité pour / contre).
//  3. Les avantages numériques viennent des punitions adverses ; mêmes étapes pour l'unité AN.
//  4. Les tirs sont répartis entre les joueurs, et chaque but est attribué à un joueur qui a
//     tiré (donc jamais plus de buts que de tirs). Corsi = tirs + tirs ratés + tirs bloqués.
// Calibrage (vérifié par tests/simulation-calibration.test.js) : ~30 tirs et ~3 buts par
// équipe, % d'arrêts ~.905, AN ~20 %, et une équipe qui domine aux tirs gagne plus souvent.
// ---------------------------------------------------------------------------------------
export const SIM = {
  esShots: 24.5,       // tirs à forces égales par équipe et par match, à forces égales
  shotExp: 1.8,        // sensibilité du volume de tirs à l'écart attaque / défense
  esGoalProb: 0.107,   // probabilité qu'un tir à forces égales soit un but
  finishExp: 1.6,      // sensibilité à l'écart finition / gardien
  ppShotsPerOpp: 1.8,  // tirs par avantage numérique
  ppGoalProb: 0.105,
  shShotsPerOpp: 0.25, // tirs en désavantage numérique, par punition écopée
  shGoalProb: 0.10,
  homeEdge: 1.08,      // avantage de la glace (volume de tirs)
  missedRate: 0.40,    // tirs ratés par tir cadré
  blockRate: 0.36,     // tirs bloqués par tir cadré (modulé par le blocage adverse)
};

export function weightedAvg(players, valueFn, weightFn) {
  let wsum = 0, vsum = 0;
  players.forEach((p) => { const w = weightFn(p); wsum += w; vsum += valueFn(p) * w; });
  return wsum > 0 ? vsum / wsum : 60;
}

export function teamStrength(team, lines, staff) {
  const safeLines = lines || { forwards: [], defense: [], goalies: {} };
  const skaters = team.roster.filter((p) => p.pos !== "G");
  const D = team.roster.filter((p) => p.pos === "LD" || p.pos === "RD");
  const goalie = team.roster.find((p) => p.id === safeLines.goalies.starter) || team.roster.find((p) => p.pos === "G");
  let offense = weightedAvg(skaters, (p) => avg(p.attrs, OFFENSIVE), (p) => lineInfo(p.id, safeLines).bonus);
  const defenseSkaters = weightedAvg(D, (p) => avg(p.attrs, DEFENSIVE), (p) => lineInfo(p.id, safeLines).bonus);
  const goalieComposite = goalie ? avg(goalie.attrs, GOALIE_TECH) : 65;
  let defense = defenseSkaters * 0.45 + goalieComposite * 0.55;
  if (staff) {
    const coachMult = 1 + (((staff.headCoach?.rating || 50) - 50) / 50) * 0.06;
    const offMult = 1 + (((staff.assistantOff?.rating || 50) - 50) / 50) * 0.05;
    const defMult = 1 + (((staff.assistantDef?.rating || 50) - 50) / 50) * 0.05;
    offense *= coachMult * offMult;
    defense *= coachMult * defMult;
  }
  return { offense, defense };
}

// Cotes d'équipe utilisées par le modèle de tirs (pondérées par le temps de glace des trios).
export function teamRatings(team, lines, staff) {
  const safeLines = lines || { forwards: [], defense: [], goalies: {} };
  const skaters = team.roster.filter((p) => p.pos !== "G");
  const bonus = (p) => lineInfo(p.id, safeLines).bonus;
  const isD = (p) => p.pos === "LD" || p.pos === "RD";
  const goalie = team.roster.find((p) => p.id === safeLines.goalies.starter) || team.roster.find((p) => p.pos === "G");
  // Rôles demandés : un franc-tireur ou un défenseur offensif pèse plus en attaque, un défenseur
  // défensif ou un attaquant d'énergie plus en défense ; un joueur mal adapté à son rôle perd en efficacité.
  const rm = (p) => roleMods(safeLines, p);
  let attack = weightedAvg(skaters, (p) => avg(p.attrs, OFFENSIVE) * rm(p).attack, bonus);
  let defense = weightedAvg(skaters, (p) => avg(p.attrs, DEFENSIVE) * rm(p).defense, (p) => bonus(p) * (isD(p) ? 1.6 : 1));
  let finish = weightedAvg(skaters, (p) => offenseSkillScore(p) * rm(p).finish, bonus);
  const goalieQ = goalie ? avg(goalie.attrs, GOALIE_TECH) : 60;
  if (staff) {
    const coach = 1 + (((staff.headCoach?.rating || 50) - 50) / 50) * 0.03;
    attack *= coach * (1 + (((staff.assistantOff?.rating || 50) - 50) / 50) * 0.025);
    finish *= 1 + (((staff.assistantOff?.rating || 50) - 50) / 50) * 0.015;
    defense *= coach * (1 + (((staff.assistantDef?.rating || 50) - 50) / 50) * 0.025);
  }
  return { attack, defense, finish, goalieQ, goalie };
}

export function unitRating(ids, roster, keys) {
  const players = (ids || []).map((id) => roster.find((p) => p.id === id)).filter(Boolean);
  if (players.length === 0) return 60;
  return players.reduce((a, p) => a + avg(p.attrs, keys), 0) / players.length;
}

// Moyenne des unités spéciales d'une équipe, pondérée par leur temps de glace : cote (attributs
// `keys`) et effets du système.
function mixUnits(units, keys, neutral) {
  const out = { rating: 60, fx: { ...neutral } };
  const total = units.reduce((a, u) => a + u.share, 0);
  if (!total) return out;
  out.rating = units.reduce((a, u) => a + u.share * u.members.reduce((b, m) => b + avg(m.p.attrs, keys), 0) / u.members.length, 0) / total;
  Object.keys(neutral).forEach((k) => { out.fx[k] = units.reduce((a, u) => a + u.share * u.fx[k], 0) / total; });
  return out;
}

export function penaltyPropensity(p) { return (p.attrs.aggressiveness + p.attrs.hitting + (100 - p.attrs.temperament)) / 3; }

export function teamPenaltyLambda(team, penMult) {
  const skaters = team.roster.filter((p) => p.pos !== "G");
  const avgProp = skaters.reduce((a, p) => a + penaltyPropensity(p), 0) / skaters.length;
  return Math.max(1, Math.min(8, 3.0 * penMult * (avgProp / 60)));
}

export function assignPenalties(team, count, rng) {
  const skaters = team.roster.filter((p) => p.pos !== "G");
  const weights = skaters.map((p) => Math.pow(penaltyPropensity(p), 1.5));
  const pimBy = {};
  for (let i = 0; i < count; i++) { const p = weightedPick(skaters, weights, rng); pimBy[p.id] = (pimBy[p.id] || 0) + 2; }
  return pimBy;
}

export const CHUNK_MIN = 5;

export const CHUNKS_PER_PERIOD = 4;

export const TOTAL_CHUNKS = 12;

function binomial(n, p, rng) { let k = 0; for (let i = 0; i < n; i++) if (rng() < p) k++; return k; }
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// Répartit `shots` tirs et `goals` buts entre les tireurs, puis les passes.
function distributeAttack(shooters, shots, goals, rng, weightOf, type, bonusOf = () => 1, passOf = () => 1) {
  const shotsBy = {}, goalsBy = {}, assistsBy = {}, events = [];
  if (shooters.length === 0) return { shotsBy, goalsBy, assistsBy, events };
  const weights = shooters.map(weightOf);
  for (let s = 0; s < shots; s++) { const p = weightedPick(shooters, weights, rng); shotsBy[p.id] = (shotsBy[p.id] || 0) + 1; }
  for (let g = 0; g < goals; g++) {
    // Seuls les joueurs ayant encore des tirs « non convertis » peuvent marquer.
    const candidates = shooters.filter((p) => (shotsBy[p.id] || 0) > (goalsBy[p.id] || 0));
    if (candidates.length === 0) break;
    const scorer = weightedPick(candidates, candidates.map((p) => ((shotsBy[p.id] || 0) - (goalsBy[p.id] || 0)) * skillPower(offenseSkillScore(p), 1.5)), rng);
    goalsBy[scorer.id] = (goalsBy[scorer.id] || 0) + 1;
    const roll = rng();
    const assistCount = roll < (type === "PP" ? 0.08 : 0.12) ? 0 : roll < 0.55 ? 1 : 2;
    const mates = shooters.filter((p) => p.id !== scorer.id);
    const passW = mates.map((p) => skillPower(playmakingScore(p), 1.8) * bonusOf(p) * passOf(p));
    const chosen = new Set();
    for (let a = 0; a < assistCount && chosen.size < mates.length; a++) {
      let pick, tries = 0;
      do { pick = weightedPick(mates, passW, rng); tries++; } while (chosen.has(pick.id) && tries < 10);
      if (!chosen.has(pick.id)) { chosen.add(pick.id); assistsBy[pick.id] = (assistsBy[pick.id] || 0) + 1; }
    }
    events.push({ scorerId: scorer.id, assistIds: [...chosen], type });
  }
  return { shotsBy, goalsBy, assistsBy, events };
}

function generateHits(team, lines, rng, scale) {
  // Le rôle module la fréquence des mises en échec (attaquant d'énergie, de puissance…).
  const hitsBy = {};
  team.roster.filter((p) => p.pos !== "G").forEach((p) => {
    const lambda = (0.3 + Math.pow(p.attrs.hitting / 99, 1.6) * 3.6) * lineInfo(p.id, lines).bonus * roleMods(lines, p).hit * scale;
    const h = poisson(Math.max(0.05, lambda), rng);
    if (h > 0) hitsBy[p.id] = h;
  });
  return hitsBy;
}

// Attaque d'une équipe pendant un segment de match (scale = fraction de 60 minutes).
function simulateAttack(team, lines, rt, oppRt, strat, oppStrat, oppTeam, oppLines, ppOpps, pkOpps, rng, scale, isHome) {
  const skaters = team.roster.filter((p) => p.pos !== "G");
  const bonusOf = (p) => lineInfo(p.id, lines).bonus;
  const mods = shooterMods(lines.strategy);
  const isD = (p) => p.pos === "LD" || p.pos === "RD";

  const shotRatio = Math.pow(rt.attack / oppRt.defense, SIM.shotExp);
  const esLambda = SIM.esShots * scale * shotRatio * strat.vol * oppStrat.volA * (isHome ? SIM.homeEdge : 1);
  const esShots = poisson(Math.max(0.05, esLambda), rng);
  const esProb = clamp(SIM.esGoalProb * Math.pow(rt.finish / oppRt.goalieQ, SIM.finishExp) * strat.q * oppStrat.qA, 0.03, 0.2);
  const esGoals = binomial(esShots, esProb, rng);
  const es = distributeAttack(skaters, esShots, esGoals, rng, (p) => skillPower(offenseSkillScore(p) + p.attrs.hitting * mods.hitting + p.attrs.strength * mods.strength) * bonusOf(p) * (isD(p) ? mods.defenseBoost : 1) * roleMods(lines, p).shoot, "ES", bonusOf, (p) => roleMods(lines, p).pass);

  // Avantage numérique : chaque unité joue sa part du temps contre le désavantage adverse.
  // Le système (1-3-1, parapluie…) et l'adéquation de l'unité modulent tirs et qualité ;
  // le poste de chaque joueur décide qui tire et qui passe.
  const ppUnits = unitsForSim(team, lines, "pp");
  const pkMix = mixUnits(unitsForSim(oppTeam, oppLines, "pk"), DEFENSIVE, { volA: 1, qA: 1, sh: 1 });
  const pp = { shots: 0, shotsBy: {}, goalsBy: {}, assistsBy: {}, events: [] };
  if (ppOpps > 0) ppUnits.forEach((u) => {
    const players = u.members.map((m) => m.p);
    const slotOf = new Map(u.members.map((m) => [m.p.id, m.slot]));
    const ratio = players.reduce((a, p) => a + avg(p.attrs, OFFENSIVE), 0) / players.length / pkMix.rating;
    const shots = poisson(ppOpps * u.share * SIM.ppShotsPerOpp * Math.pow(ratio, 1.5) * u.fx.vol * pkMix.fx.volA, rng);
    const finish = players.reduce((a, p) => a + offenseSkillScore(p), 0) / players.length;
    const prob = clamp(SIM.ppGoalProb * Math.pow(finish / oppRt.goalieQ, 2) * Math.pow(ratio, 0.8) * u.fx.q * pkMix.fx.qA, 0.05, 0.3);
    const r = distributeAttack(players, shots, binomial(shots, prob, rng), rng, (p) => skillPower(offenseSkillScore(p)) * roleMods(lines, p).shoot * slotOf.get(p.id).shoot, "PP", () => 1, (p) => roleMods(lines, p).pass * slotOf.get(p.id).pass);
    pp.shots += shots; mergeCount(pp.shotsBy, r.shotsBy); mergeCount(pp.goalsBy, r.goalsBy); mergeCount(pp.assistsBy, r.assistsBy); pp.events.push(...r.events);
  });

  // Désavantage numérique : chances de marquer en infériorité (pression agressive, contre-attaques).
  const pkUnits = unitsForSim(team, lines, "pk");
  const myPk = mixUnits(pkUnits, DEFENSIVE, { volA: 1, qA: 1, sh: 1 });
  const oppPp = mixUnits(unitsForSim(oppTeam, oppLines, "pp"), OFFENSIVE, { vol: 1, q: 1, shA: 1 });
  const shShots = pkOpps > 0 && pkUnits.length ? poisson(pkOpps * SIM.shShotsPerOpp * myPk.fx.sh * oppPp.fx.shA, rng) : 0;
  const pkPlayers = pkUnits.flatMap((u) => u.members);
  const pkSlot = new Map(pkPlayers.map((m) => [m.p.id, m.slot]));
  const shProb = clamp(SIM.shGoalProb * Math.pow(rt.finish / oppRt.goalieQ, 1.5), 0.05, 0.3);
  const sh = distributeAttack(pkPlayers.map((m) => m.p), shShots, binomial(shShots, shProb, rng), rng, (p) => skillPower(offenseSkillScore(p)) * pkSlot.get(p.id).shoot, "SH");

  const shotsBy = { ...es.shotsBy }; mergeCount(shotsBy, pp.shotsBy); mergeCount(shotsBy, sh.shotsBy);
  const goalsBy = { ...es.goalsBy }; mergeCount(goalsBy, pp.goalsBy); mergeCount(goalsBy, sh.goalsBy);
  const assistsBy = { ...es.assistsBy }; mergeCount(assistsBy, pp.assistsBy); mergeCount(assistsBy, sh.assistsBy);
  return {
    shots: esShots + pp.shots + shShots, goals: es.events.length + pp.events.length + sh.events.length, ppGoals: pp.events.length, shGoals: sh.events.length,
    shotsBy, goalsBy, assistsBy, esEvents: es.events, events: [...es.events, ...pp.events, ...sh.events],
    hitsBy: generateHits(team, lines, rng, scale),
  };
}

// Place les buts dans le temps : minute aléatoire dans le segment, triés chronologiquement.
function timeline(events, rng, startMin, lengthMin) {
  return events
    .map((e) => ({ ...e, minute: startMin + rng() * lengthMin }))
    .sort((a, b) => a.minute - b.minute)
    .map((e) => ({ ...e, period: Math.min(3, Math.floor(e.minute / 20) + 1) }));
}

// Simule un segment (match complet : scale 1 ; tranche du direct : 5/60).
function simulateSegment(home, away, linesHome, linesAway, staffByTeam, rng, scale, startMin, lead = 0) {
  const stratHome = scoreEffect(getStrategyMultipliers(linesHome.strategy || DEFAULT_STRATEGY, computeStrategyFits(home, linesHome), linesHome.mentality), lead, startMin);
  const stratAway = scoreEffect(getStrategyMultipliers(linesAway.strategy || DEFAULT_STRATEGY, computeStrategyFits(away, linesAway), linesAway.mentality), -lead, startMin);
  const rtH = teamRatings(home, linesHome, staffByTeam[home.id]);
  const rtA = teamRatings(away, linesAway, staffByTeam[away.id]);

  const homePen = poisson(Math.max(0.02, teamPenaltyLambda(home, stratHome.pen) * scale), rng);
  const awayPen = poisson(Math.max(0.02, teamPenaltyLambda(away, stratAway.pen) * scale), rng);
  const homePimBy = assignPenalties(home, homePen, rng);
  const awayPimBy = assignPenalties(away, awayPen, rng);

  const H = simulateAttack(home, linesHome, rtH, rtA, stratHome, stratAway, away, linesAway, awayPen, homePen, rng, scale, true);
  const A = simulateAttack(away, linesAway, rtA, rtH, stratAway, stratHome, home, linesHome, homePen, awayPen, rng, scale, false);

  const goalLog = timeline([
    ...H.events.map((e) => ({ ...e, side: "home" })),
    ...A.events.map((e) => ({ ...e, side: "away" })),
  ], rng, startMin, 60 * scale);

  const faceoffs = simulateFaceoffs(home, away, rng, scale, linesHome, linesAway);
  const shotMetrics = simulateBlocksAndCorsi(H.shots, A.shots, home, away, rng, linesHome, linesAway);
  const homePM = {}, awayPM = {};
  applyPlusMinus(H.esEvents, linesHome, linesAway, rng, homePM, awayPM);
  applyPlusMinus(A.esEvents, linesAway, linesHome, rng, awayPM, homePM);

  const side = (X, pimBy, pens, fo, foBy, corsi, blocksBy, pm, toiBy) => ({
    goalsBy: X.goalsBy, assistsBy: X.assistsBy, hitsBy: X.hitsBy, shotsBy: X.shotsBy, events: X.events,
    pimBy, ppGoals: X.ppGoals, shGoals: X.shGoals, penalties: pens, shots: X.shots, corsiFor: corsi,
    faceoffsWon: fo, faceoffsTotal: faceoffs.total, faceoffsWonBy: foBy, blocksBy, plusMinusBy: pm, toiBy,
  });
  return {
    homeGoals: H.goals, awayGoals: A.goals, goalLog,
    home: side(H, homePimBy, homePen, faceoffs.homeWins, faceoffs.homeWinsBy, shotMetrics.homeCorsiFor, shotMetrics.homeBlocksBy, homePM, computeTOI(linesHome, rng, scale)),
    away: side(A, awayPimBy, awayPen, faceoffs.awayWins, faceoffs.awayWinsBy, shotMetrics.awayCorsiFor, shotMetrics.awayBlocksBy, awayPM, computeTOI(linesAway, rng, scale)),
    homeGoalieLine: { playerId: rtH.goalie?.id, saves: A.shots - A.goals, shotsAgainst: A.shots },
    awayGoalieLine: { playerId: rtA.goalie?.id, saves: H.shots - H.goals, shotsAgainst: H.shots },
    rtH, rtA,
  };
}

// Effet de pointage : l'équipe menée pousse (plus de tirs), celle qui mène protège son avance.
// lead = avance de l'équipe (négatif si elle tire de l'arrière) ; plus marqué en 3e période.
function scoreEffect(strat, lead, minute) {
  if (lead === 0) return strat;
  const late = minute >= 40 ? 1.3 : 1;
  const size = Math.min(Math.abs(lead), 3);
  const k = (lead > 0 ? -1 : 1) * size * 0.025 * late;
  return { ...strat, vol: strat.vol * (1 + k), q: strat.q * (lead > 0 ? 1 - size * 0.02 : 1), volA: strat.volA * (1 - k * 0.3) };
}

export function simulateChunk(home, away, linesHome, linesAway, staffByTeam, chunkIndex, rng, score = { home: 0, away: 0 }) {
  return simulateStretch(home, away, linesHome, linesAway, staffByTeam, (chunkIndex - 1) * CHUNK_MIN, CHUNK_MIN, rng, score);
}

// Simule le jeu de la minute `startMin` pendant `lengthMin` minutes (mode direct).
export function simulateStretch(home, away, linesHome, linesAway, staffByTeam, startMin, lengthMin, rng, score = { home: 0, away: 0 }) {
  const seg = simulateSegment(home, away, linesHome, linesAway, staffByTeam, rng, lengthMin / 60, startMin, score.home - score.away);
  return { ...seg, periodHomeScore: seg.homeGoals, periodAwayScore: seg.awayGoals };
}

// Prochain arrêt de jeu en mode direct : au hockey, le sifflet ne tombe pas à heure fixe.
// Entre 1 min 30 et 7 min de jeu continu, jamais au-delà de la fin de la période.
const STOPPAGE_REASONS = ["Hors-jeu", "Dégagement refusé", "Arrêt du gardien", "Rondelle hors de la patinoire", "Filet déplacé", "Mise en échec illégale évitée de justesse, jeu arrêté", "Rondelle gelée le long de la bande"];
export function nextStoppage(minute, rng) {
  const periodEnd = (Math.floor(minute / 20) + 1) * 20;
  const at = Math.min(periodEnd, minute + 1.5 + rng() * 5.5);
  const end = periodEnd - at < 0.75 ? periodEnd : Math.round(at * 60) / 60;
  return { minute: end, reason: end === periodEnd ? "Fin de la période" : STOPPAGE_REASONS[Math.floor(rng() * STOPPAGE_REASONS.length)] };
}

// Prolongation (3 contre 3) puis, au besoin, tirs de barrage. La meilleure équipe a l'avantage.
// En prolongation, le but est attribué à un joueur (avec un tir) ; en tirs de barrage, le
// point est ajouté au score final sans être crédité à un joueur, comme dans la LNH.
export function resolveOvertime(home, away, linesHome, linesAway, staffByTeam, rng, { noShootout = false } = {}) {
  const rtH = teamRatings(home, linesHome, staffByTeam[home.id]);
  const rtA = teamRatings(away, linesAway, staffByTeam[away.id]);
  const edge = (rtH.attack * rtH.finish) / rtH.goalieQ - (rtA.attack * rtA.finish) / rtA.goalieQ;
  const pHome = clamp(0.52 + edge * 0.004, 0.3, 0.72);
  const winner = rng() < pHome ? "home" : "away";
  // En séries, la prolongation se poursuit jusqu'au but (pas de tirs de barrage).
  if (noShootout || rng() < 0.6) {
    const team = winner === "home" ? home : away, lines = winner === "home" ? linesHome : linesAway;
    const top = [lines.forwards[0]?.C, lines.forwards[0]?.LW, lines.forwards[0]?.RW, lines.defense[0]?.LD, lines.defense[0]?.RD, lines.forwards[1]?.C]
      .map((id) => team.roster.find((p) => p.id === id)).filter(Boolean);
    const pool = top.length ? top : team.roster.filter((p) => p.pos !== "G");
    const att = distributeAttack(pool, 1, 1, rng, (p) => skillPower(offenseSkillScore(p)), "OT");
    return { winner, shootout: false, event: { ...att.events[0], side: winner, period: 4, minute: 60 + rng() * 5 } };
  }
  return { winner, shootout: true, event: { side: winner, type: "SO", period: 5, minute: 65, assistIds: [] } };
}

// Ajoute le résultat de la prolongation à une feuille de match (copie).
export function applyOvertime(box, ot) {
  const next = { ...box, home: { ...box.home }, away: { ...box.away }, goalLog: [...box.goalLog, ot.event] };
  if (!ot.shootout) {
    const s = next[ot.winner];
    s.goalsBy = { ...s.goalsBy, [ot.event.scorerId]: (s.goalsBy[ot.event.scorerId] || 0) + 1 };
    s.shotsBy = { ...s.shotsBy, [ot.event.scorerId]: (s.shotsBy[ot.event.scorerId] || 0) + 1 };
    s.assistsBy = { ...s.assistsBy }; ot.event.assistIds.forEach((id) => { s.assistsBy[id] = (s.assistsBy[id] || 0) + 1; });
    s.shots += 1;
    s.corsiFor = (s.corsiFor || 0) + 1;
    const g = ot.winner === "home" ? "awayGoalie" : "homeGoalie";
    if (next[g]) next[g] = { ...next[g], shotsAgainst: next[g].shotsAgainst + 1 };
  }
  return next;
}

export function emptyLiveAccum() {
  return {
    home: { goalsBy: {}, assistsBy: {}, hitsBy: {}, shotsBy: {}, pimBy: {}, blocksBy: {}, plusMinusBy: {}, faceoffsWonBy: {}, toiBy: {}, ppGoals: 0, shGoals: 0, penalties: 0, shots: 0, corsiFor: 0, faceoffsWon: 0, faceoffsTotal: 0, saves: 0, shotsAgainst: 0 },
    away: { goalsBy: {}, assistsBy: {}, hitsBy: {}, shotsBy: {}, pimBy: {}, blocksBy: {}, plusMinusBy: {}, faceoffsWonBy: {}, toiBy: {}, ppGoals: 0, shGoals: 0, penalties: 0, shots: 0, corsiFor: 0, faceoffsWon: 0, faceoffsTotal: 0, saves: 0, shotsAgainst: 0 },
    goalLog: [],
  };
}

export function mergeLivePeriod(accum, periodResult) {
  const next = { home: { ...accum.home }, away: { ...accum.away }, goalLog: [...accum.goalLog, ...periodResult.goalLog] };
  ["goalsBy", "assistsBy", "hitsBy", "shotsBy", "pimBy", "blocksBy", "plusMinusBy", "faceoffsWonBy", "toiBy"].forEach((k) => {
    next.home[k] = { ...next.home[k] }; mergeCount(next.home[k], periodResult.home[k]);
    next.away[k] = { ...next.away[k] }; mergeCount(next.away[k], periodResult.away[k]);
  });
  ["ppGoals", "shGoals", "penalties", "shots", "corsiFor", "faceoffsWon", "faceoffsTotal"].forEach((k) => {
    next.home[k] = (next.home[k] || 0) + (periodResult.home[k] || 0);
    next.away[k] = (next.away[k] || 0) + (periodResult.away[k] || 0);
  });
  next.home.saves += periodResult.homeGoalieLine.saves; next.home.shotsAgainst += periodResult.homeGoalieLine.shotsAgainst;
  next.away.saves += periodResult.awayGoalieLine.saves; next.away.shotsAgainst += periodResult.awayGoalieLine.shotsAgainst;
  return next;
}

export function mergeCount(target, source) { Object.entries(source).forEach(([k, v]) => { target[k] = (target[k] || 0) + v; }); }

export function skillPower(val, exp = 2.2) { return Math.pow(Math.max(1, val) / 99, exp) * 100; }

export function offenseSkillScore(p) { return p.attrs.shotAccuracy * 0.30 + p.attrs.shotRange * 0.15 + p.attrs.puckhandling * 0.20 + p.attrs.offensiveRead * 0.20 + p.attrs.gettingOpen * 0.15; }

export function playmakingScore(p) { return p.attrs.passing * 0.6 + p.attrs.offensiveRead * 0.4; }

export function simulateFaceoffs(home, away, rng, scale = 1, linesHome = null, linesAway = null) {
  const homeC = home.roster.filter((p) => p.pos === "C");
  const awayC = away.roster.filter((p) => p.pos === "C");
  // Un centre deux sens bien adapté gagne plus de mises au jeu.
  const fo = (p, lines) => p.attrs.faceoffs + (lines ? roleMods(lines, p).faceoff : 0);
  const homeAvg = homeC.length ? homeC.reduce((a, p) => a + fo(p, linesHome), 0) / homeC.length : 50;
  const awayAvg = awayC.length ? awayC.reduce((a, p) => a + fo(p, linesAway), 0) / awayC.length : 50;
  const totalDraws = Math.max(1, Math.round((50 + rng() * 12) * scale));
  const homePct = Math.max(0.28, Math.min(0.72, homeAvg / (homeAvg + awayAvg)));
  let homeWins = 0;
  for (let i = 0; i < totalDraws; i++) if (rng() < homePct) homeWins++;
  const awayWins = totalDraws - homeWins;
  const distribute = (centers, total) => {
    const by = {};
    const weights = centers.map((p) => p.attrs.faceoffs);
    for (let i = 0; i < total; i++) { const c = weightedPick(centers, weights, rng); by[c.id] = (by[c.id] || 0) + 1; }
    return by;
  };
  return {
    total: totalDraws, homeWins, awayWins,
    homeWinsBy: homeC.length ? distribute(homeC, homeWins) : {},
    awayWinsBy: awayC.length ? distribute(awayC, awayWins) : {},
  };
}

export function simulateBlocksAndCorsi(homeShots, awayShots, home, away, rng, linesHome = null, linesAway = null) {
  const homeD = home.roster.filter((p) => p.pos === "LD" || p.pos === "RD");
  const awayD = away.roster.filter((p) => p.pos === "LD" || p.pos === "RD");
  const blockSkill = (D) => (D.length ? D.reduce((a, p) => a + p.attrs.shotBlocking, 0) / D.length / 99 : 0.6);
  const homeMissed = Math.round(homeShots * SIM.missedRate * (0.8 + rng() * 0.4));
  const awayMissed = Math.round(awayShots * SIM.missedRate * (0.8 + rng() * 0.4));
  const blockedByHome = Math.round(awayShots * SIM.blockRate * (0.6 + blockSkill(homeD)) * (0.85 + rng() * 0.3));
  const blockedByAway = Math.round(homeShots * SIM.blockRate * (0.6 + blockSkill(awayD)) * (0.85 + rng() * 0.3));
  const distributeBlocks = (D, count) => {
    if (D.length === 0 || count === 0) return {};
    const by = {};
    const lines = D === homeD ? linesHome : linesAway;
    const weights = D.map((p) => p.attrs.shotBlocking * (lines ? roleMods(lines, p).block : 1));
    for (let i = 0; i < count; i++) { const d = weightedPick(D, weights, rng); by[d.id] = (by[d.id] || 0) + 1; }
    return by;
  };
  return {
    homeCorsiFor: homeShots + homeMissed + blockedByAway,
    awayCorsiFor: awayShots + awayMissed + blockedByHome,
    homeBlocksBy: distributeBlocks(homeD, blockedByHome),
    awayBlocksBy: distributeBlocks(awayD, blockedByAway),
  };
}

export function pickOnIceLine(lines, rng) {
  const idx = weightedPick([0, 1, 2, 3], FORWARD_BONUS, rng);
  const l = lines.forwards[idx] || {};
  return [l.LW, l.C, l.RW].filter(Boolean);
}

export const FORWARD_TOI_BASE = [19, 16, 13, 10];

export const DEFENSE_TOI_BASE = [22, 18, 14];

export function computeTOI(lines, rng, scale = 1) {
  const toiBy = {};
  const shift = lines.shift;
  lines.forwards.forEach((l, i) => {
    // Mise en direct avec trio choisi : ce trio joue (presque) toute la mise au jeu, les autres restent au banc.
    const base = (shift ? (i === shift.forwardIdx ? scale * 60 * 0.85 : scale * 60 * 0.02) : FORWARD_TOI_BASE[i] * scale);
    [l.LW, l.C, l.RW].filter(Boolean).forEach((id) => { toiBy[id] = Math.max(shift ? 0 : 1, base + (rng() * 4 - 2) * scale); });
  });
  lines.defense.forEach((l, i) => {
    const base = (shift ? (i === shift.defenseIdx ? scale * 60 * 0.85 : scale * 60 * 0.02) : DEFENSE_TOI_BASE[i] * scale);
    [l.LD, l.RD].filter(Boolean).forEach((id) => { toiBy[id] = Math.max(shift ? 0 : 1, base + (rng() * 4 - 2) * scale); });
  });
  if (lines.goalies.starter) toiBy[lines.goalies.starter] = 60 * scale;
  if (lines.goalies.backup) toiBy[lines.goalies.backup] = 0;
  return toiBy;
}

// Choix de trio et de paire de l'ordinateur pour une mise au jeu, selon l'écart au score
// (positif = l'équipe mène) et le moment du match : protège une avance en fin de match avec
// une paire défensive, pousse en attaque quand elle tire de l'arrière.
export function aiPickShift(scoreDiff, minute, rng) {
  const late = minute >= 44;
  const fWeights = [0.34, 0.28, 0.22, 0.16];
  if (late && scoreDiff <= -1) { fWeights[0] += 0.22; fWeights[3] = Math.max(0.05, fWeights[3] - 0.12); }
  if (late && scoreDiff >= 1) { fWeights[3] += 0.12; fWeights[0] = Math.max(0.05, fWeights[0] - 0.1); }
  const dWeights = [0.44, 0.34, 0.22];
  if (late && scoreDiff >= 1) dWeights[0] += 0.15;
  return { forwardIdx: weightedPick([0, 1, 2, 3], fWeights, rng), defenseIdx: weightedPick([0, 1, 2], dWeights, rng) };
}

export function pickOnIcePair(lines, rng) {
  const idx = weightedPick([0, 1, 2], DEFENSE_BONUS, rng);
  const l = lines.defense[idx] || {};
  return [l.LD, l.RD].filter(Boolean);
}

export function applyPlusMinus(events, scoringLines, concedingLines, rng, scoringPM, concedingPM) {
  events.forEach((ev) => {
    const plusIds = [ev.scorerId, ...ev.assistIds];
    plusIds.forEach((id) => { scoringPM[id] = (scoringPM[id] || 0) + 1; });
    const minusIds = [...pickOnIceLine(concedingLines, rng), ...pickOnIcePair(concedingLines, rng)];
    minusIds.forEach((id) => { concedingPM[id] = (concedingPM[id] || 0) - 1; });
  });
}

export function simulateGame(game, teamsById, rng, linesByTeam, staffByTeam = {}, { playoff = false } = {}) {
  const home = teamsById[game.home], away = teamsById[game.away];
  const linesHome = linesByTeam[home.id], linesAway = linesByTeam[away.id];
  // Trois périodes simulées l'une après l'autre, pour appliquer l'effet de pointage.
  let accum = emptyLiveAccum();
  let homeScore = 0, awayScore = 0;
  for (let period = 0; period < 3; period++) {
    const seg = simulateSegment(home, away, linesHome, linesAway, staffByTeam, rng, 1 / 3, period * 20, homeScore - awayScore);
    accum = mergeLivePeriod(accum, seg);
    homeScore += seg.homeGoals; awayScore += seg.awayGoals;
  }
  const goalie = (lines, team) => team.roster.find((p) => p.id === lines.goalies.starter) || team.roster.find((p) => p.pos === "G");
  let box = {
    home: accum.home, away: accum.away, goalLog: accum.goalLog,
    homeGoalie: { playerId: goalie(linesHome, home)?.id, saves: accum.home.saves, shotsAgainst: accum.home.shotsAgainst },
    awayGoalie: { playerId: goalie(linesAway, away)?.id, saves: accum.away.saves, shotsAgainst: accum.away.shotsAgainst },
  };
  let decidedIn = "REG";
  if (homeScore === awayScore) {
    const ot = resolveOvertime(home, away, linesHome, linesAway, staffByTeam, rng, { noShootout: playoff });
    box = applyOvertime(box, ot);
    if (ot.winner === "home") homeScore++; else awayScore++;
    decidedIn = ot.shootout ? "SO" : "OT";
  }
  return { ...game, played: true, homeScore, awayScore, decidedIn, box };
}
