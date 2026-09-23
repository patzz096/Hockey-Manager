import { OFFENSIVE, DEFENSIVE, GOALIE_TECH, avg } from "./attributes";
import { FORWARD_BONUS, DEFENSE_BONUS, lineInfo } from "./lines";
import { poisson, weightedPick } from "./random";
import { DEFAULT_STRATEGY, computeTeamProfile, getStrategyMultipliers } from "./strategy";

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

export function goalieLine(goalie, goalsAgainst, rng, scale = 1) {
  const lambda = (16 + ((goalie?.attrs.reflexes || 70) / 99) * 16) * scale;
  const saves = poisson(Math.max(0.3, lambda), rng);
  return { playerId: goalie?.id, saves, shotsAgainst: saves + goalsAgainst };
}

export function unitRating(ids, roster, keys) {
  const players = (ids || []).map((id) => roster.find((p) => p.id === id)).filter(Boolean);
  if (players.length === 0) return 60;
  return players.reduce((a, p) => a + avg(p.attrs, keys), 0) / players.length;
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

export function simulateChunk(home, away, linesHome, linesAway, staffByTeam, chunkIndex, rng) {
  const SCALE = CHUNK_MIN / 60;
  const periodNum = Math.min(3, Math.ceil(chunkIndex / CHUNKS_PER_PERIOD));
  const stratHome = getStrategyMultipliers(linesHome.strategy || DEFAULT_STRATEGY, computeTeamProfile(home), linesHome.mentality);
  const stratAway = getStrategyMultipliers(linesAway.strategy || DEFAULT_STRATEGY, computeTeamProfile(away), linesAway.mentality);
  const hs = teamStrength(home, linesHome, staffByTeam[home.id]), as = teamStrength(away, linesAway, staffByTeam[away.id]);
  const leagueAvg = 74;
  const homeExpected = 2.75 * SCALE * (hs.offense / leagueAvg) * (leagueAvg / as.defense) * 1.06 * stratHome.own * stratAway.opp;
  const awayExpected = 2.75 * SCALE * (as.offense / leagueAvg) * (leagueAvg / hs.defense) * stratAway.own * stratHome.opp;
  const homeES = poisson(Math.max(0.04, homeExpected), rng);
  const awayES = poisson(Math.max(0.04, awayExpected), rng);

  const homePenCount = poisson(Math.max(0.025, teamPenaltyLambda(home, stratHome.pen) * SCALE), rng);
  const awayPenCount = poisson(Math.max(0.025, teamPenaltyLambda(away, stratAway.pen) * SCALE), rng);
  const homePimBy = assignPenalties(home, homePenCount, rng);
  const awayPimBy = assignPenalties(away, awayPenCount, rng);

  const homeGoalie = home.roster.find((p) => p.id === linesHome.goalies.starter) || home.roster.find((p) => p.pos === "G");
  const awayGoalie = away.roster.find((p) => p.id === linesAway.goalies.starter) || away.roster.find((p) => p.pos === "G");

  const homePPOpp = awayPenCount, awayPPOpp = homePenCount;
  const homePPOff = unitRating(linesHome.pp, home.roster, OFFENSIVE);
  const awayPKComposite = unitRating(linesAway.pk, away.roster, DEFENSIVE) * 0.7 + (awayGoalie?.attrs.reflexes || 70) * 0.3;
  const homePPConv = Math.max(0.04, Math.min(0.5, 0.16 * (homePPOff / 70) * (72 / awayPKComposite)));
  const homePPGoals = poisson(homePPOpp * homePPConv, rng);

  const awayPPOff = unitRating(linesAway.pp, away.roster, OFFENSIVE);
  const homePKComposite = unitRating(linesHome.pk, home.roster, DEFENSIVE) * 0.7 + (homeGoalie?.attrs.reflexes || 70) * 0.3;
  const awayPPConv = Math.max(0.04, Math.min(0.5, 0.16 * (awayPPOff / 70) * (72 / homePKComposite)));
  const awayPPGoals = poisson(awayPPOpp * awayPPConv, rng);

  const periodHomeScore = homeES + homePPGoals;
  const periodAwayScore = awayES + awayPPGoals;

  const homeGoalieLine = goalieLine(homeGoalie, periodAwayScore, rng, SCALE);
  const awayGoalieLine = goalieLine(awayGoalie, periodHomeScore, rng, SCALE);
  const homeShots = awayGoalieLine.shotsAgainst;
  const awayShots = homeGoalieLine.shotsAgainst;

  const homeBox = generateBoxscore(home, homeES, homeShots, rng, linesHome, linesHome.strategy, SCALE);
  const awayBox = generateBoxscore(away, awayES, awayShots, rng, linesAway, linesAway.strategy, SCALE);
  const homePPBox = generatePPGoals(home, homePPGoals, rng, linesHome.pp);
  const awayPPBox = generatePPGoals(away, awayPPGoals, rng, linesAway.pp);
  const goalLogRaw = buildGoalLog(homeBox.events, awayBox.events, homePPBox.events, awayPPBox.events, rng);
  const goalLog = goalLogRaw.map((g) => ({ ...g, period: periodNum }));
  mergeCount(homeBox.goalsBy, homePPBox.goalsBy);
  mergeCount(homeBox.assistsBy, homePPBox.assistsBy);
  mergeCount(awayBox.goalsBy, awayPPBox.goalsBy);
  mergeCount(awayBox.assistsBy, awayPPBox.assistsBy);

  const faceoffs = simulateFaceoffs(home, away, rng, SCALE);
  const shotMetrics = simulateBlocksAndCorsi(homeShots, awayShots, home, away, rng);
  const homeToiBy = computeTOI(linesHome, rng, SCALE);
  const awayToiBy = computeTOI(linesAway, rng, SCALE);

  const homePM = {}, awayPM = {};
  applyPlusMinus(homeBox.events, linesHome, linesAway, rng, homePM, awayPM);
  applyPlusMinus(awayBox.events, linesAway, linesHome, rng, awayPM, homePM);

  return {
    periodHomeScore, periodAwayScore, goalLog,
    home: { ...homeBox, pimBy: homePimBy, ppGoals: homePPGoals, penalties: homePenCount, shots: homeShots, corsiFor: shotMetrics.homeCorsiFor, faceoffsWon: faceoffs.homeWins, faceoffsTotal: faceoffs.total, faceoffsWonBy: faceoffs.homeWinsBy, blocksBy: shotMetrics.homeBlocksBy, plusMinusBy: homePM, toiBy: homeToiBy },
    away: { ...awayBox, pimBy: awayPimBy, ppGoals: awayPPGoals, penalties: awayPenCount, shots: awayShots, corsiFor: shotMetrics.awayCorsiFor, faceoffsWon: faceoffs.awayWins, faceoffsTotal: faceoffs.total, faceoffsWonBy: faceoffs.awayWinsBy, blocksBy: shotMetrics.awayBlocksBy, plusMinusBy: awayPM, toiBy: awayToiBy },
    homeGoalieLine, awayGoalieLine,
  };
}

export function emptyLiveAccum() {
  return {
    home: { goalsBy: {}, assistsBy: {}, hitsBy: {}, shotsBy: {}, pimBy: {}, blocksBy: {}, plusMinusBy: {}, faceoffsWonBy: {}, toiBy: {}, ppGoals: 0, penalties: 0, shots: 0, corsiFor: 0, faceoffsWon: 0, faceoffsTotal: 0, saves: 0, shotsAgainst: 0 },
    away: { goalsBy: {}, assistsBy: {}, hitsBy: {}, shotsBy: {}, pimBy: {}, blocksBy: {}, plusMinusBy: {}, faceoffsWonBy: {}, toiBy: {}, ppGoals: 0, penalties: 0, shots: 0, corsiFor: 0, faceoffsWon: 0, faceoffsTotal: 0, saves: 0, shotsAgainst: 0 },
    goalLog: [],
  };
}

export function mergeLivePeriod(accum, periodResult) {
  const next = { home: { ...accum.home }, away: { ...accum.away }, goalLog: [...accum.goalLog, ...periodResult.goalLog] };
  ["goalsBy", "assistsBy", "hitsBy", "shotsBy", "pimBy", "blocksBy", "plusMinusBy", "faceoffsWonBy", "toiBy"].forEach((k) => {
    next.home[k] = { ...next.home[k] }; mergeCount(next.home[k], periodResult.home[k]);
    next.away[k] = { ...next.away[k] }; mergeCount(next.away[k], periodResult.away[k]);
  });
  ["ppGoals", "penalties", "shots", "corsiFor", "faceoffsWon", "faceoffsTotal"].forEach((k) => {
    next.home[k] = (next.home[k] || 0) + (periodResult.home[k] || 0);
    next.away[k] = (next.away[k] || 0) + (periodResult.away[k] || 0);
  });
  next.home.saves += periodResult.homeGoalieLine.saves; next.home.shotsAgainst += periodResult.homeGoalieLine.shotsAgainst;
  next.away.saves += periodResult.awayGoalieLine.saves; next.away.shotsAgainst += periodResult.awayGoalieLine.shotsAgainst;
  return next;
}

export function generatePPGoals(team, ppGoalsCount, rng, ppUnitIds) {
  const unit = (ppUnitIds || []).map((id) => team.roster.find((p) => p.id === id)).filter(Boolean);
  const goalsBy = {}, assistsBy = {}, events = [];
  if (unit.length === 0 || ppGoalsCount === 0) return { goalsBy, assistsBy, events };
  const scoreWeights = unit.map((p) => skillPower(offenseSkillScore(p)));
  for (let g = 0; g < ppGoalsCount; g++) {
    const scorer = weightedPick(unit, scoreWeights, rng);
    goalsBy[scorer.id] = (goalsBy[scorer.id] || 0) + 1;
    const roll = rng();
    const assistCount = roll < 0.1 ? 0 : roll < 0.55 ? 1 : 2;
    const candidates = unit.filter((p) => p.id !== scorer.id);
    const passWeights = candidates.map((p) => skillPower(playmakingScore(p), 1.8));
    const chosen = new Set();
    for (let a = 0; a < assistCount && chosen.size < candidates.length; a++) {
      let pick, tries = 0;
      do { pick = weightedPick(candidates, passWeights, rng); tries++; } while (chosen.has(pick.id) && tries < 10);
      if (!chosen.has(pick.id)) { chosen.add(pick.id); assistsBy[pick.id] = (assistsBy[pick.id] || 0) + 1; }
    }
    events.push({ scorerId: scorer.id, assistIds: [...chosen] });
  }
  return { goalsBy, assistsBy, events };
}

export function mergeCount(target, source) { Object.entries(source).forEach(([k, v]) => { target[k] = (target[k] || 0) + v; }); }

export function skillPower(val, exp = 2.2) { return Math.pow(Math.max(1, val) / 99, exp) * 100; }

export function offenseSkillScore(p) { return p.attrs.shotAccuracy * 0.30 + p.attrs.shotRange * 0.15 + p.attrs.puckhandling * 0.20 + p.attrs.offensiveRead * 0.20 + p.attrs.gettingOpen * 0.15; }

export function playmakingScore(p) { return p.attrs.passing * 0.6 + p.attrs.offensiveRead * 0.4; }

export function generateBoxscore(team, goals, shots, rng, lines, strategy, hitScale = 1) {
  const skaters = team.roster.filter((p) => p.pos !== "G");
  const bonusOf = (p) => lineInfo(p.id, lines).bonus;
  const dumpMode = strategy?.entry === "dump";
  const scoreWeights = skaters.map((p) => {
    const skill = offenseSkillScore(p) + (dumpMode ? p.attrs.hitting * 0.12 : 0);
    return skillPower(skill) * bonusOf(p);
  });
  const goalsBy = {}, assistsBy = {}, events = [];
  for (let g = 0; g < goals; g++) {
    const scorer = weightedPick(skaters, scoreWeights, rng);
    goalsBy[scorer.id] = (goalsBy[scorer.id] || 0) + 1;
    const roll = rng();
    const assistCount = roll < 0.12 ? 0 : roll < 0.58 ? 1 : 2;
    const candidates = skaters.filter((p) => p.id !== scorer.id);
    const passWeights = candidates.map((p) => skillPower(playmakingScore(p), 1.8) * bonusOf(p));
    const chosen = new Set();
    for (let a = 0; a < assistCount && chosen.size < candidates.length; a++) {
      let pick, tries = 0;
      do { pick = weightedPick(candidates, passWeights, rng); tries++; } while (chosen.has(pick.id) && tries < 10);
      if (!chosen.has(pick.id)) { chosen.add(pick.id); assistsBy[pick.id] = (assistsBy[pick.id] || 0) + 1; }
    }
    events.push({ scorerId: scorer.id, assistIds: [...chosen] });
  }
  const shotsBy = {};
  for (let s = 0; s < shots; s++) {
    const shooter = weightedPick(skaters, scoreWeights, rng);
    shotsBy[shooter.id] = (shotsBy[shooter.id] || 0) + 1;
  }
  const hitsBy = {};
  skaters.forEach((p) => {
    const lambda = (0.3 + Math.pow(p.attrs.hitting / 99, 1.6) * 3.6) * bonusOf(p) * hitScale;
    const h = poisson(Math.max(0.05, lambda), rng);
    if (h > 0) hitsBy[p.id] = h;
  });
  return { goalsBy, assistsBy, hitsBy, shotsBy, events };
}

export function simulateFaceoffs(home, away, rng, scale = 1) {
  const homeC = home.roster.filter((p) => p.pos === "C");
  const awayC = away.roster.filter((p) => p.pos === "C");
  const homeAvg = homeC.length ? homeC.reduce((a, p) => a + p.attrs.faceoffs, 0) / homeC.length : 50;
  const awayAvg = awayC.length ? awayC.reduce((a, p) => a + p.attrs.faceoffs, 0) / awayC.length : 50;
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

export function simulateBlocksAndCorsi(homeShots, awayShots, home, away, rng) {
  const homeD = home.roster.filter((p) => p.pos === "LD" || p.pos === "RD");
  const awayD = away.roster.filter((p) => p.pos === "LD" || p.pos === "RD");
  const blockSkill = (D) => (D.length ? D.reduce((a, p) => a + p.attrs.shotBlocking, 0) / D.length / 99 : 0.6);
  const homeMissed = Math.round(homeShots * 0.32 * (0.7 + rng() * 0.6));
  const awayMissed = Math.round(awayShots * 0.32 * (0.7 + rng() * 0.6));
  const blockedByHome = Math.round(awayShots * 0.12 * (0.6 + blockSkill(homeD)));
  const blockedByAway = Math.round(homeShots * 0.12 * (0.6 + blockSkill(awayD)));
  const distributeBlocks = (D, count) => {
    if (D.length === 0 || count === 0) return {};
    const by = {};
    const weights = D.map((p) => p.attrs.shotBlocking);
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
  lines.forwards.forEach((l, i) => {
    const base = FORWARD_TOI_BASE[i] * scale;
    [l.LW, l.C, l.RW].filter(Boolean).forEach((id) => { toiBy[id] = Math.max(1, base + (rng() * 4 - 2) * scale); });
  });
  lines.defense.forEach((l, i) => {
    const base = DEFENSE_TOI_BASE[i] * scale;
    [l.LD, l.RD].filter(Boolean).forEach((id) => { toiBy[id] = Math.max(1, base + (rng() * 4 - 2) * scale); });
  });
  if (lines.goalies.starter) toiBy[lines.goalies.starter] = 60 * scale;
  if (lines.goalies.backup) toiBy[lines.goalies.backup] = 0;
  return toiBy;
}

export function pickOnIcePair(lines, rng) {
  const idx = weightedPick([0, 1, 2], DEFENSE_BONUS, rng);
  const l = lines.defense[idx] || {};
  return [l.LD, l.RD].filter(Boolean);
}

export function buildGoalLog(homeEvents, awayEvents, homePPEvents, awayPPEvents, rng) {
  const all = [
    ...homeEvents.map((e) => ({ ...e, side: "home", type: "ES" })),
    ...homePPEvents.map((e) => ({ ...e, side: "home", type: "PP" })),
    ...awayEvents.map((e) => ({ ...e, side: "away", type: "ES" })),
    ...awayPPEvents.map((e) => ({ ...e, side: "away", type: "PP" })),
  ];
  for (let i = all.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [all[i], all[j]] = [all[j], all[i]]; }
  const n = all.length;
  const per = Math.max(1, Math.ceil(n / 3));
  return all.map((e, i) => ({ ...e, period: Math.min(3, Math.floor(i / per) + 1) }));
}

export function applyPlusMinus(events, scoringLines, concedingLines, rng, scoringPM, concedingPM) {
  events.forEach((ev) => {
    const plusIds = [ev.scorerId, ...ev.assistIds];
    plusIds.forEach((id) => { scoringPM[id] = (scoringPM[id] || 0) + 1; });
    const minusIds = [...pickOnIceLine(concedingLines, rng), ...pickOnIcePair(concedingLines, rng)];
    minusIds.forEach((id) => { concedingPM[id] = (concedingPM[id] || 0) - 1; });
  });
}

export function simulateGame(game, teamsById, rng, linesByTeam, staffByTeam = {}) {
  const home = teamsById[game.home], away = teamsById[game.away];
  const linesHome = linesByTeam[home.id], linesAway = linesByTeam[away.id];
  const stratHome = getStrategyMultipliers(linesHome.strategy || DEFAULT_STRATEGY, computeTeamProfile(home), linesHome.mentality);
  const stratAway = getStrategyMultipliers(linesAway.strategy || DEFAULT_STRATEGY, computeTeamProfile(away), linesAway.mentality);
  const hs = teamStrength(home, linesHome, staffByTeam[home.id]), as = teamStrength(away, linesAway, staffByTeam[away.id]);
  const leagueAvg = 74;
  const homeExpected = 2.75 * (hs.offense / leagueAvg) * (leagueAvg / as.defense) * 1.06 * stratHome.own * stratAway.opp;
  const awayExpected = 2.75 * (as.offense / leagueAvg) * (leagueAvg / hs.defense) * stratAway.own * stratHome.opp;
  const homeES = poisson(Math.max(0.5, homeExpected), rng);
  const awayES = poisson(Math.max(0.5, awayExpected), rng);

  const homePenCount = poisson(teamPenaltyLambda(home, stratHome.pen), rng);
  const awayPenCount = poisson(teamPenaltyLambda(away, stratAway.pen), rng);
  const homePimBy = assignPenalties(home, homePenCount, rng);
  const awayPimBy = assignPenalties(away, awayPenCount, rng);

  const homeGoalie = home.roster.find((p) => p.id === linesHome.goalies.starter) || home.roster.find((p) => p.pos === "G");
  const awayGoalie = away.roster.find((p) => p.id === linesAway.goalies.starter) || away.roster.find((p) => p.pos === "G");

  const homePPOpp = awayPenCount, awayPPOpp = homePenCount;
  const homePPOff = unitRating(linesHome.pp, home.roster, OFFENSIVE);
  const awayPKComposite = unitRating(linesAway.pk, away.roster, DEFENSIVE) * 0.7 + (awayGoalie?.attrs.reflexes || 70) * 0.3;
  const homePPConv = Math.max(0.04, Math.min(0.5, 0.16 * (homePPOff / 70) * (72 / awayPKComposite)));
  const homePPGoals = poisson(homePPOpp * homePPConv, rng);

  const awayPPOff = unitRating(linesAway.pp, away.roster, OFFENSIVE);
  const homePKComposite = unitRating(linesHome.pk, home.roster, DEFENSIVE) * 0.7 + (homeGoalie?.attrs.reflexes || 70) * 0.3;
  const awayPPConv = Math.max(0.04, Math.min(0.5, 0.16 * (awayPPOff / 70) * (72 / homePKComposite)));
  const awayPPGoals = poisson(awayPPOpp * awayPPConv, rng);

  let homeScore = homeES + homePPGoals;
  let awayScore = awayES + awayPPGoals;
  if (homeScore === awayScore) { if (rng() > 0.45) homeScore++; else awayScore++; }

  const homeGoalieLine = goalieLine(homeGoalie, awayScore, rng);
  const awayGoalieLine = goalieLine(awayGoalie, homeScore, rng);
  const homeShots = awayGoalieLine.shotsAgainst; // tirs du domicile au filet adverse
  const awayShots = homeGoalieLine.shotsAgainst;

  const homeBox = generateBoxscore(home, homeES, homeShots, rng, linesHome, linesHome.strategy);
  const awayBox = generateBoxscore(away, awayES, awayShots, rng, linesAway, linesAway.strategy);
  const homePPBox = generatePPGoals(home, homePPGoals, rng, linesHome.pp);
  const awayPPBox = generatePPGoals(away, awayPPGoals, rng, linesAway.pp);
  const goalLog = buildGoalLog(homeBox.events, awayBox.events, homePPBox.events, awayPPBox.events, rng);
  mergeCount(homeBox.goalsBy, homePPBox.goalsBy);
  mergeCount(homeBox.assistsBy, homePPBox.assistsBy);
  mergeCount(awayBox.goalsBy, awayPPBox.goalsBy);
  mergeCount(awayBox.assistsBy, awayPPBox.assistsBy);

  const faceoffs = simulateFaceoffs(home, away, rng);
  const shotMetrics = simulateBlocksAndCorsi(homeShots, awayShots, home, away, rng);
  const homeToiBy = computeTOI(linesHome, rng);
  const awayToiBy = computeTOI(linesAway, rng);

  const homePM = {}, awayPM = {};
  applyPlusMinus(homeBox.events, linesHome, linesAway, rng, homePM, awayPM);
  applyPlusMinus(awayBox.events, linesAway, linesHome, rng, awayPM, homePM);

  return {
    ...game, played: true, homeScore, awayScore,
    box: {
      home: { ...homeBox, pimBy: homePimBy, ppGoals: homePPGoals, penalties: homePenCount, shots: homeShots, corsiFor: shotMetrics.homeCorsiFor, faceoffsWon: faceoffs.homeWins, faceoffsTotal: faceoffs.total, faceoffsWonBy: faceoffs.homeWinsBy, blocksBy: shotMetrics.homeBlocksBy, plusMinusBy: homePM, toiBy: homeToiBy },
      away: { ...awayBox, pimBy: awayPimBy, ppGoals: awayPPGoals, penalties: awayPenCount, shots: awayShots, corsiFor: shotMetrics.awayCorsiFor, faceoffsWon: faceoffs.awayWins, faceoffsTotal: faceoffs.total, faceoffsWonBy: faceoffs.awayWinsBy, blocksBy: shotMetrics.awayBlocksBy, plusMinusBy: awayPM, toiBy: awayToiBy },
      goalLog,
      homeGoalie: homeGoalieLine,
      awayGoalie: awayGoalieLine,
    },
  };
}
