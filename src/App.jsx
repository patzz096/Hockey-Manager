import { useState, useMemo, useEffect } from "react";
import { Users, CalendarDays, Trophy, Play, FastForward, Circle, ChevronDown, ChevronUp, Layers, BarChart3, Sliders, ArrowLeftRight, DollarSign, UserCog, Mail, UserPlus, FileText, Network, Palette, Award, ListOrdered, Binoculars } from "lucide-react";
import { OFFENSIVE, DEFENSIVE, MENTAL, PHYSICAL, GOALIE_TECH, GOALIE_PHYSICAL, computeOvr, emptyAttrs, attr20, teamOvrBenchmark } from "./engine/attributes";
import { evaluateOffer, lineupContext, minSalaryFor, BURIAL_ALLOWANCE, earnedBonuses, bonusLabel, capHit } from "./engine/contracts";
import { DEFAULT_FACILITIES, DEFAULT_TICKET_TIERS, DEFAULT_CONCESSION_ITEMS, DEFAULT_PARKING, facilityUpgradeCost, autoTuneFinances, computeGameFinance } from "./engine/finance";
import { initLeague, buildSchedule } from "./engine/league";
import { computeStandings } from "./engine/standings";
import { FIRST_SEASON, seasonDates, roundDay, formatDay, monthLabel, monthIndex, transactionWindow } from "./engine/calendar";
import { createPlayoffs, recordPlayoffGame, activeSeries, seriesOfTeam, nextGameOf, draftOrder, runDraftLottery, lotteryIneligible, ROUND_NAMES } from "./engine/playoffs";
import { createDraft, aiPick, makePick, draftDone, upcomingDraftClass } from "./engine/draft";
import { SCOUT_REGIONS, minorSeasonStats, minorSeasonFraction, leagueOf, promoteFromJunior } from "./engine/minorLeagues";
import { DEFAULT_MISSIONS, DEFAULT_COVERAGE, MAX_EXTRA_SCOUTS, weeklyScouting, regionLabel, scoutRoster, buildScoutMarket, missionSummary } from "./engine/scoutingZones";
import { ScoutingCenter } from "./components/ScoutingCenter";
import { expireContracts, aiFreeAgency, agePlayers } from "./engine/offseason";
import { aggregateStats, leadersOf } from "./engine/stats";
import { capStatus, fitsUnderCap, ROSTER_MAX, formatMoney, deadCapFor, buyoutTerms, retentionEntry, MAX_RETAINED_CONTRACTS } from "./engine/cap";
import { injuriesFromGame, dressTeam, isInjured, ltirEligible, injuryLabel } from "./engine/injuries";
import { waiverExempt, placeOnWaivers, resolveWaivers, aiWaiverCandidates, aiMonthlyMoves } from "./engine/waivers";
import { buildLines } from "./engine/lines";
import { buildFreeAgentPoolRT } from "./engine/players";
import { seededRandom } from "./engine/random";
import { teamStrength, simulateStretch, nextStoppage, emptyLiveAccum, mergeLivePeriod, simulateGame, resolveOvertime, applyOvertime, aiPickShift, computeTOI } from "./engine/simulation";
import { STAFF_ROLES, buildStaffMarketRT } from "./engine/staff";
import { assignScout, scoutingDelay, createScoutReport, staffViewPlayer } from "./engine/scouting";
import { BASE_CONDITION, DEFAULT_FOCUS, autoTrainingFocus, applyWeeklyCondition, applyWeeklyCohesion, resetCohesion, strategySignature, applyGameFatigue } from "./engine/training";
import { bestStrategy, normalizeStrategy } from "./engine/strategy";
import { VARS, FONT_IMPORT, h2Style, btnStyle } from "./ui/theme";
import { money } from "./ui/format";
import { ContractOfferModal } from "./components/ContractOfferModal";
import { ContractsPanel } from "./components/ContractsPanel";
import { DepthChartPanel } from "./components/DepthChartPanel";
import { FinancesPanel } from "./components/FinancesPanel";
import { FreeAgentsPanel } from "./components/FreeAgentsPanel";
import { InboxPanel } from "./components/InboxPanel";
import { TacticsPlanner } from "./components/TacticsPlanner";
import { autoUnits, bestSpecial, specialUnits, specialSystems } from "./engine/specialTeams";
import { PlayerEditorModal } from "./components/PlayerEditorModal";
import { PlayerModal } from "./components/PlayerModal";
import { RosterTable } from "./components/RosterTable";
import { StaffCenter } from "./components/StaffCenter";
import { StandingsTable } from "./components/StandingsTable";
import { StatsTables } from "./components/StatsTables";
import { StrategyEditor } from "./components/StrategyEditor";
import { TransactionsCenter } from "./components/TransactionsCenter";
import { TeamCrest } from "./components/common";
import { CustomizationPanel } from "./components/CustomizationPanel";
import { useCustomization } from "./custom/CustomizationContext";
import { BoxscoreView } from "./components/match/BoxscoreView";
import { LiveMatchViewer } from "./components/match/LiveMatchViewer";
import { LiveSimPanel, clockDisplay, livePeriod } from "./components/match/LiveSimPanel";
import { PlayoffsPanel } from "./components/PlayoffsPanel";
import { RolesPanel } from "./components/RolesPanel";
import { naturalRoles } from "./engine/roles";
import { DraftPanel } from "./components/DraftPanel";
import { CapSummary } from "./components/CapSummary";
import { WaiversPanel } from "./components/WaiversPanel";

const PHASE_LABEL = { regular: "Saison régulière", endRegular: "Fin de la saison régulière", playoffs: "Séries éliminatoires", preDraft: "Saison morte", draft: "Repêchage", preFreeAgency: "Saison morte", offseason: "Marché des agents libres" };
const NEXT_STEP = { regular: "", endRegular: "Saison régulière terminée : place aux séries éliminatoires.", playoffs: "Ton équipe est éliminée ou attend son prochain match.", preDraft: "Les séries sont terminées. Prochaine étape : le repêchage.", draft: "Le repêchage est en cours.", preFreeAgency: "Repêchage terminé. Le marché des agents libres ouvre le 1er juillet.", offseason: "Marché des agents libres ouvert. Prépare la prochaine saison." };

export default function HockeyGM({ custom = null, onNewGame = null }) {
  const [initial] = useState(() => initLeague(custom));
  const [teams, setTeams] = useState(initial.teams);
  const [freeAgents, setFreeAgents] = useState(initial.freeAgents);
  const [staffMarket, setStaffMarket] = useState(initial.staffMarket);
  const [scoutKnowledge, setScoutKnowledge] = useState({});
  const [farmByTeam, setFarmByTeam] = useState(initial.farmByTeam);
  // Temps : jours depuis le 1er octobre 2026 (voir engine/calendar.js). Un tour du calendrier
  // régulier tous les 3 jours, séries un jour sur deux, repêchage le 24 juin, agents libres le 1er juillet.
  const [seasonYear, setSeasonYear] = useState(FIRST_SEASON);
  const [currentDay, setCurrentDay] = useState(() => seasonDates(FIRST_SEASON).start - 1);
  const [playoffs, setPlayoffs] = useState(null);
  const [draft, setDraft] = useState(null);
  const [freeAgencyDone, setFreeAgencyDone] = useState(false);
  const [history, setHistory] = useState([]);
  const [careerStats, setCareerStats] = useState({});
  const [waivers, setWaivers] = useState([]);
  const [injuries, setInjuries] = useState({});
  const [deadCap, setDeadCap] = useState([]); // cap mort de ton équipe (rachats, salaires retenus)
  const [lotteryHistory, setLotteryHistory] = useState([]);
  const [myClaims, setMyClaims] = useState([]);
  const [notice, setNotice] = useState(null);
  const [pendingScouts, setPendingScouts] = useState([]);
  // Dépistage à la FM : zone de chaque dépisteur, couverture des zones (%), suggestions reçues,
  // et ta liste de repêchage (ordre de préférence, pour la cuvée `year`).
  // missions : { idDuDépisteur: { region, league, focus, focusValue, target, weeks, weeksDone } }.
  const [scoutMissions, setScoutMissions] = useState(DEFAULT_MISSIONS);
  const [scoutMarket, setScoutMarket] = useState(() => buildScoutMarket(seededRandom(4242), 6));
  const [scoutingSpend, setScoutingSpend] = useState(0); // frais de mission de la saison ($)
  const [scoutCoverage, setScoutCoverage] = useState(DEFAULT_COVERAGE);
  const [scoutSuggestions, setScoutSuggestions] = useState([]);
  const [draftList, setDraftList] = useState({ year: FIRST_SEASON, ids: [] });
  const [winsThisMonth, setWinsThisMonth] = useState(0);
  const [profitThisMonth, setProfitThisMonth] = useState(0);
  const [progressionReport, setProgressionReport] = useState([]);
  const [messages, setMessages] = useState([]);
  function addMessage(msg) {
    setMessages((prev) => [{ id: `MSG-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, read: false, ...msg }, ...prev]);
  }
  function markRead(id) {
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, read: true } : m)));
  }
  const teamsById = useMemo(() => Object.fromEntries(teams.map((t) => [t.id, t])), [teams]);
  const [schedule, setSchedule] = useState(() => buildSchedule(teams));
  const [linesByTeam, setLinesByTeam] = useState(() => Object.fromEntries(teams.map((t) => [t.id, t.lines])));
  const [myTeamId, setMyTeamId] = useState(null);
  const [showCustomization, setShowCustomization] = useState(false);
  // Nom, ville et couleur modifiés dans Personnalisation s'appliquent tout de suite.
  const { teamInfo } = useCustomization();
  useEffect(() => {
    setTeams((prev) => prev.map((t) => {
      const base = initial.teams.find((x) => x.id === t.id);
      return { ...t, city: base.city, name: base.name, color: base.color, ...(teamInfo[t.id] || {}) };
    }));
  }, [teamInfo, initial]);
  const [tab, setTab] = useState("roster");
  const [rngSeed, setRngSeed] = useState(1000);
  const [expandedGameId, setExpandedGameId] = useState(null);
  const [watchingGame, setWatchingGame] = useState(null);
  const [liveMatch, setLiveMatch] = useState(null);
  // Choix du trio / de la paire à envoyer sur la glace pour la prochaine mise au jeu (sim en
  // direct). { myIsHome, oppShift: {forwardIdx, defenseIdx}, forwardIdx, defenseIdx }.
  const [shiftPicker, setShiftPicker] = useState(null);
  const [scheduleFilter, setScheduleFilter] = useState("all");
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [offerTarget, setOfferTarget] = useState(null);
  const [business, setBusiness] = useState({ cash: 50000, ticketTiers: DEFAULT_TICKET_TIERS.map((t) => ({ ...t })), facilities: { ...DEFAULT_FACILITIES }, parking: { ...DEFAULT_PARKING }, concessionItems: DEFAULT_CONCESSION_ITEMS.map((i) => ({ ...i })), staff: { hockeyOpsDirector: null, financeDirector: null, headCoach: null, assistantOff: null, assistantDef: null, fitnessCoach: null, scoutAmateur: null, scoutPro: null }, delegation: { finance: "manual", hockeyOps: "manual", training: "manual" }, trainingFocus: DEFAULT_FOCUS, log: [] });

  const rng = useMemo(() => seededRandom(rngSeed), [rngSeed]);
  // Ton équipe telle que ton personnel la perçoit (valeurs estimées) : c'est ce qu'affiche l'interface.
  const myTeamView = useMemo(() => {
    const t = teamsById[myTeamId];
    return t ? { ...t, roster: t.roster.map((p) => staffViewPlayer(p, business.staff)) } : null;
  }, [teamsById, myTeamId, business.staff]);
  const myFarmView = useMemo(() => (farmByTeam[myTeamId] || []).map((p) => staffViewPlayer(p, business.staff)), [farmByTeam, myTeamId, business.staff]);
  const realPlayer = (p) => findPlayer(p.id) || p;
  const standings = useMemo(() => computeStandings(teams, schedule), [teams, schedule]);
  const currentRound = useMemo(() => { const n = schedule.find((g) => !g.played); return n ? n.round : null; }, [schedule]);
  const dates = seasonDates(seasonYear);
  // Cuvée du prochain repêchage : celle de la saison, ou la suivante une fois le repêchage passé.
  const classYear = draft && draftDone(draft) ? seasonYear + 1 : seasonYear;
  const draftClass = useMemo(() => {
    const taken = new Set(draft && draft.year === classYear ? draft.picks.map((k) => k.playerId).filter(Boolean) : []);
    return upcomingDraftClass(classYear).filter((p) => !taken.has(p.id));
  }, [classYear, draft]);
  const myDraftIds = draftList.year === classYear ? draftList.ids : [];
  // Plafond de ton équipe : cap mort (rachats, rétentions) et allègement LTIR.
  const myCapOpts = useMemo(() => {
    const ltirIds = Object.values(injuries).filter((i) => i.ltir && i.teamId === myTeamId && i.until > currentDay).map((i) => i.playerId);
    const relief = (teamsById[myTeamId]?.roster || []).filter((p) => ltirIds.includes(p.id)).reduce((a, p) => a + (p.contract?.salary || 0), 0);
    // Contrat à un volet envoyé dans la LAH : la part au-delà de minimum + 375 k$ compte encore.
    const buried = (farmByTeam[myTeamId] || []).filter((p) => p.contract && p.contract.type !== "two").reduce((a, p) => a + Math.max(0, p.contract.salary - (minSalaryFor(seasonYear) + BURIAL_ALLOWANCE)), 0);
    return { dead: deadCapFor(deadCap, seasonYear), relief, ltirIds, buried };
  }, [injuries, myTeamId, currentDay, teamsById, deadCap, seasonYear, farmByTeam]);
  // Salaires versés au club-école : salaire LAH (deux volets) ou salaire complet (un volet).
  const farmPay = (farmByTeam[myTeamId] || []).reduce((a, p) => a + (!p.contract ? 0 : p.contract.type === "two" ? (p.contract.ahlSalary || 80) : p.contract.salary), 0);
  // Joueurs qui occupent une place dans l'alignement (la LTIR libère la place).
  const rosterCount = (roster) => roster.filter((p) => !myCapOpts.ltirIds.includes(p.id)).length;
  const txWindow = transactionWindow(seasonYear, currentDay);
  // Phase de la saison : régulière → séries → repêchage → agents libres → nouvelle saison.
  const phase = currentRound !== null ? "regular" : !playoffs ? "endRegular" : !playoffs.champion ? "playoffs" : !draft ? "preDraft" : !draftDone(draft) ? "draft" : !freeAgencyDone ? "preFreeAgency" : "offseason";
  const mySeries = useMemo(() => (playoffs ? seriesOfTeam(playoffs, myTeamId) : null), [playoffs, myTeamId]);
  const nextMyGame = useMemo(() => {
    if (phase === "playoffs") {
      if (!mySeries) return null;
      const minLen = Math.min(...activeSeries(playoffs).map((x) => x.games.length));
      if (mySeries.games.length > minLen) return null; // attend que les autres séries rattrapent
      const n = nextGameOf(mySeries);
      return { id: `${mySeries.id}-G${n.number}`, home: n.home, away: n.away, round: `${ROUND_NAMES[mySeries.round]}, match ${n.number}`, playoff: true, seriesId: mySeries.id };
    }
    return schedule.find((g) => !g.played && (g.home === myTeamId || g.away === myTeamId));
  }, [schedule, myTeamId, phase, mySeries, playoffs]);
  const rounds = useMemo(() => [...new Set(schedule.map((g) => g.round))], [schedule]);

  // Statistiques tirées des feuilles de match (saison régulière et séries, séparément).
  const everyone = useMemo(() => {
    const out = {};
    teams.forEach((t) => t.roster.forEach((p) => { out[p.id] = { player: p, team: t }; }));
    Object.entries(farmByTeam).forEach(([id, list]) => list.forEach((p) => { if (!out[p.id]) out[p.id] = { player: p, team: teamsById[id] }; }));
    freeAgents.forEach((p) => { if (!out[p.id]) out[p.id] = { player: p, team: null }; });
    return out;
  }, [teams, farmByTeam, freeAgents, teamsById]);
  const seasonStats = useMemo(() => aggregateStats(schedule, teamsById, everyone, teams), [schedule, teamsById, everyone, teams]);
  const playoffGames = useMemo(() => (playoffs ? playoffs.rounds.flat().flatMap((x) => x.games) : []), [playoffs]);
  const playoffStats = useMemo(() => aggregateStats(playoffGames, teamsById, everyone), [playoffGames, teamsById, everyone]);
  const [statsMode, setStatsMode] = useState("regular");

  const leaders = useMemo(() => leadersOf(seasonStats), [seasonStats]);
  const playoffLeaders = useMemo(() => leadersOf(playoffStats), [playoffStats]);
  const teamHitTotals = useMemo(() => {
    const totals = {};
    teams.forEach((t) => (totals[t.id] = 0));
    Object.values(seasonStats).forEach((s) => { if (s.team && totals[s.team.id] != null) totals[s.team.id] += s.hits; });
    return totals;
  }, [seasonStats, teams]);
  const teamAdvancedTotals = useMemo(() => {
    const totals = {};
    teams.forEach((t) => (totals[t.id] = { corsiFor: 0, faceoffWins: 0, faceoffTotal: 0 }));
    schedule.filter((g) => g.played).forEach((g) => {
      totals[g.home].corsiFor += g.box.home.corsiFor || 0;
      totals[g.home].faceoffWins += g.box.home.faceoffsWon || 0;
      totals[g.home].faceoffTotal += g.box.home.faceoffsTotal || 0;
      totals[g.away].corsiFor += g.box.away.corsiFor || 0;
      totals[g.away].faceoffWins += g.box.away.faceoffsWon || 0;
      totals[g.away].faceoffTotal += g.box.away.faceoffsTotal || 0;
    });
    return totals;
  }, [teams, schedule]);

  function processFinance(newlyPlayed) {
    const myHomeGames = newlyPlayed.filter((g) => g.home === myTeamId);
    if (myHomeGames.length === 0) return;
    const s = standings.find((x) => x.id === myTeamId);
    const winPct = s && s.gp > 0 ? s.w / s.gp : 0.5;
    setBusiness((prev) => {
      let cash = prev.cash;
      let biz = prev;
      const entries = [];
      myHomeGames.forEach((g) => {
        const fin = computeGameFinance(teamsById[myTeamId], biz, winPct, myCapOpts.dead + farmPay);
        cash += fin.profit;
        entries.push({ opponent: teamsById[g.away].name, ...fin });
        biz = { ...biz, cash };
        if (biz.delegation.finance === "delegated") biz = autoTuneFinances(biz, fin);
        cash = biz.cash;
      });
      setProfitThisMonth((p) => p + entries.reduce((a, e) => a + e.profit, 0));
      entries.forEach((fin) => {
        const body = `Assistance: ${fin.attendance.toLocaleString()} spectateurs\nRevenus: ${fin.revenue.toLocaleString()} $\nDépenses: ${fin.expenses.toLocaleString()} $\nProfit net: ${fin.profit >= 0 ? "+" : ""}${fin.profit.toLocaleString()} $`;
        addMessage({ from: "Directeur des finances", subject: `Bilan du match vs ${fin.opponent}`, category: "finance", body });
      });
      return { ...biz, cash, log: [...entries.reverse(), ...biz.log].slice(0, 30) };
    });
  }
  function startLiveMatch(game) {
    setWatchingGame(null);
    setExpandedGameId(null);
    setShiftPicker(null);
    const dressedHome = dressTeam(teamsById[game.home], linesByTeam[game.home], injuries, currentDay);
    const dressedAway = dressTeam(teamsById[game.away], linesByTeam[game.away], injuries, currentDay);
    // Énergie de match (engine/training.js) : part de la condition de saison de chacun.
    const energy = Object.fromEntries([...dressedHome.team.roster, ...dressedAway.team.roster].map((p) => [p.id, p.condition ?? BASE_CONDITION]));
    setLiveMatch({ game, home: dressedHome.team, away: dressedAway.team, linesHome: dressedHome.lines, linesAway: dressedAway.lines, minute: 0, homeScore: 0, awayScore: 0, accum: emptyLiveAccum(), lastStop: null, lastShift: null, energy });
  }
  // Équipe telle que simulée pour ce segment : la condition de chacun est remplacée par son
  // énergie du match en cours (engine/training.js), qui baisse avec le temps de glace accumulé.
  function withEnergy(team, energy) {
    return { ...team, roster: team.roster.map((p) => (energy[p.id] != null ? { ...p, condition: energy[p.id] } : p)) };
  }
  // Simule un segment jusqu'à `stop`. shiftHome/shiftAway (optionnels) : { forwardIdx, defenseIdx }
  // du trio et de la paire envoyés sur la glace pour cette mise au jeu (voir engine/lines.js).
  function runLiveSegment(stop, shiftHome = null, shiftAway = null) {
    const prev = liveMatch;
    if (!prev) return;
    const staffByTeam = { [myTeamId]: business.staff };
    const linesHome = shiftHome ? { ...prev.linesHome, shift: shiftHome } : prev.linesHome;
    const linesAway = shiftAway ? { ...prev.linesAway, shift: shiftAway } : prev.linesAway;
    const minutes = stop.minute - prev.minute;
    const homeForSim = withEnergy(prev.home, prev.energy);
    const awayForSim = withEnergy(prev.away, prev.energy);
    const result = simulateStretch(homeForSim, awayForSim, linesHome, linesAway, staffByTeam, prev.minute, minutes, Math.random, { home: prev.homeScore, away: prev.awayScore });
    // Fatigue : le temps de glace de ce segment (même calcul que la feuille de match) baisse
    // l'énergie de ceux qui ont joué, la remonte un peu pour ceux restés au banc.
    const toiHome = computeTOI(linesHome, Math.random, minutes / 60);
    const toiAway = computeTOI(linesAway, Math.random, minutes / 60);
    const energy = applyGameFatigue(applyGameFatigue(prev.energy, prev.home.roster, toiHome, minutes), prev.away.roster, toiAway, minutes);
    const at = stop.minute >= 60 ? "fin du match" : `${clockDisplay(stop.minute)} en ${livePeriod(stop.minute)}${livePeriod(stop.minute) === 1 ? "re" : "e"}`;
    setLiveMatch({ ...prev, accum: mergeLivePeriod(prev.accum, result), homeScore: prev.homeScore + result.periodHomeScore, awayScore: prev.awayScore + result.periodAwayScore, minute: stop.minute, lastStop: `${at} : ${result.home.penalties + result.away.penalties > 0 && stop.reason !== "Fin de la période" ? "Punition" : stop.reason}`, lastShift: shiftHome || shiftAway ? { home: shiftHome, away: shiftAway } : null, energy });
    setShiftPicker(null);
  }
  // Joue jusqu'au prochain coup de sifflet (moment variable) ou jusqu'à la fin de la période,
  // avec le déploiement habituel (pas de trio précis choisi pour cette mise au jeu).
  function playLive(toPeriodEnd = false) {
    const prev = liveMatch;
    if (!prev || prev.minute >= 60) return;
    const periodEnd = (Math.floor(prev.minute / 20) + 1) * 20;
    const stop = toPeriodEnd ? { minute: periodEnd, reason: "Fin de la période" } : nextStoppage(prev.minute, Math.random);
    runLiveSegment(stop);
  }
  // Ouvre le sélecteur de trio/paire pour la prochaine mise au jeu. L'adversaire choisit
  // d'abord (l'ordinateur, selon l'écart au score) ; à domicile, tu vois son choix avant de
  // répliquer (dernier changement, comme dans la vraie LNH) ; à l'étranger, tu choisis à l'aveugle.
  function openShiftPicker() {
    const prev = liveMatch;
    if (!prev || prev.minute >= 60) return;
    const myIsHome = prev.game.home === myTeamId;
    const oppDiff = myIsHome ? prev.awayScore - prev.homeScore : prev.homeScore - prev.awayScore;
    const oppShift = aiPickShift(oppDiff, prev.minute, Math.random);
    setShiftPicker({ myIsHome, oppShift, forwardIdx: 0, defenseIdx: 0 });
  }
  function updateShiftPicker(patch) { setShiftPicker((prev) => (prev ? { ...prev, ...patch } : prev)); }
  function cancelShiftPicker() { setShiftPicker(null); }
  // Envoie le trio/la paire choisis : joue jusqu'au prochain arrêt avec ce déploiement des deux côtés.
  function sendShift() {
    const prev = liveMatch;
    if (!prev || !shiftPicker) return;
    const stop = nextStoppage(prev.minute, Math.random);
    const mine = { forwardIdx: shiftPicker.forwardIdx, defenseIdx: shiftPicker.defenseIdx };
    runLiveSegment(stop, shiftPicker.myIsHome ? mine : shiftPicker.oppShift, shiftPicker.myIsHome ? shiftPicker.oppShift : mine);
  }
  function finishLiveMatch() {
    if (!liveMatch) return;
    let { homeScore, awayScore } = liveMatch;
    let box = { home: liveMatch.accum.home, away: liveMatch.accum.away, goalLog: liveMatch.accum.goalLog, homeGoalie: { saves: liveMatch.accum.home.saves, shotsAgainst: liveMatch.accum.home.shotsAgainst }, awayGoalie: { saves: liveMatch.accum.away.saves, shotsAgainst: liveMatch.accum.away.shotsAgainst } };
    let decidedIn = "REG";
    if (homeScore === awayScore) {
      const ot = resolveOvertime(liveMatch.home, liveMatch.away, linesByTeam[liveMatch.home.id], linesByTeam[liveMatch.away.id], { [myTeamId]: business.staff }, Math.random, { noShootout: !!liveMatch.game.playoff });
      box = applyOvertime(box, ot);
      if (ot.winner === "home") homeScore++; else awayScore++;
      decidedIn = ot.shootout ? "SO" : "OT";
    }
    const finalGame = { ...liveMatch.game, played: true, homeScore, awayScore, decidedIn, box };
    const wins = (finalGame.home === myTeamId && finalGame.homeScore > finalGame.awayScore) || (finalGame.away === myTeamId && finalGame.awayScore > finalGame.homeScore) ? 1 : 0;
    if (wins > 0) setWinsThisMonth((w) => w + wins);
    const liveInj = injuriesFromGame(finalGame, teamsById, currentDay, seededRandom(currentDay * 131 + 9));
    const freshLive = Object.values(liveInj).filter((x) => !isInjured(injuries, x.playerId, currentDay));
    if (freshLive.length) { setInjuries((prev) => ({ ...prev, ...Object.fromEntries(freshLive.map((x) => [x.playerId, x])) })); announceInjuries(freshLive); }
    if (finalGame.playoff) applyPlayoffResults(playoffs, [finalGame]);
    else setSchedule((prev) => prev.map((g) => (g.id === finalGame.id ? finalGame : g)));
    processFinance([finalGame]);
    setLiveMatch(null);
    setShiftPicker(null);
    setWatchingGame(null);
  }
  // Joue des matchs le jour `day` : les blessés sont retirés des alignements (remplacés par les
  // meilleurs disponibles), puis de nouvelles blessures sont tirées. La simulation elle-même
  // reste déterministe ; les blessures ont leur propre générateur.
  function playSlate(games, day, injuriesIn, rngGame, { playoff = false } = {}) {
    const staffByTeam = { [myTeamId]: business.staff };
    const dressedTeams = {}, dressedLines = {};
    teams.forEach((t) => { const d = dressTeam(t, linesByTeam[t.id], injuriesIn, day); dressedTeams[t.id] = d.team; dressedLines[t.id] = d.lines; });
    const injRng = seededRandom(day * 7919 + 17 + games.length);
    let inj = injuriesIn;
    const fresh = [];
    const played = games.map((g) => {
      const r = simulateGame(g, dressedTeams, rngGame, dressedLines, staffByTeam, { playoff });
      Object.values(injuriesFromGame(r, teamsById, day, injRng)).forEach((x) => {
        if (!isInjured(inj, x.playerId, day)) { inj = { ...inj, [x.playerId]: x }; fresh.push(x); }
      });
      return r;
    });
    return { played, injuries: inj, fresh };
  }
  function announceInjuries(fresh) {
    fresh.filter((x) => x.teamId === myTeamId).forEach((x) => {
      const p = teamsById[myTeamId].roster.find((q) => q.id === x.playerId);
      if (!p) return;
      addMessage({ from: "Thérapeute de l'équipe", subject: `Blessure : ${p.name}`, category: "general", playerIds: [p.id], body: `${p.name} est blessé (${injuryLabel(x, x.since)}). Retour prévu vers le ${formatDay(x.until)}.\nIl est remplacé automatiquement dans les trios.${ltirEligible(x, x.since) ? "\n\nAbsence de plus de 24 jours : tu peux le placer sur la liste des blessés à long terme (LTIR) dans l'onglet Profondeur, ce qui libère sa place et permet de dépasser le plafond de son salaire." : ""}` });
    });
  }
  function simRound() {
    if (currentRound === null) return;
    const slate = playSlate(schedule.filter((g) => !g.played && g.round === currentRound), roundDay(seasonYear, currentRound), injuries, rng);
    const newlyPlayed = slate.played;
    const byId = Object.fromEntries(newlyPlayed.map((g) => [g.id, g]));
    const updated = schedule.map((g) => byId[g.id] || g);
    setInjuries(slate.injuries);
    announceInjuries(slate.fresh);
    const wins = newlyPlayed.filter((g) => (g.home === myTeamId && g.homeScore > g.awayScore) || (g.away === myTeamId && g.awayScore > g.homeScore)).length;
    if (wins > 0) setWinsThisMonth((w) => w + wins);
    processFinance(newlyPlayed);
    setSchedule(updated);
    setRngSeed((s) => s + 7);
    advanceTo(roundDay(seasonYear, currentRound));
  }
  function simToSeasonEnd() {
    const newlyPlayed = [];
    let inj = injuries;
    const fresh = [];
    [...new Set(schedule.filter((g) => !g.played).map((g) => g.round))].sort((a, b) => a - b).forEach((round) => {
      const slate = playSlate(schedule.filter((g) => !g.played && g.round === round), roundDay(seasonYear, round), inj, rng);
      inj = slate.injuries; fresh.push(...slate.fresh); newlyPlayed.push(...slate.played);
    });
    const byId = Object.fromEntries(newlyPlayed.map((g) => [g.id, g]));
    const updated = schedule.map((g) => byId[g.id] || g);
    setInjuries(inj);
    announceInjuries(fresh.filter((x) => x.until > roundDay(seasonYear, Math.max(...schedule.map((g) => g.round)))));
    const wins = newlyPlayed.filter((g) => (g.home === myTeamId && g.homeScore > g.awayScore) || (g.away === myTeamId && g.awayScore > g.homeScore)).length;
    if (wins > 0) setWinsThisMonth((w) => w + wins);
    processFinance(newlyPlayed);
    setSchedule(updated);
    setRngSeed((s) => s + 13);
    advanceTo(roundDay(seasonYear, Math.max(...schedule.map((g) => g.round))));
  }
  function setTierPrice(key, price) { setBusiness((prev) => ({ ...prev, ticketTiers: prev.ticketTiers.map((t) => (t.key === key ? { ...t, price } : t)) })); }
  function setParkingPrice(price) { setBusiness((prev) => ({ ...prev, parking: { ...prev.parking, price } })); }
  function setItemPrice(key, price) { setBusiness((prev) => ({ ...prev, concessionItems: prev.concessionItems.map((i) => (i.key === key ? { ...i, price } : i)) })); }
  function upgradeFacility(key) {
    setBusiness((prev) => {
      const level = prev.facilities[key];
      const cost = facilityUpgradeCost(level);
      if (level >= 5 || prev.cash < cost) return prev;
      return { ...prev, cash: prev.cash - cost, facilities: { ...prev.facilities, [key]: level + 1 } };
    });
  }
  function selectPlayer(player, team = null) {
    if (team?.id === myTeamId) setSelectedPlayer({ player: staffViewPlayer(realPlayer(player), business.staff), team: myTeamView });
    else setSelectedPlayer({ player, team });
  }
  function openCreatePlayer() {
    setSelectedPlayer(null);
    setEditingPlayer({ isNew: true, initial: { id: `${myTeamId}-new-${Date.now()}`, name: "", pos: "C", age: 20, attrs: emptyAttrs("C", 60), potential: 60 } });
  }
  function openPlayerById(playerId) {
    const team = teams.find((t) => t.roster.some((p) => p.id === playerId));
    if (team) return selectPlayer(team.roster.find((p) => p.id === playerId), team);
    const farmOwner = Object.keys(farmByTeam).find((id) => farmByTeam[id].some((p) => p.id === playerId));
    if (farmOwner) return selectPlayer(farmByTeam[farmOwner].find((p) => p.id === playerId), teamsById[farmOwner]);
    const fa = freeAgents.find((p) => p.id === playerId) || upcomingDraftClass(classYear).find((p) => p.id === playerId);
    if (fa) selectPlayer(fa, null);
  }
  function openEditPlayer(player) { setSelectedPlayer(null); setEditingPlayer({ isNew: false, initial: realPlayer(player) }); }
  function savePlayer(updated) {
    setTeams((prev) => prev.map((t) => {
      if (t.id !== myTeamId) return t;
      const exists = t.roster.some((p) => p.id === updated.id);
      const roster = exists ? t.roster.map((p) => (p.id === updated.id ? updated : p)) : [...t.roster, updated];
      return { ...t, roster: roster.sort((a, b) => b.ovr - a.ovr) };
    }));
    setEditingPlayer(null);
  }
  // Place un joueur à un poste. S'il occupe déjà un autre poste du même ensemble (trios-paires-
  // gardiens, unités d'AN ou unités de DN), les deux joueurs échangent leur place.
  const SLOT_GROUPS = { forwards: "es", defense: "es", goalies: "es", pp: "pp", pk: "pk" };
  function findSlot(teamLines, section, playerId) {
    const group = SLOT_GROUPS[section];
    const sections = Object.keys(SLOT_GROUPS).filter((k) => SLOT_GROUPS[k] === group);
    for (const sec of sections) {
      if (sec === "goalies") { for (const k of ["starter", "backup"]) if (teamLines.goalies[k] === playerId) return { sec, idx: null, key: k }; continue; }
      const arr = sec === "pp" || sec === "pk" ? specialUnits(teamLines, sec) : teamLines[sec];
      for (let i = 0; i < arr.length; i++) for (const k of Object.keys(arr[i])) if (arr[i][k] === playerId) return { sec, idx: i, key: k };
    }
    return null;
  }
  function updateLine(section, idx, slot, playerId) {
    setLinesByTeam((prev) => {
      let teamLines = prev[myTeamId];
      const from = findSlot(teamLines, section, playerId);
      const current = getSlotValue(teamLines, section, idx, slot);
      if (from) teamLines = setSlotValue(teamLines, from.sec, from.idx, from.key, current);
      teamLines = setSlotValue(teamLines, section, idx, slot, playerId);
      return { ...prev, [myTeamId]: teamLines };
    });
  }
  function getSlotValue(teamLines, section, idx, key) {
    if (section === "goalies") return teamLines.goalies[key];
    if (section === "pp" || section === "pk") return specialUnits(teamLines, section)[idx][key];
    return teamLines[section][idx][key];
  }
  function setSlotValue(teamLines, section, idx, key, val) {
    if (section === "goalies") return { ...teamLines, goalies: { ...teamLines.goalies, [key]: val } };
    const src = section === "pp" || section === "pk" ? specialUnits(teamLines, section) : teamLines[section];
    const arr = src.map((l, i) => (i === idx ? { ...l, [key]: val } : l));
    return { ...teamLines, [section]: arr };
  }
  function swapLineSlots(secA, idxA, keyA, secB, idxB, keyB) {
    setLinesByTeam((prev) => {
      let teamLines = prev[myTeamId];
      const valA = getSlotValue(teamLines, secA, idxA, keyA);
      const valB = getSlotValue(teamLines, secB, idxB, keyB);
      teamLines = setSlotValue(teamLines, secA, idxA, keyA, valB);
      teamLines = setSlotValue(teamLines, secB, idxB, keyB, valA);
      return { ...prev, [myTeamId]: teamLines };
    });
  }
  // Change une phase du système de jeu. Un changement de système coûte de la cohésion (temps
  // d'adaptation, engine/training.js) : elle se reconstruit ensuite avec l'entraînement.
  function applyStrategy(teamLines, newStrategy) {
    const changed = strategySignature(teamLines.strategy) !== strategySignature(newStrategy);
    return { ...teamLines, strategy: newStrategy, cohesion: changed ? resetCohesion(teamLines.cohesion ?? 100) : teamLines.cohesion };
  }
  function updateStrategy(field, value) {
    setLinesByTeam((prev) => ({ ...prev, [myTeamId]: applyStrategy(prev[myTeamId], { ...normalizeStrategy(prev[myTeamId].strategy), [field]: value }) }));
  }
  // Rôle demandé à un joueur (onglet Rôles).
  function updateRole(playerId, roleId) {
    setLinesByTeam((prev) => ({ ...prev, [myTeamId]: { ...prev[myTeamId], roles: { ...(prev[myTeamId].roles || {}), [playerId]: roleId } } }));
  }
  function resetNaturalRoles() {
    setLinesByTeam((prev) => ({ ...prev, [myTeamId]: { ...prev[myTeamId], roles: naturalRoles(teamsById[myTeamId].roster) } }));
  }
  function updateMentality(field, value) {
    setLinesByTeam((prev) => ({ ...prev, [myTeamId]: { ...prev[myTeamId], mentality: { ...prev[myTeamId].mentality, [field]: value } } }));
  }
  function autoOptimizeLines() {
    const fresh = buildLines(myTeamView.roster);
    setLinesByTeam((prev) => ({ ...prev, [myTeamId]: { ...prev[myTeamId], forwards: fresh.forwards, defense: fresh.defense, goalies: fresh.goalies } }));
  }
  // Unités spéciales : système choisi (AN / DN), meilleures unités pour ce système, ou meilleur des deux.
  function updateSpecialSystem(kind, systemId) {
    setLinesByTeam((prev) => ({ ...prev, [myTeamId]: { ...prev[myTeamId], special: { ...specialSystems(prev[myTeamId]), [kind]: systemId } } }));
  }
  function autoSpecialUnits(kind) {
    setLinesByTeam((prev) => ({ ...prev, [myTeamId]: { ...prev[myTeamId], [kind]: autoUnits(myTeamView.roster, kind, specialSystems(prev[myTeamId])[kind]) } }));
  }
  function bestSpecialSystem(kind) {
    const best = bestSpecial(myTeamView.roster, kind);
    setLinesByTeam((prev) => ({ ...prev, [myTeamId]: { ...prev[myTeamId], [kind]: best.units, special: { ...specialSystems(prev[myTeamId]), [kind]: best.id } } }));
  }
  // Meilleur système pour chaque phase, selon l'effectif tel que ton personnel le perçoit.
  function autoOptimizeStrategy() {
    setLinesByTeam((prev) => ({ ...prev, [myTeamId]: applyStrategy(prev[myTeamId], bestStrategy(myTeamView, prev[myTeamId])) }));
  }
  function setTrainingFocus(focus) { setBusiness((prev) => ({ ...prev, trainingFocus: focus })); }

  function cleanLinesOfPlayer(l, playerId) {
    return {
      ...l,
      forwards: l.forwards.map((x) => ({ LW: x.LW === playerId ? undefined : x.LW, C: x.C === playerId ? undefined : x.C, RW: x.RW === playerId ? undefined : x.RW })),
      defense: l.defense.map((x) => ({ LD: x.LD === playerId ? undefined : x.LD, RD: x.RD === playerId ? undefined : x.RD })),
      goalies: { starter: l.goalies.starter === playerId ? undefined : l.goalies.starter, backup: l.goalies.backup === playerId ? undefined : l.goalies.backup },
      pp: specialUnits(l, "pp").map((u) => Object.fromEntries(Object.entries(u).map(([k, id]) => [k, id === playerId ? undefined : id]))),
      pk: specialUnits(l, "pk").map((u) => Object.fromEntries(Object.entries(u).map(([k, id]) => [k, id === playerId ? undefined : id]))),
    };
  }
  function executeTrade(otherTeamId, myIds, theirIds, retention = {}) {
    if (myIds.length === 0 && theirIds.length === 0) return;
    if (!txWindow.open) return;
    const myT = teamsById[myTeamId], theirT = teamsById[otherTeamId];
    const sal = (t, ids) => t.roster.filter((p) => ids.includes(p.id)).reduce((a, p) => a + (p.contract?.salary || 0), 0);
    // Rétention : ton équipe garde une part du salaire (cap mort), l'autre équipe reçoit le reste.
    const retained = myT.roster.filter((p) => myIds.includes(p.id) && retention[p.id] > 0).map((p) => retentionEntry(p, retention[p.id], seasonYear));
    const activeRetained = deadCap.filter((e) => e.kind === "retention" && e.seasons.includes(seasonYear)).length;
    if (activeRetained + retained.length > MAX_RETAINED_CONTRACTS) { setNotice(`Échange refusé : une équipe ne peut retenir du salaire que sur ${MAX_RETAINED_CONTRACTS} contrats à la fois (tu en as déjà ${activeRetained}).`); return; }
    const keptTotal = retained.reduce((a, e) => a + e.amount, 0);
    const myOut = sal(myT, myIds) - keptTotal, myIn = sal(theirT, theirIds);
    if (!fitsUnderCap(myT.roster, seasonYear, myIn, myOut, myCapOpts)) { setNotice(`Échange refusé : ta masse salariale dépasserait le plafond de ${formatMoney(capStatus(myT.roster, seasonYear).cap)}.`); return; }
    if (!fitsUnderCap(theirT.roster, seasonYear, myOut, myIn)) { setNotice(`Échange refusé : ${theirT.name} dépasserait le plafond salarial.`); return; }
    if (rosterCount(myT.roster) - myIds.length + theirIds.length > ROSTER_MAX) { setNotice(`Échange refusé : ton alignement dépasserait ${ROSTER_MAX} joueurs.`); return; }
    const theirTeamName = teamsById[otherTeamId]?.name || "l'autre équipe";
    const myT0 = teamsById[myTeamId], theirT0 = teamsById[otherTeamId];
    const myOutNames = myT0.roster.filter((p) => myIds.includes(p.id)).map((p) => p.name);
    const theirOutNames = theirT0.roster.filter((p) => theirIds.includes(p.id)).map((p) => p.name);
    setTeams((prev) => {
      const myT = prev.find((t) => t.id === myTeamId);
      const theirT = prev.find((t) => t.id === otherTeamId);
      const myOut = myT.roster.filter((p) => myIds.includes(p.id)).map((p) => (retention[p.id] > 0 ? { ...p, contract: { ...p.contract, salary: Math.round(p.contract.salary * (1 - retention[p.id])) }, retainedBy: myTeamId } : p));
      const theirOut = theirT.roster.filter((p) => theirIds.includes(p.id));
      return prev.map((t) => {
        if (t.id === myTeamId) return { ...t, roster: [...t.roster.filter((p) => !myIds.includes(p.id)), ...theirOut].sort((a, b) => b.ovr - a.ovr) };
        if (t.id === otherTeamId) return { ...t, roster: [...t.roster.filter((p) => !theirIds.includes(p.id)), ...myOut].sort((a, b) => b.ovr - a.ovr) };
        return t;
      });
    });
    setLinesByTeam((prev) => {
      const updated = { ...prev };
      myIds.forEach((id) => { updated[myTeamId] = cleanLinesOfPlayer(updated[myTeamId], id); });
      theirIds.forEach((id) => { updated[otherTeamId] = cleanLinesOfPlayer(updated[otherTeamId], id); });
      return updated;
    });
    if (retained.length) setDeadCap((prev) => [...prev, ...retained]);
    setInjuries((prev) => Object.fromEntries(Object.entries(prev).map(([id, i]) => [id, [...myIds, ...theirIds].includes(id) ? { ...i, ltir: false, teamId: myIds.includes(id) ? otherTeamId : myTeamId } : i])));
    const body = `Tu envoies: ${myOutNames.join(", ") || "rien"}\nTu reçois: ${theirOutNames.join(", ") || "rien"}${retained.length ? `\nSalaire retenu : ${retained.map((e) => `${e.label.replace("Salaire retenu — ", "")} ${formatMoney(e.amount)}/saison`).join(", ")}` : ""}`;
    addMessage({ from: "Directeur général adjoint", subject: `Échange conclu avec ${theirTeamName}`, category: "transaction", playerIds: [...myIds, ...theirIds], body });
  }
  function openOffer(player, isRenewal = false) {
    setSelectedPlayer(null);
    setOfferTarget({ player: isRenewal ? realPlayer(player) : player, isRenewal });
  }
  // Contexte d'une offre : saison du contrat, classement de ton équipe, place du joueur dans ton
  // alignement, production de la saison (points par match).
  function offerContext(player, isRenewal) {
    const team = teamsById[myTeamId];
    const rank = Math.max(0, standings.findIndex((x) => x.id === myTeamId));
    const st = seasonStats[player.id];
    return {
      ctx: { team, teamRank: rank, teamCount: standings.length || 32, isRenewal, ...lineupContext(player, team.roster) },
      year: isRenewal || freeAgencyDone || ["preDraft", "draft", "preFreeAgency", "offseason"].includes(phase) ? seasonYear + 1 : seasonYear,
      perf: st && st.gp >= 10 ? st.pts / st.gp : null,
    };
  }
  function submitOffer(player, offer, isRenewal) {
    if (!isRenewal && !txWindow.open) { setOfferTarget(null); return; }
    const myRoster = teamsById[myTeamId].roster;
    const current = isRenewal ? capHit(myRoster.find((p) => p.id === player.id)?.contract) : 0;
    const hit = offer.salary + (offer.bonuses || []).reduce((a, b) => a + b.amount, 0);
    if (!fitsUnderCap(myRoster, seasonYear, hit, current, myCapOpts)) { setNotice(`Offre impossible : ${formatMoney(hit)} dépasse ton espace sous le plafond (${formatMoney(capStatus(myRoster, seasonYear, myCapOpts).space + current)}).`); setOfferTarget(null); return; }
    if (!isRenewal && rosterCount(myRoster) >= ROSTER_MAX) { setNotice(`Offre impossible : ton alignement compte déjà ${ROSTER_MAX} joueurs. Renvoie quelqu'un au club-école d'abord.`); setOfferTarget(null); return; }
    const { ctx, year, perf } = offerContext(realPlayer(player), isRenewal);
    const result = evaluateOffer(realPlayer(player), offer, ctx, year, perf);
    const bonusText = (offer.bonuses || []).length ? `, primes : ${offer.bonuses.map(bonusLabel).join(", ")}` : "";
    const offerSummary = `Offre : ${money(offer.salary)} par saison sur ${offer.years} an${offer.years > 1 ? "s" : ""}, contrat à ${offer.type === "two" ? `deux volets (LAH ${money(offer.ahlSalary)})` : "un volet"}${offer.signingBonus ? `, prime à la signature de ${money(offer.signingBonus)}` : ""}${offer.noTrade ? ", clause de non-échange" : ""}${bonusText}.`;
    if (result.accept) {
      const newContract = { years: offer.years, salary: offer.salary, type: offer.type, ahlSalary: offer.type === "two" ? offer.ahlSalary : undefined, noTrade: offer.noTrade, bonuses: offer.bonuses || [], signingBonus: offer.signingBonus || 0 };
      if (isRenewal) {
        setTeams((prev) => prev.map((t) => (t.id !== myTeamId ? t : { ...t, roster: t.roster.map((p) => (p.id === player.id ? { ...p, contract: newContract } : p)) })));
      } else {
        setFreeAgents((prev) => prev.filter((p) => p.id !== player.id));
        setTeams((prev) => prev.map((t) => (t.id !== myTeamId ? t : { ...t, roster: [...t.roster, { signedAge: player.age, signedYear: seasonYear, ...realPlayer(player), contract: newContract }].sort((a, b) => b.ovr - a.ovr) })));
      }
      // Prime à la signature (k$) payée tout de suite, en dollars dans la caisse.
      if (offer.signingBonus > 0) setBusiness((prev) => ({ ...prev, cash: prev.cash - offer.signingBonus * 1000 }));
      addMessage({ from: "Agent du joueur", subject: `${player.name} a accepté l'offre`, category: "transaction", playerIds: [player.id], body: `${offerSummary}\n\n${player.name} a signé.` });
    } else {
      const why = result.factors.filter((f) => f.value < 0).map((f) => f.label.toLowerCase());
      addMessage({ from: "Agent du joueur", subject: `${player.name} a refusé l'offre`, category: "transaction", playerIds: [player.id], body: `${offerSummary}\n\nContre-offre de l'agent : ${money(result.counter.salary)} par saison sur ${result.counter.years} an${result.counter.years > 1 ? "s" : ""}, contrat à un volet.${result.parts.twoWay < -0.3 ? " Mon client refuse un contrat à deux volets : il est un joueur de la LNH." : ""}${why.length ? ` Réserves de mon client : ${why.join(", ")}.` : ""}` });
    }
    setOfferTarget(null);
  }
  function refreshFreeAgents() {
    setFreeAgents(buildFreeAgentPoolRT(16, business.staff.scoutAmateur?.rating));
  }
  function findPlayer(playerId) {
    for (const t of teams) { const p = t.roster.find((x) => x.id === playerId); if (p) return p; }
    for (const list of Object.values(farmByTeam)) { const p = list.find((x) => x.id === playerId); if (p) return p; }
    return freeAgents.find((x) => x.id === playerId) || upcomingDraftClass(classYear).find((x) => x.id === playerId) || null;
  }
  // Ligne de statistiques de la saison en cours dans une ligue mineure (simulation rapide).
  function minorLine(player) {
    if (!player || !(player.draftProspect || player.level === "LAH")) return null;
    const owner = Object.keys(farmByTeam).find((id) => farmByTeam[id].some((p) => p.id === player.id));
    const lg = leagueOf(player, owner ? teamsById[owner]?.name : null);
    if (!lg) return null;
    const year = player.draftProspect ? (player.id.split("-")[1] ? Number(player.id.split("-")[1]) : seasonYear) : seasonYear;
    return { ...minorSeasonStats(player, lg.league, year, minorSeasonFraction(currentDay, seasonDates(year).start)), club: lg.club, year };
  }
  // Liste de repêchage : ajout en fin de liste, retrait, réordonnancement.
  function setMyDraftIds(ids) { setDraftList({ year: classYear, ids }); }
  function toggleDraftList(playerId) {
    setMyDraftIds(myDraftIds.includes(playerId) ? myDraftIds.filter((x) => x !== playerId) : [...myDraftIds, playerId]);
  }
  // Une semaine de dépistage par zone (voir engine/scoutingZones.js).
  // Équipe de dépistage : dépisteurs en chef + dépisteurs engagés en renfort (salaire dans les
  // dépenses du personnel), et leurs missions (frais hebdomadaires déduits de la caisse).
  const scouts = scoutRoster(business.staff, business.scoutTeam || [], myTeamId);
  function hireScout(candidate) {
    if ((business.scoutTeam || []).length >= MAX_EXTRA_SCOUTS) { setNotice(`Ton service de dépistage compte déjà ${MAX_EXTRA_SCOUTS} dépisteurs en renfort.`); return; }
    setBusiness((prev) => ({ ...prev, scoutTeam: [...(prev.scoutTeam || []), candidate] }));
    setScoutMarket((prev) => prev.filter((c) => c.id !== candidate.id));
  }
  function fireScout(scoutId) {
    setBusiness((prev) => ({ ...prev, scoutTeam: (prev.scoutTeam || []).filter((c) => c.id !== scoutId) }));
    setScoutMissions((prev) => Object.fromEntries(Object.entries(prev).filter(([id]) => id !== scoutId)));
  }
  function setScoutMission(scoutId, mission) {
    setScoutMissions((prev) => ({ ...prev, [scoutId]: mission ? { ...mission, weeksDone: 0, startDay: currentDay } : null }));
  }
  function refreshScoutMarket() { setScoutMarket(buildScoutMarket(seededRandom((currentDay * 131 + 7) % 233280), 6)); }
  // Semaines d'entraînement (voir engine/training.js) : condition physique pour toutes les
  // équipes (selon les matchs joués et l'endurance de chacun) ; cohésion tactique seulement pour
  // la tienne (les 31 autres restent pleinement rodées, voir buildLines). `schedule` peut avoir un
  // tour de retard sur l'appelant (mise à jour React groupée) : sans conséquence, la fatigue et la
  // cohésion évoluent doucement d'une semaine à l'autre.
  function runTrainingWeeks(fromDay, weeks) {
    const toDay = fromDay + weeks * 7;
    const gamesOf = (teamId) => schedule.filter((g) => g.played && (g.home === teamId || g.away === teamId) && roundDay(seasonYear, g.round) > fromDay && roundDay(seasonYear, g.round) <= toDay).length;
    const myRoster = teamsById[myTeamId]?.roster || [];
    const avgCondition = myRoster.length ? myRoster.reduce((a, p) => a + (p.condition ?? BASE_CONDITION), 0) / myRoster.length : BASE_CONDITION;
    const curCohesion = linesByTeam[myTeamId]?.cohesion ?? 100;
    const upcoming = schedule.filter((g) => !g.played && (g.home === myTeamId || g.away === myTeamId) && roundDay(seasonYear, g.round) <= toDay + 7).length;
    const focus = business.delegation.training === "delegated" ? autoTrainingFocus(avgCondition, curCohesion, upcoming) : business.trainingFocus;
    const coachRatings = [business.staff.headCoach?.rating, business.staff.fitnessCoach?.rating].filter((r) => r != null);
    const coachRating = coachRatings.length ? coachRatings.reduce((a, r) => a + r, 0) / coachRatings.length : 50;
    const fitnessSkill = business.staff.fitnessCoach?.devSkill;
    setTeams((prev) => prev.map((t) => {
      const gpw = gamesOf(t.id) / weeks;
      const f = t.id === myTeamId ? focus : DEFAULT_FOCUS;
      let roster = t.roster;
      for (let w = 0; w < weeks; w++) roster = applyWeeklyCondition(roster, gpw, f, t.id === myTeamId ? fitnessSkill : undefined);
      return roster === t.roster ? t : { ...t, roster };
    }));
    setLinesByTeam((prev) => {
      let cohesion = prev[myTeamId]?.cohesion ?? 100;
      for (let w = 0; w < weeks; w++) cohesion = applyWeeklyCohesion(cohesion, focus, coachRating);
      return cohesion === prev[myTeamId]?.cohesion ? prev : { ...prev, [myTeamId]: { ...prev[myTeamId], cohesion } };
    });
  }
  // Semaines de dépistage (voir engine/scoutingZones.js).
  function runScoutingWeeks(fromDay, weeks) {
    let coverage = scoutCoverage;
    let missions = { ...scoutMissions };
    const known = { ...scoutKnowledge };
    const newReports = {}, suggestions = [], ended = [];
    let spend = 0;
    const bench = teamOvrBenchmark(teamsById[myTeamId]);
    const candidatesOf = (regionId, mission) => {
      if (regionId === "pro") return [
        ...teams.filter((t) => t.id !== myTeamId).flatMap((t) => t.roster.map((player) => ({ player, ownerTeamId: t.id }))),
        ...Object.entries(farmByTeam).filter(([id]) => id !== myTeamId).flatMap(([id, list]) => list.map((player) => ({ player, ownerTeamId: id }))),
        ...freeAgents.map((player) => ({ player, ownerTeamId: null })),
      ];
      const leagues = SCOUT_REGIONS.find((r) => r.id === regionId)?.leagues || [];
      const prospects = draftClass.filter((p) => leagues.includes(p.league)).map((player) => ({ player, ownerTeamId: null }));
      if (mission.target === "draft") return prospects;
      // Tous les joueurs : aussi les espoirs déjà repêchés par les autres équipes, restés dans ces ligues.
      return [...prospects, ...Object.entries(farmByTeam).filter(([id]) => id !== myTeamId).flatMap(([id, list]) => list.filter((p) => leagues.includes(p.league)).map((player) => ({ player, ownerTeamId: id })))];
    };
    for (let w = 0; w < weeks; w++) {
      const day = fromDay + 7 * (w + 1);
      const list = scouts.filter((sc) => missions[sc.id]?.region).map((sc) => ({ scout: sc, mission: missions[sc.id] }));
      const res = weeklyScouting({ missions: list, coverage, candidatesOf, lastReportDay: (id) => known[id]?.day ?? null, day, rng: seededRandom((day * 7919 + 17) % 233280), benchmark: bench });
      coverage = res.coverage;
      spend += res.cost;
      missions = Object.fromEntries(Object.entries(missions).map(([id, m]) => [id, m?.region ? { ...m, weeksDone: (m.weeksDone || 0) + 1 } : m]));
      res.finished.forEach((id) => { ended.push({ scout: scouts.find((x) => x.id === id), mission: missions[id] }); missions[id] = null; });
      res.reports.forEach((r) => {
        known[r.player.id] = r.report; newReports[r.player.id] = r.report;
        if (r.grade !== "D") suggestions.push({ id: `${r.player.id}-${day}`, playerId: r.player.id, playerName: r.player.name, pos: r.player.pos, age: r.player.age, grade: r.grade, note: r.note, regionId: r.regionId, scoutName: r.scoutName, scoutId: r.scoutId, day, ownerTeamId: r.ownerTeamId, draftProspect: !!r.player.draftProspect });
      });
    }
    setScoutCoverage(coverage);
    setScoutMissions(missions);
    if (spend > 0) { setBusiness((prev) => ({ ...prev, cash: prev.cash - spend })); setScoutingSpend((x) => x + spend); }
    if (Object.keys(newReports).length) setScoutKnowledge((prev) => ({ ...prev, ...newReports }));
    ended.forEach(({ scout, mission }) => addMessage({ from: scout?.name || "Service de dépistage", subject: `Mission terminée : ${regionLabel(mission.region)}`, category: "scout", body: `${missionSummary(mission)}.\nMission de ${mission.weeks} semaines terminée : le dépisteur est de retour et attend une nouvelle affectation (onglet Dépistage, « Équipe et missions »).` }));
    if (suggestions.length) {
      setScoutSuggestions((prev) => [...suggestions.reverse(), ...prev.filter((x) => !suggestions.some((y) => y.playerId === x.playerId))].slice(0, 120));
      const top = suggestions.filter((x) => x.grade !== "C");
      if (top.length) addMessage({ from: "Service de dépistage", subject: `Dépistage : ${top.length} joueur${top.length > 1 ? "s" : ""} recommandé${top.length > 1 ? "s" : ""}`, category: "scout", playerIds: top.map((x) => x.playerId), body: top.map((x) => `[${x.grade}] ${x.playerName} (${x.pos}, ${x.age} ans) — ${regionLabel(x.regionId)} · ${x.scoutName}`).join("\n") + `\n\nFrais de mission cette période : ${spend.toLocaleString("fr-CA")} $. Tous les rapports : onglet Dépistage.` });
    }
  }
  // Une demande de dépistage part en mission : le rapport arrive après un délai qui dépend de
  // la cote du dépisteur (voir scoutingDelay), en jours de calendrier.
  function requestScouting(player) {
    if (pendingScouts.some((m) => m.playerId === player.id)) return;
    const scout = assignScout(player, business.staff);
    const delay = scoutingDelay(scout.rating);
    setPendingScouts((prev) => [...prev, { playerId: player.id, playerName: player.name, scout, requestedDay: currentDay, dueDay: currentDay + delay }]);
    addMessage({ from: scout.name, subject: `Mission de dépistage: ${player.name}`, category: "scout", playerIds: [player.id], body: `Dépisteur assigné: ${scout.name} (${attr20(scout.rating)}/20${scout.offSpecialty ? ", hors de sa spécialité" : ""}).\nRapport attendu dans ${delay} jours (vers le ${formatDay(currentDay + delay)}).` });
  }
  function cancelScouting(playerId) {
    setPendingScouts((prev) => prev.filter((m) => m.playerId !== playerId));
  }
  function advanceTo(day) { advanceDays(day - currentDay); }
  function advanceDays(n) {
    if (n <= 0) return;
    const newDay = currentDay + n;
    const due = pendingScouts.filter((m) => m.dueDay <= newDay);
    setCurrentDay(newDay);
    // Rapport de développement et primes : au début de chaque mois.
    const months = monthIndex(newDay) - monthIndex(currentDay);
    if (months > 0) monthlyTick(months, monthLabel(currentDay));
    processWaivers(newDay, teams, waivers);
    const weeks = Math.min(40, Math.floor(newDay / 7) - Math.floor(currentDay / 7));
    if (weeks > 0) runScoutingWeeks(currentDay, weeks);
    if (weeks > 0) runTrainingWeeks(currentDay, weeks);
    const healed = Object.values(injuries).filter((i) => i.until <= newDay);
    if (healed.length) {
      setInjuries((prev) => Object.fromEntries(Object.entries(prev).filter(([, i]) => i.until > newDay)));
      healed.filter((i) => i.teamId === myTeamId && i.ltir).forEach((i) => {
        const p = teamsById[myTeamId].roster.find((q) => q.id === i.playerId);
        if (!p) return;
        const st = capStatus(teamsById[myTeamId].roster, seasonYear, { ...myCapOpts, relief: myCapOpts.relief - (p.contract?.salary || 0), ltirIds: myCapOpts.ltirIds.filter((id) => id !== p.id) });
        addMessage({ from: "Thérapeute de l'équipe", subject: `Retour au jeu : ${p.name}`, category: "general", playerIds: [p.id], body: `${p.name} est rétabli et quitte la LTIR.${st.overCap ? ` Attention : ta masse salariale dépasse maintenant le plafond de ${formatMoney(-st.space)}. Libère de l'espace (échange, renvoi au club-école, rachat en juin).` : ""}${st.rosterSize > ROSTER_MAX ? ` Ton alignement compte ${st.rosterSize} joueurs : il faut revenir à ${ROSTER_MAX}.` : ""}` });
      });
    }
    // Mouvements d'effectif de l'ordinateur au début de chaque mois de saison régulière.
    if (months > 0 && phase === "regular") {
      const moves = aiMonthlyMoves(teams, farmByTeam, myTeamId, newDay, seededRandom(newDay * 17 + 3), 0.2, seasonYear);
      if (moves.placed.length) {
        const out = new Map(moves.teams.map((t) => [t.id, t]));
        const placedIds = new Set(moves.placed.map((w) => w.player.id));
        // Applique sur l'état le plus récent : retire les joueurs placés, ajoute les rappelés.
        setTeams((prev) => prev.map((t) => {
          const m = out.get(t.id);
          if (!m || t.id === myTeamId) return t;
          const added = m.roster.filter((p) => !t.roster.some((x) => x.id === p.id));
          return { ...t, roster: [...t.roster.filter((p) => !placedIds.has(p.id)), ...added].sort((a, b) => b.ovr - a.ovr) };
        }));
        setFarmByTeam((prev) => Object.fromEntries(Object.entries(prev).map(([id, list]) => [id, id === myTeamId ? list : list.filter((p) => (moves.farmByTeam[id] || []).some((x) => x.id === p.id))])));
        setWaivers((prev) => [...prev, ...moves.placed]);
        setLinesByTeam((prev) => {
          const next = { ...prev };
          moves.teams.forEach((t) => { if (t.id !== myTeamId && moves.placed.some((w) => w.fromTeamId === t.id)) next[t.id] = { ...buildLines(t.roster), strategy: prev[t.id].strategy, mentality: prev[t.id].mentality }; });
          return next;
        });
        addMessage({ from: "Ligue", subject: `Ballottage : ${moves.placed.length} joueur${moves.placed.length > 1 ? "s" : ""} disponible${moves.placed.length > 1 ? "s" : ""}`, category: "transaction", playerIds: moves.placed.map((w) => w.player.id), body: moves.placed.map((w) => `- ${w.player.name} (${w.player.pos}, ${w.player.age} ans) — ${teamsById[w.fromTeamId].name}`).join("\n") + "\n\nRéclame-les dans l'onglet Transactions avant l'échéance (24 heures)." });
      }
    }
    if (due.length === 0) return;
    setPendingScouts((prev) => prev.filter((m) => m.dueDay > newDay));
    const reports = {};
    due.forEach((m) => {
      const player = findPlayer(m.playerId);
      if (!player) {
        addMessage({ from: m.scout.name, subject: `Dépistage annulé: ${m.playerName}`, category: "scout", body: `${m.playerName} n'est plus disponible; la mission a été annulée.` });
        return;
      }
      const report = createScoutReport(player, m.scout, m.dueDay);
      reports[player.id] = report;
      addMessage({ from: m.scout.name, subject: `Rapport de dépistage: ${player.name}`, category: "scout", playerIds: [player.id], body: `${report.text}\n\nNote du dépisteur: ${attr20(m.scout.rating)}/20. Rapport complet dans le profil du joueur (onglet Dépistage).` });
    });
    setScoutKnowledge((prev) => ({ ...prev, ...reports }));
  }
  function hireStaff(candidate) {
    setBusiness((prev) => ({ ...prev, staff: { ...prev.staff, [candidate.role]: candidate } }));
    setStaffMarket((prev) => prev.filter((c) => c.id !== candidate.id));
  }
  function fireStaff(role) {
    setBusiness((prev) => ({ ...prev, staff: { ...prev.staff, [role]: null } }));
  }
  function refreshStaffMarket() {
    setStaffMarket(buildStaffMarketRT(6));
  }
  function autoManageHockeyOps() {
    const fillableRoles = ["headCoach", "assistantOff", "assistantDef", "scoutAmateur", "scoutPro"];
    const vacant = fillableRoles.filter((r) => !business.staff[r]);
    if (vacant.length === 0) return;
    let market = [...staffMarket];
    let cash = business.cash;
    const hires = [];
    vacant.forEach((role) => {
      const candidates = market.filter((c) => c.role === role && c.salary < cash * 0.15).sort((a, b) => b.rating - a.rating);
      if (candidates.length > 0) { hires.push(candidates[0]); market = market.filter((c) => c.id !== candidates[0].id); }
    });
    if (hires.length === 0) return;
    setBusiness((prev) => {
      const staff = { ...prev.staff };
      hires.forEach((h) => { staff[h.role] = h; });
      return { ...prev, staff };
    });
    setStaffMarket(market);
    addMessage({ from: "Directeur des opérations hockey", subject: "Embauches déléguées", category: "transaction", body: hires.map((h) => `${STAFF_ROLES[h.role]}: ${h.name} (cote ${h.rating})`).join("\n") });
  }
  function setDelegation(area, mode) {
    setBusiness((prev) => ({ ...prev, delegation: { ...prev.delegation, [area]: mode } }));
  }
  // Nombre de matchs LNH en carrière (pour l'exemption du ballottage).
  function careerGames(playerId) {
    return (careerStats[playerId] || []).filter((c) => !c.playoffs).reduce((a, c) => a + c.gp, 0) + (seasonStats[playerId]?.gp || 0);
  }
  function callUpPlayer(shown) {
    // L'interface montre les valeurs perçues : on travaille toujours sur le vrai joueur.
    const player = (farmByTeam[myTeamId] || []).find((p) => p.id === shown.id) || shown;
    const roster = teamsById[myTeamId].roster;
    if (rosterCount(roster) >= ROSTER_MAX) { setNotice(`Rappel impossible : ton alignement compte déjà ${ROSTER_MAX} joueurs (maximum LNH).`); return; }
    if (!fitsUnderCap(roster, seasonYear, player.contract?.salary || 0, 0, myCapOpts)) { setNotice(`Rappel impossible : le salaire de ${player.name} (${formatMoney(player.contract?.salary || 0)}) dépasse ton espace sous le plafond.`); return; }
    setFarmByTeam((prev) => ({ ...prev, [myTeamId]: prev[myTeamId].filter((p) => p.id !== player.id) }));
    setTeams((prev) => prev.map((t) => (t.id !== myTeamId ? t : { ...t, roster: [...t.roster, { ...player, level: undefined, league: undefined, club: undefined }].sort((a, b) => b.ovr - a.ovr) })));
    addMessage({ from: "Directeur du club-école", subject: `Rappel: ${player.name}`, category: "transaction", playerIds: [player.id], body: `${player.name} (${player.pos}) est rappelé du club-école vers l'équipe.` });
  }
  function sendDownPlayer(shown) {
    const player = teamsById[myTeamId].roster.find((p) => p.id === shown.id) || shown;
    setTeams((prev) => prev.map((t) => (t.id !== myTeamId ? t : { ...t, roster: t.roster.filter((p) => p.id !== player.id) })));
    setLinesByTeam((prev) => ({ ...prev, [myTeamId]: cleanLinesOfPlayer(prev[myTeamId], player.id) }));
    if (waiverExempt(player, careerGames(player.id), seasonYear)) {
      setFarmByTeam((prev) => ({ ...prev, [myTeamId]: [...(prev[myTeamId] || []), { ...player, level: "LAH" }] }));
      addMessage({ from: "Directeur du club-école", subject: `Rétrogradé: ${player.name}`, category: "transaction", playerIds: [player.id], body: `${player.name} est renvoyé au club-école (exempté du ballottage).` });
    } else {
      setWaivers((prev) => [...prev, placeOnWaivers(player, myTeamId, currentDay)]);
      addMessage({ from: "Directeur du club-école", subject: `Ballottage: ${player.name}`, category: "transaction", playerIds: [player.id], body: `${player.name} (${player.age} ans, ${careerGames(player.id)} matchs LNH) n'est pas exempté : il est placé au ballottage pour 24 heures. Les autres équipes peuvent le réclamer avec son contrat (${formatMoney(player.contract?.salary || 0)}). S'il n'est pas réclamé, il rejoindra ton club-école.` });
    }
  }
  function placeOnLtir(playerId) {
    const inj = injuries[playerId];
    if (!ltirEligible(inj, currentDay)) return;
    setInjuries((prev) => ({ ...prev, [playerId]: { ...prev[playerId], ltir: true } }));
    const p = teamsById[myTeamId].roster.find((q) => q.id === playerId);
    addMessage({ from: "Directeur général adjoint", subject: `LTIR : ${p.name}`, category: "transaction", playerIds: [playerId], body: `${p.name} est placé sur la liste des blessés à long terme jusqu'à son retour (vers le ${formatDay(inj.until)}). Sa place dans l'alignement est libérée et tu peux dépasser le plafond de ${formatMoney(p.contract?.salary || 0)} pendant son absence.` });
  }
  // Rachat de contrat : seulement entre la fin des séries et le 1er juillet (fenêtre de la LNH).
  function buyoutPlayer(shown) {
    const player = teamsById[myTeamId].roster.find((p) => p.id === shown.id);
    const terms = player && buyoutTerms(player, seasonYear);
    if (!terms) return;
    setTeams((prev) => prev.map((t) => (t.id !== myTeamId ? t : { ...t, roster: t.roster.filter((p) => p.id !== player.id) })));
    setLinesByTeam((prev) => ({ ...prev, [myTeamId]: cleanLinesOfPlayer(prev[myTeamId], player.id) }));
    setFreeAgents((prev) => [...prev, { ...player, contract: null }]);
    setDeadCap((prev) => [...prev, { label: `Rachat — ${player.name}`, amount: terms.perYear, seasons: terms.seasons, kind: "buyout", playerId: player.id }]);
    addMessage({ from: "Directeur général adjoint", subject: `Rachat de contrat : ${player.name}`, category: "transaction", playerIds: [player.id], body: `${player.name} (${player.age} ans) est racheté : ${Math.round(terms.fraction * 3)}/3 du salaire restant, étalé sur ${terms.seasons.length} saisons.\nImpact sur le plafond : ${formatMoney(terms.perYear)} par saison de ${terms.seasons[0]}-${String(terms.seasons[0] + 1).slice(2)} à ${terms.seasons[terms.seasons.length - 1]}-${String(terms.seasons[terms.seasons.length - 1] + 1).slice(2)} (économie de ${formatMoney(terms.saving)} par saison pendant la durée restante du contrat).\nIl devient agent libre.` });
  }
  // Actions possibles sur un joueur, affichées dans le volet « Gestion du joueur » de son profil
  // (au lieu de boutons dans chaque liste). close : ferme le profil après l'action.
  function playerActions(player) {
    if (!player || !myTeamId) return [];
    const out = [];
    const myRoster = teamsById[myTeamId]?.roster || [];
    const onRoster = myRoster.find((p) => p.id === player.id);
    const inFarm = (farmByTeam[myTeamId] || []).find((p) => p.id === player.id);
    const onWaivers = waivers.find((w) => w.player.id === player.id);
    const isFreeAgent = freeAgents.some((p) => p.id === player.id);
    const draftCurrent = draft?.picks[draft.current];
    const inDraft = draft && draftCurrent && draft.pool.some((p) => p.id === player.id) && !draft.picks.some((k) => k.playerId === player.id);
    if (onRoster) {
      const exempt = waiverExempt(onRoster, careerGames(onRoster.id), seasonYear);
      out.push(exempt
        ? { key: "down", label: "Renvoyer au club-école", color: "var(--steel)", confirmLabel: "Confirmer le renvoi", hint: "Exempté du ballottage : il rejoint directement la LAH.", onClick: () => sendDownPlayer(onRoster), close: true }
        : { key: "down", label: "Placer au ballottage", color: "var(--steel)", confirmLabel: "Confirmer : 24 h au ballottage", hint: `Non exempté (${onRoster.age} ans, ${careerGames(onRoster.id)} matchs LNH) : les autres équipes peuvent le réclamer pendant 24 h.`, onClick: () => sendDownPlayer(onRoster), close: true });
      const inj = injuries[onRoster.id];
      if (inj && inj.until > currentDay) {
        if (inj.ltir) out.push({ key: "ltir", status: `En LTIR jusqu'au ${formatDay(inj.until)} : place libérée, ${formatMoney(onRoster.contract?.salary || 0)} d'allègement.` });
        else if (ltirEligible(inj, currentDay)) out.push({ key: "ltir", label: "Placer sur la LTIR", color: "#7A4E9E", hint: "Libère sa place et permet de dépasser le plafond de son salaire pendant son absence.", onClick: () => placeOnLtir(onRoster.id) });
        else out.push({ key: "ltir", label: "Placer sur la LTIR", color: "#7A4E9E", disabled: true, hint: "LTIR : absence prévue d'au moins 24 jours." });
      }
      out.push({ key: "contract", label: "Nouveau contrat", color: "var(--win)", hint: onRoster.contract ? `Contrat actuel : ${formatMoney(onRoster.contract.salary)} × ${onRoster.contract.years} an${onRoster.contract.years > 1 ? "s" : ""}.` : "", onClick: () => openOffer(onRoster, true) });
      const t = buyoutTerms(onRoster, seasonYear);
      if (["preDraft", "draft", "preFreeAgency"].includes(phase) && t) out.push({ key: "buyout", label: "Racheter le contrat", color: "var(--loss)", confirmLabel: `Confirmer : ${formatMoney(t.perYear)} × ${t.seasons.length} saisons`, hint: `Cap mort de ${formatMoney(t.perYear)} par saison pendant ${t.seasons.length} saisons ; il devient agent libre.`, onClick: () => buyoutPlayer(onRoster), close: true });
    } else if (inFarm) {
      const full = rosterCount(myRoster) >= ROSTER_MAX;
      const noCap = !fitsUnderCap(myRoster, seasonYear, inFarm.contract?.salary || 0, 0, myCapOpts);
      out.push({ key: "up", label: "Rappeler dans la LNH", color: "var(--win)", disabled: full || noCap, hint: full ? `Alignement complet (${ROSTER_MAX} joueurs) : renvoie quelqu'un d'abord.` : noCap ? "Pas assez d'espace sous le plafond." : `Salaire : ${formatMoney(inFarm.contract?.salary || 0)}.`, onClick: () => callUpPlayer(inFarm), close: true });
    } else if (onWaivers) {
      if (onWaivers.fromTeamId === myTeamId) out.push({ key: "waivers", status: `Au ballottage jusqu'au ${formatDay(onWaivers.expiresDay)}. S'il n'est pas réclamé, il rejoindra ton club-école.` });
      else {
        const claimed = myClaims.includes(player.id);
        const fits = fitsUnderCap(myRoster, seasonYear, onWaivers.player.contract?.salary || 0, 0, myCapOpts) && rosterCount(myRoster) < ROSTER_MAX;
        out.push({ key: "claim", label: claimed ? "Annuler la réclamation" : "Réclamer au ballottage", color: claimed ? "var(--red)" : "var(--win)", disabled: !claimed && !fits, hint: claimed ? `Réclamation déposée. Attribution le ${formatDay(onWaivers.expiresDay)}, priorité à la pire équipe.` : fits ? `Tu reprends son contrat (${formatMoney(onWaivers.player.contract?.salary || 0)}). Priorité à la pire équipe au classement.` : "Pas de place ou d'espace sous le plafond.", onClick: () => toggleClaim(player.id) });
      }
    } else if (isFreeAgent) {
      out.push({ key: "sign", label: "Offrir un contrat", color: "var(--win)", requiresKnown: true, disabled: !txWindow.open, hint: txWindow.open ? "Dépiste-le d'abord pour connaître sa valeur." : txWindow.reason, onClick: () => openOffer(player, false) });
    }
    const inClass = draftClass.some((p) => p.id === player.id);
    if (inClass) {
      const idx = myDraftIds.indexOf(player.id);
      out.push(idx >= 0
        ? { key: "list", label: "Retirer de ma liste de repêchage", color: "var(--steel)", hint: `N° ${idx + 1} de ta liste (onglet Dépistage, « Ma liste de repêchage »).`, onClick: () => toggleDraftList(player.id) }
        : { key: "list", label: "Ajouter à ma liste de repêchage", color: "var(--accent)", hint: `Il prendra le n° ${myDraftIds.length + 1}. Lors du repêchage, tes choix automatiques suivent ta liste.`, onClick: () => toggleDraftList(player.id) });
    }
    if (onRoster || inFarm || onWaivers || isFreeAgent) {
      // déjà traité
    } else if (inDraft) {
      const myTurn = draftCurrent.teamId === myTeamId;
      out.push({ key: "draft", label: `Repêcher (choix n° ${draftCurrent.overall})`, color: "var(--win)", disabled: !myTurn, hint: myTurn ? "C'est ton tour au micro." : `${teamsById[draftCurrent.teamId].name} est au micro : avance jusqu'à ton choix.`, onClick: () => runDraft({ myPlayerId: player.id, untilMine: true }), close: true });
    }
    return out;
  }
  function toggleClaim(playerId) {
    setMyClaims((prev) => (prev.includes(playerId) ? prev.filter((x) => x !== playerId) : [...prev, playerId]));
  }
  // Ballottages échus : attribution par priorité (pire classement d'abord).
  function processWaivers(newDay, baseTeams, baseWaivers) {
    if (baseWaivers.length === 0) return;
    const priority = [...standings].reverse().map((x) => x.id);
    const { remaining, results } = resolveWaivers(baseWaivers, newDay, baseTeams, priority, myTeamId, new Set(myClaims), seasonYear, myCapOpts);
    if (results.length === 0) return;
    setWaivers(remaining);
    setMyClaims((prev) => prev.filter((id) => !results.some((r) => r.player.id === id)));
    setTeams((prev) => prev.map((t) => {
      const won = results.filter((r) => r.claimedBy === t.id).map((r) => ({ ...r.player, level: undefined }));
      return won.length ? { ...t, roster: [...t.roster, ...won].sort((a, b) => b.ovr - a.ovr) } : t;
    }));
    setFarmByTeam((prev) => {
      const next = { ...prev };
      results.filter((r) => !r.claimedBy).forEach((r) => { next[r.fromTeamId] = [...(next[r.fromTeamId] || []), { ...r.player, level: "LAH" }]; });
      return next;
    });
    results.forEach((r) => {
      if (r.fromTeamId !== myTeamId && r.claimedBy !== myTeamId && !myClaims.includes(r.player.id)) return;
      const who = r.claimedBy ? teamsById[r.claimedBy].name : null;
      addMessage({ from: "Ligue", subject: `Ballottage : ${r.player.name} ${who ? `réclamé par ${who}` : "non réclamé"}`, category: "transaction", playerIds: [r.player.id], body: who ? `${r.player.name} passe chez ${who} avec son contrat.` : `${r.player.name} rejoint le club-école de ${teamsById[r.fromTeamId].name}.` });
    });
  }
  // Les équipes de l'ordinateur au-delà de 23 joueurs placent leurs joueurs en trop au ballottage.
  function aiPlaceWaivers(baseTeams, day) {
    const placed = baseTeams.filter((t) => t.id !== myTeamId).flatMap((t) => aiWaiverCandidates(t, day, seasonYear));
    if (placed.length === 0) return baseTeams;
    const ids = new Set(placed.map((w) => w.player.id));
    setWaivers((prev) => [...prev, ...placed]);
    return baseTeams.map((t) => ({ ...t, roster: t.roster.filter((p) => !ids.has(p.id)) }));
  }
  // Progression des joueurs (répétée `months` fois si plusieurs mois passent d'un coup).
  function monthlyTick(months, label) {
    if (business.delegation.hockeyOps === "delegated") autoManageHockeyOps();
    // L'entraîneur physique contribue aussi au développement des joueurs (engine/training.js).
    const devCoaches = [business.staff.headCoach, business.staff.assistantOff, business.staff.assistantDef, business.staff.fitnessCoach].filter(Boolean);
    const coachDev = devCoaches.reduce((a, c) => a + (c.devSkill || 50), 0) / devCoaches.length || 50;
    const scoutProRating = business.staff.scoutPro?.rating || 50;
    const devBonus = ((coachDev - 50) / 50) * 0.5;
    const scoutBonus = ((scoutProRating - 50) / 50) * 0.2;
    const reportEntries = [];
    const updates = {};
    (teamsById[myTeamId]?.roster || []).forEach((p0) => {
      let p = p0;
      for (let m = 0; m < months; m++) {
        const growthRoom = p.potential - p.ovr;
        const ageFactor = p.age <= 19 ? 1.0 : p.age <= 22 ? 0.7 : p.age <= 26 ? 0.3 : -0.15;
        const magnitude = growthRoom > 0 ? growthRoom : 6;
        let delta = Math.round(magnitude * 0.05 * ageFactor * (1 + devBonus + scoutBonus) * (0.4 + Math.random() * 0.8));
        delta = Math.max(-4, Math.min(5, delta));
        if (delta === 0) continue;
        const attrKeys = p.pos === "G" ? [...GOALIE_TECH, ...MENTAL, ...GOALIE_PHYSICAL] : [...OFFENSIVE, ...DEFENSIVE, ...MENTAL, ...PHYSICAL];
        const newAttrs = { ...p.attrs };
        [...attrKeys].sort(() => Math.random() - 0.5).slice(0, 3).forEach((k) => { newAttrs[k] = Math.max(20, Math.min(99, newAttrs[k] + delta)); });
        p = { ...p, attrs: newAttrs, ovr: computeOvr(p.pos, newAttrs) };
      }
      if (p !== p0) { updates[p.id] = p; reportEntries.push({ id: p.id, name: p.name, before: p0.ovr, after: p.ovr, delta: p.ovr - p0.ovr }); }
    });
    setTeams((prev) => prev.map((t) => (t.id !== myTeamId ? t : { ...t, roster: t.roster.map((p) => (updates[p.id] ? { ...p, attrs: updates[p.id].attrs, ovr: updates[p.id].ovr } : p)).sort((a, b) => b.ovr - a.ovr) })));
    const sorted = reportEntries.sort((a, b) => b.delta - a.delta);
    setProgressionReport(sorted);
    const coachName = business.staff.headCoach?.name || "Département de développement";
    const gainers = sorted.filter((r) => r.delta > 0).slice(0, 5);
    const decliners = sorted.filter((r) => r.delta < 0).slice(-5).reverse();
    let body = gainers.length === 0 && decliners.length === 0
      ? "Aucun changement notable ce mois-ci."
      : "";
    if (gainers.length) body += "En progression:\n" + gainers.map((r) => `- ${r.name}: ${r.before} → ${r.after} (+${r.delta})`).join("\n");
    if (decliners.length) body += (body ? "\n\n" : "") + "En baisse:\n" + decliners.map((r) => `- ${r.name}: ${r.before} → ${r.after} (${r.delta})`).join("\n");
    addMessage({ from: coachName, subject: `Rapport de développement — ${label}`, category: "scout", playerIds: [...gainers, ...decliners].map((r) => r.id), body });

    const totalGain = sorted.filter((r) => r.delta > 0).reduce((a, r) => a + r.delta, 0);
    const bonuses = [];
    if (business.staff.financeDirector && profitThisMonth > 0) {
      const amt = Math.round(profitThisMonth * 0.04 * (0.5 + business.staff.financeDirector.rating / 198));
      if (amt > 0) bonuses.push({ name: business.staff.financeDirector.name, role: "Directeur des finances", amt, reason: `${profitThisMonth.toLocaleString()} $ de profit ce mois-ci` });
    }
    [["headCoach", 1], ["assistantOff", 0.5], ["assistantDef", 0.5]].forEach(([role, mult]) => {
      const s = business.staff[role];
      if (s && winsThisMonth > 0) {
        const amt = Math.round(winsThisMonth * 150 * mult * (0.5 + s.rating / 198));
        if (amt > 0) bonuses.push({ name: s.name, role: STAFF_ROLES[role], amt, reason: `${winsThisMonth} victoire${winsThisMonth > 1 ? "s" : ""} ce mois-ci` });
      }
    });
    if (business.staff.scoutPro && totalGain > 0) {
      const amt = Math.round(totalGain * 60 * (0.5 + business.staff.scoutPro.rating / 198));
      if (amt > 0) bonuses.push({ name: business.staff.scoutPro.name, role: "Dépisteur professionnel", amt, reason: `+${totalGain} points de développement cumulés chez les prospects` });
    }
    if (bonuses.length > 0) {
      const totalBonus = bonuses.reduce((a, b) => a + b.amt, 0);
      setBusiness((prev) => ({ ...prev, cash: prev.cash - totalBonus }));
      addMessage({ from: "Ressources humaines", subject: `Primes de performance — ${label}`, category: "finance", body: bonuses.map((b) => `${b.role} (${b.name}): +${b.amt.toLocaleString()} $ — ${b.reason}`).join("\n") });
    }
    setProfitThisMonth(0);
    setWinsThisMonth(0);
  }

  // ---------- Séries éliminatoires ----------
  function startPlayoffs() {
    payPerformanceBonuses();
    const p = createPlayoffs(standings, teamsById, seasonYear);
    setPlayoffs(p);
    const qualified = p.rounds[0].some((x) => x.high === myTeamId || x.low === myTeamId);
    addMessage({ from: "Ligue", subject: `Séries éliminatoires ${seasonYear + 1}`, category: "general", body: qualified ? `Ton équipe est qualifiée ! Adversaire au premier tour : ${teamsById[p.rounds[0].find((x) => x.high === myTeamId || x.low === myTeamId)[p.rounds[0].find((x) => x.high === myTeamId || x.low === myTeamId).high === myTeamId ? "low" : "high"]].name}.` : "Ton équipe n'est pas qualifiée pour les séries cette année." });
    advanceTo(roundDay(seasonYear, Math.max(...schedule.map((g) => g.round))) + 3);
    setTab("playoffs");
  }
  // Enregistre des matchs de séries et annonce les séries terminées.
  function applyPlayoffResults(base, gamesPlayed) {
    let p = base;
    gamesPlayed.forEach((g) => { p = recordPlayoffGame(p, g.seriesId, g); });
    const before = new Set(base.rounds.flat().filter((x) => x.winner).map((x) => x.id));
    p.rounds.flat().filter((x) => x.winner && !before.has(x.id)).forEach((x) => {
      if (x.high !== myTeamId && x.low !== myTeamId && x.round < 3) return;
      const loser = x.winner === x.high ? x.low : x.high;
      addMessage({ from: "Ligue", subject: `${ROUND_NAMES[x.round]} : ${teamsById[x.winner].name} élimine ${teamsById[loser].name}`, category: "general", body: `Série remportée ${Math.max(x.winsHigh, x.winsLow)}-${Math.min(x.winsHigh, x.winsLow)}.` });
    });
    if (p.champion && !base.champion) addMessage({ from: "Ligue", subject: `${teamsById[p.champion].name} remporte la Coupe Stanley !`, category: "general", body: p.champion === myTeamId ? "Félicitations, champion !" : "La saison est terminée. Prochaine étape : le repêchage." });
    setPlayoffs(p);
    return p;
  }
  // Fin de saison régulière : primes de rendement gagnées (contrats d'entrée, 35 ans et plus).
  function payPerformanceBonuses() {
    const lines = [];
    let total = 0;
    teamsById[myTeamId].roster.forEach((p) => {
      const won = earnedBonuses(p.contract, seasonStats[p.id]);
      const all = p.contract?.bonuses || [];
      if (!all.length) return;
      const sum = won.reduce((a, b) => a + b.amount, 0);
      total += sum;
      lines.push(`- ${p.name} : ${won.length ? won.map(bonusLabel).join(", ") : "aucune prime atteinte"} (${money(sum)} sur ${money(all.reduce((a, b) => a + b.amount, 0))} possibles)`);
    });
    if (!lines.length) return;
    if (total > 0) setBusiness((prev) => ({ ...prev, cash: prev.cash - total * 1000 }));
    addMessage({ from: "Directeur général adjoint", subject: `Primes de rendement : ${money(total)}`, category: "transaction", body: `Primes de fin de saison régulière :\n${lines.join("\n")}` });
  }
  // Une journée des séries : chaque série en retard joue son prochain match (un jour sur deux).
  function simPlayoffDay(all = false) {
    if (!playoffs || playoffs.champion) return;
    const r = seededRandom(rngSeed * 3 + playoffs.rounds.flat().reduce((a, x) => a + x.games.length, 0));
    let p = playoffs, days = 0, inj = injuries;
    const played = [], fresh = [];
    do {
      const act = activeSeries(p);
      if (act.length === 0) break;
      const minLen = Math.min(...act.map((x) => x.games.length));
      const slate = playSlate(act.filter((x) => x.games.length === minLen).map((x) => {
        const n = nextGameOf(x);
        return { id: `${x.id}-G${n.number}`, home: n.home, away: n.away, playoff: true, seriesId: x.id, round: x.round };
      }), currentDay + days + 2, inj, r, { playoff: true });
      inj = slate.injuries; fresh.push(...slate.fresh);
      const todays = slate.played;
      todays.forEach((g) => { p = recordPlayoffGame(p, g.seriesId, g); });
      played.push(...todays);
      days += 2;
    } while (all && !p.champion);
    applyPlayoffResults(playoffs, played);
    processFinance(played);
    setInjuries(inj);
    announceInjuries(fresh.filter((x) => x.until > currentDay + days));
    setRngSeed((x) => x + 11);
    advanceDays(days);
  }

  // ---------- Repêchage ----------
  function goToDraft() {
    advanceTo(dates.draft);
    const baseOrder = draftOrder(standings, playoffs);
    const ineligible = lotteryIneligible(lotteryHistory, seasonYear);
    const lottery = runDraftLottery(baseOrder, 16, seededRandom(seasonYear * 101 + 7), ineligible);
    setLotteryHistory((prev) => [...prev, { year: seasonYear, winners: lottery.winners }]);
    setDraft({ ...createDraft(seasonYear, lottery.order), lottery: { draws: lottery.draws, baseOrder, ineligible: [...ineligible] } });
    addMessage({ from: "Ligue", subject: `Loterie du repêchage ${seasonYear + 1}`, category: "general", body: lottery.draws.map((d) => `Choix n° ${d.pick} : ${teamsById[d.winner].name} (${d.from}e pire dossier)${d.movedTo ? ` — ${teamsById[d.drawn].name}, tirée, ne peut monter que de 10 rangs et passe au ${d.movedTo}e rang` : ""}`).join("\n") });
    const expiring = (teamsById[myTeamId]?.roster || []).filter((p) => (p.contract?.years ?? 1) <= 1);
    if (expiring.length) addMessage({ from: "Directeur général adjoint", subject: `Contrats échus le ${formatDay(dates.freeAgency)}`, category: "transaction", playerIds: expiring.map((p) => p.id), body: `Ces joueurs deviendront agents libres le 1er juillet si tu ne les prolonges pas (onglet Contrats) :\n${expiring.map((p) => `- ${p.name} (${p.pos})`).join("\n")}` });
    setTab("draft");
  }
  // Classement du repêchage selon ton personnel (rapport de dépistage s'il existe).
  function myDraftChoice(d) {
    const taken = new Set(d.picks.map((k) => k.playerId).filter(Boolean));
    // Ta liste de repêchage d'abord, dans ton ordre ; sinon le classement de ton dépisteur.
    const fromList = (draftList.year === d.year ? draftList.ids : []).find((id) => !taken.has(id) && d.pool.some((p) => p.id === id));
    if (fromList) return d.pool.find((p) => p.id === fromList);
    return d.pool.filter((p) => !taken.has(p.id))
      .map((p) => { const rep = scoutKnowledge[p.id]; const v = rep?.estOvr != null ? { ovr: rep.estOvr, potential: rep.estPotential } : staffViewPlayer(p, business.staff); return { p, score: v.potential * 0.8 + v.ovr * 0.2 }; })
      .sort((a, b) => b.score - a.score)[0]?.p;
  }
  function runDraft({ myPlayerId = null, untilMine = false, all = false }) {
    let d = draft;
    const drafted = [];
    const step = (playerId) => { const res = makePick(d, playerId); d = res.draft; if (res.player) drafted.push({ player: res.player, teamId: res.pick.teamId }); };
    if (myPlayerId && d.picks[d.current]?.teamId === myTeamId) step(myPlayerId);
    while (!draftDone(d)) {
      const pick = d.picks[d.current];
      if (pick.teamId === myTeamId) { if (!all) break; step(myDraftChoice(d).id); }
      else { step(aiPick(d, pick.teamId).id); if (!untilMine && !all) break; }
    }
    setDraft(d);
    setFarmByTeam((prev) => {
      const next = { ...prev };
      drafted.forEach(({ player, teamId }) => { next[teamId] = [...(next[teamId] || []), player]; });
      return next;
    });
    const mine = drafted.filter((x) => x.teamId === myTeamId);
    const elcBonus = mine.reduce((a, x) => a + (x.player.contract?.signingBonus || 0), 0);
    if (elcBonus > 0) setBusiness((prev) => ({ ...prev, cash: prev.cash - elcBonus * 1000 }));
    if (mine.length) addMessage({ from: "Dépisteur amateur", subject: `Repêchage : ${mine.length} choix de ${teamsById[myTeamId].name}`, category: "scout", playerIds: mine.map((x) => x.player.id), body: mine.map((x) => `#${x.player.draftPick} — ${x.player.name} (${x.player.pos}, ${x.player.age} ans) : contrat d'entrée de ${x.player.contract.years} ans à ${money(x.player.contract.salary)} (deux volets)${x.player.contract.signingBonus ? `, prime à la signature ${money(x.player.contract.signingBonus)}` : ""}${x.player.contract.bonuses?.length ? `, primes : ${x.player.contract.bonuses.map(bonusLabel).join(", ")}` : ""}`).join("\n") + "\n\nIls rejoignent ton club-école (onglet Profondeur)." });
  }

  // ---------- 1er juillet : agents libres ----------
  function goToFreeAgency() {
    advanceTo(dates.freeAgency);
    const exp = expireContracts(teams, myTeamId, seasonYear);
    const fa = aiFreeAgency(exp.teams, [...freeAgents, ...exp.released], myTeamId, seasonYear + 1);
    fa.teams = aiPlaceWaivers(fa.teams, currentDay + (dates.freeAgency - currentDay));
    setTeams(fa.teams);
    setFreeAgents(fa.freeAgents);
    setLinesByTeam((prev) => {
      const next = { ...prev };
      fa.teams.forEach((t) => {
        if (t.id === myTeamId) { let l = prev[t.id]; exp.myExpired.forEach((p) => { l = cleanLinesOfPlayer(l, p.id); }); next[t.id] = l; }
        else next[t.id] = { ...buildLines(t.roster), strategy: prev[t.id].strategy, mentality: prev[t.id].mentality };
      });
      return next;
    });
    setFreeAgencyDone(true);
    if (exp.myExpired.length) addMessage({ from: "Directeur général adjoint", subject: "Contrats échus : joueurs partis sur le marché", category: "transaction", playerIds: exp.myExpired.map((p) => p.id), body: exp.myExpired.map((p) => `- ${p.name} (${p.pos})`).join("\n") + "\n\nTu peux encore leur faire une offre dans l'onglet Agents libres." });
    const top = fa.signings.sort((a, b) => b.player.ovr - a.player.ovr).slice(0, 6);
    addMessage({ from: "Ligue", subject: "Ouverture du marché des agents libres", category: "transaction", playerIds: top.map((x) => x.player.id), body: `${exp.released.length} joueurs sont devenus agents libres, ${exp.resigned.length} ont été réengagés par leur équipe.\nPrincipales signatures :\n${top.map((x) => `- ${x.player.name} → ${teamsById[x.teamId].name}`).join("\n") || "aucune"}` });
    setTab("freeagents");
  }

  // ---------- Nouvelle saison ----------
  function startNewSeason() {
    const my = standings.find((x) => x.id === myTeamId);
    setHistory((prev) => [{ year: seasonYear, champion: playoffs?.champion ? teamsById[playoffs.champion].name : "—", presidents: teamsById[standings[0].id].name, myRecord: my ? `${my.w}-${my.l}-${my.otl}, ${my.pts} pts (${standings.indexOf(my) + 1}e)` : "—", topScorer: leaders[0] ? `${leaders[0].player.name} (${leaders[0].pts} pts)` : "—" }, ...prev]);
    setCareerStats((prev) => {
      const next = { ...prev };
      Object.values(seasonStats).filter((st) => st.gp > 0).forEach((st) => { next[st.player.id] = [...(next[st.player.id] || []), { season: seasonYear, team: st.team.name, gp: st.gp, g: st.g, a: st.a, pts: st.pts, plusMinus: st.plusMinus, pim: st.pim }]; });
      Object.values(playoffStats).filter((st) => st.gp > 0).forEach((st) => { next[st.player.id] = [...(next[st.player.id] || []), { season: seasonYear, team: st.team.name, playoffs: true, gp: st.gp, g: st.g, a: st.a, pts: st.pts, plusMinus: st.plusMinus, pim: st.pim }]; });
      return next;
    });
    const aged = aiPlaceWaivers(teams.map((t) => ({ ...t, roster: agePlayers(t.roster).sort((a, b) => b.ovr - a.ovr) })), seasonDates(seasonYear + 1).start - 1);
    setTeams(aged);
    // Club-école : la saison dans la ligue mineure entre dans l'historique ; à 21 ans, un espoir
    // quitte le junior pour la LAH.
    setFarmByTeam((prev) => Object.fromEntries(Object.entries(prev).map(([id, list]) => [id, agePlayers(list.map((p) => {
      const lg = leagueOf(p, teamsById[id]?.name);
      const line = lg && minorSeasonStats(p, lg.league, seasonYear, 1);
      return line ? { ...p, minorHistory: [...(p.minorHistory || []), { season: seasonYear, club: lg.club, ...line }] } : p;
    })).map(promoteFromJunior)])));
    setFreeAgents((prev) => agePlayers(prev));
    setSchedule(buildSchedule(aged));
    setLinesByTeam((prev) => Object.fromEntries(aged.map((t) => [t.id, t.id === myTeamId ? prev[t.id] : { ...buildLines(t.roster), strategy: prev[t.id].strategy, mentality: prev[t.id].mentality }])));
    setPlayoffs(null);
    setDraft(null);
    setScoutingSpend(0);
    setFreeAgencyDone(false);
    setSeasonYear(seasonYear + 1);
    advanceTo(seasonDates(seasonYear + 1).start - 1);
    addMessage({ from: "Ligue", subject: `Saison ${seasonYear + 1}-${seasonYear + 2}`, category: "general", body: `Premier match le ${formatDay(seasonDates(seasonYear + 1).start)}. Date limite des échanges : ${formatDay(seasonDates(seasonYear + 1).tradeDeadline)}.` });
    setTab("roster");
  }

  if (!myTeamId) {
    return (
      <div style={{ ...VARS, minHeight: "600px", background: "var(--navy)", color: "var(--ice)", fontFamily: "Barlow, 'Segoe UI', system-ui, sans-serif", padding: "40px 24px" }}>
        <style>{FONT_IMPORT}</style>
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          <div style={{ fontFamily: "Oswald, sans-serif", fontSize: 13, letterSpacing: 2, color: "var(--iceMuted)", marginBottom: 6 }}>SIMULATION DE GESTION — LIGUE FICTIVE</div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <h1 style={{ fontFamily: "Oswald, sans-serif", fontWeight: 700, fontSize: 40, margin: "0 0 8px" }}>{showCustomization ? "Personnalisation" : "Choisis ton équipe"}</h1>
            <button onClick={() => setShowCustomization((v) => !v)} style={btnStyle(showCustomization ? "var(--red)" : "var(--steel)")}><Palette size={14} /> {showCustomization ? "Retour au choix d'équipe" : "Personnalisation"}</button>
          </div>
          {showCustomization ? <div style={{ marginTop: 16 }}><CustomizationPanel teams={teams} inGame={false} onNewGame={() => { setShowCustomization(false); onNewGame?.(); }} /></div> : <>
          <p style={{ color: "var(--iceMuted)", fontSize: 15, maxWidth: 520, marginBottom: 32 }}>Gère tes trios, tes paires et tes gardiens, avance le calendrier et surveille les meneurs statistiques.</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: 12 }}>
            {teams.map((t) => {
              const s = teamStrength(t, linesByTeam[t.id]);
              return (
                <button key={t.id} className="team-card" onClick={() => setMyTeamId(t.id)} style={{ "--team": t.color, textAlign: "left", background: `linear-gradient(135deg, ${t.color}22, var(--navy2) 55%)`, border: `1px solid ${t.color}55`, borderLeft: `4px solid ${t.color}`, borderRadius: 8, padding: "14px 16px", color: "var(--ice)", cursor: "pointer", display: "flex", gap: 12, alignItems: "center" }}>
                  <TeamCrest team={t} size={38} />
                  <div>
                    <div style={{ fontFamily: "Oswald, sans-serif", fontWeight: 600, fontSize: 18 }}>{t.name}</div>
                    <div style={{ fontSize: 12, color: "var(--iceMuted)", marginTop: 2 }}>ATT {Math.round(s.offense)} · DÉF {Math.round(s.defense)}</div>
                  </div>
                </button>
              );
            })}
          </div>
          </>}
        </div>
      </div>
    );
  }

  const myTeam = myTeamView;
  const myLines = linesByTeam[myTeamId];
  const myStanding = standings.find((s) => s.id === myTeamId);
  const myRank = standings.findIndex((s) => s.id === myTeamId) + 1;
  const navItems = [
    { key: "roster", label: "Alignement", icon: Users },
    { key: "lines", label: "Trios", icon: Layers },
    { key: "roles", label: "Rôles", icon: UserCog },
    { key: "depth", label: "Profondeur", icon: Network },
    { key: "strategy", label: "Stratégie", icon: Sliders },
    { key: "schedule", label: "Calendrier", icon: CalendarDays },
    { key: "stats", label: "Statistiques", icon: BarChart3 },
    { key: "transactions", label: "Transactions", icon: ArrowLeftRight },
    { key: "freeagents", label: "Agents libres", icon: UserPlus },
    { key: "contracts", label: "Contrats", icon: FileText },
    { key: "finances", label: "Finances", icon: DollarSign },
    { key: "staff", label: "Personnel", icon: UserCog },
    { key: "inbox", label: "Messagerie", icon: Mail },
    { key: "standings", label: "Classement", icon: Trophy },
    { key: "playoffs", label: "Séries", icon: Award },
    { key: "scouting", label: "Dépistage", icon: Binoculars },
    { key: "draft", label: "Repêchage", icon: ListOrdered },
    { key: "custom", label: "Personnalisation", icon: Palette },
  ];

  return (
    <div style={{ ...VARS, minHeight: "640px", background: "var(--navy)", color: "var(--ice)", fontFamily: "Barlow, 'Segoe UI', system-ui, sans-serif", display: "flex" }}>
      <style>{FONT_IMPORT}</style>
      {selectedPlayer && <PlayerModal player={selectedPlayer.player} team={selectedPlayer.team} myTeam={myTeam} lines={selectedPlayer.team ? linesByTeam[selectedPlayer.team.id] : null} editable={selectedPlayer.team?.id === myTeamId} seasonStats={seasonStats} playoffStats={playoffStats} careerStats={careerStats} injuries={injuries} seasonYear={seasonYear} staff={business.staff} myTeamId={myTeamId} scoutKnowledge={scoutKnowledge} pendingScouts={pendingScouts} currentDay={currentDay} onRequestScout={requestScouting} onCancelScout={cancelScouting} onClose={() => setSelectedPlayer(null)} onEdit={openEditPlayer} actions={playerActions(selectedPlayer.player)} minorLine={minorLine(selectedPlayer.player)} />}
      {offerTarget && <ContractOfferModal capSpace={capStatus(teamsById[myTeamId].roster, seasonYear, myCapOpts).space + (offerTarget.isRenewal ? capHit(offerTarget.player.contract) : 0)} player={offerTarget.isRenewal ? staffViewPlayer(offerTarget.player, business.staff) : offerTarget.player} realPlayer={realPlayer(offerTarget.player)} isRenewal={offerTarget.isRenewal} team={myTeam} context={offerContext(realPlayer(offerTarget.player), offerTarget.isRenewal)} stats={seasonStats[offerTarget.player.id]} onClose={() => setOfferTarget(null)} onSubmit={submitOffer} />}
      {watchingGame && <LiveMatchViewer game={watchingGame} home={teamsById[watchingGame.home]} away={teamsById[watchingGame.away]} onClose={() => setWatchingGame(null)} onSelectPlayer={selectPlayer} />}
      {editingPlayer && <PlayerEditorModal initial={editingPlayer.initial} isNew={editingPlayer.isNew} team={teamsById[myTeamId]} onSave={savePlayer} onClose={() => setEditingPlayer(null)} />}
      <div style={{ width: 200, background: `linear-gradient(180deg, ${myTeam.color}33, var(--navy2) 160px)`, padding: "20px 12px", display: "flex", flexDirection: "column", gap: 3, borderRight: "1px solid var(--line)" }}>
        <div style={{ padding: "0 8px 16px", display: "flex", alignItems: "center", gap: 10 }}>
          <TeamCrest team={myTeam} size={34} />
          <div style={{ fontFamily: "Oswald, sans-serif", fontWeight: 600, fontSize: 16, color: myTeam.color, lineHeight: 1.15 }}>{myTeam.name}</div>
        </div>
        {navItems.map(({ key, label, icon: Icon }) => (
          <button key={key} className={`nav-btn${tab === key ? " is-active" : ""}`} onClick={() => setTab(key)} style={{ display: "flex", alignItems: "center", gap: 9, padding: "8px 11px", borderRadius: 7, border: "none", background: tab === key ? "linear-gradient(90deg, rgba(92,200,255,0.20), rgba(92,200,255,0.04))" : "transparent", color: tab === key ? "var(--ice)" : "var(--iceMuted)", fontSize: 14, fontWeight: tab === key ? 600 : 500, cursor: "pointer", textAlign: "left" }}>
            <Icon size={16} color={tab === key ? "var(--accent)" : "currentColor"} /> {label}
            {key === "inbox" && messages.filter((m) => !m.read).length > 0 && (
              <span style={{ marginLeft: "auto", background: "var(--red)", color: "#fff", borderRadius: 10, fontSize: 10, padding: "1px 6px", fontWeight: 700 }}>{messages.filter((m) => !m.read).length}</span>
            )}
          </button>
        ))}
        <div style={{ marginTop: "auto", padding: "0 8px", fontSize: 11, color: "var(--iceMuted)" }}><span style={{ color: "var(--ice)" }}>{formatDay(currentDay)}</span><br />Plafond : <CapSummary roster={teamsById[myTeamId].roster} year={seasonYear} opts={myCapOpts} compact /><br />Rang: <span style={{ color: "var(--ice)" }}>{myRank}e</span> · {myStanding?.pts ?? 0} pts</div>
      </div>
      <div key={tab} className="tab-view" style={{ flex: 1, padding: "24px 32px", overflow: "auto", background: "radial-gradient(1100px 480px at 75% -12%, rgba(92,200,255,0.08), transparent 60%)" }}>
        {notice && <div onClick={() => setNotice(null)} style={{ background: "#B84A4A33", border: "1px solid var(--loss)", borderRadius: 4, padding: "10px 14px", marginBottom: 16, fontSize: 13, cursor: "pointer" }}>{notice} <span style={{ color: "var(--iceMuted)", fontSize: 11 }}>(clique pour fermer)</span></div>}
        {liveMatch && <LiveSimPanel liveMatch={liveMatch} myTeamId={myTeamId} linesByTeam={linesByTeam} onSelectPlayer={selectPlayer} onNextPeriod={() => playLive(false)} onEndOfPeriod={() => playLive(true)} onFinish={finishLiveMatch} onGoToLines={() => setTab("lines")} onGoToStrategy={() => setTab("strategy")}
          shiftPicker={shiftPicker} onOpenShiftPicker={openShiftPicker} onPickForward={(i) => updateShiftPicker({ forwardIdx: i })} onPickDefense={(i) => updateShiftPicker({ defenseIdx: i })} onSendShift={sendShift} onCancelShift={cancelShiftPicker} />}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ fontSize: 12, color: "var(--gold)", marginBottom: 3 }}>{formatDay(currentDay)} · Saison {seasonYear}-{seasonYear + 1} · {PHASE_LABEL[phase]}</div>
            {nextMyGame ? (
              <div style={{ fontSize: 14 }}>Prochain match — <strong>{teamsById[nextMyGame.home].name}</strong> vs <strong>{teamsById[nextMyGame.away].name}</strong><span style={{ color: "var(--iceMuted)" }}> ({typeof nextMyGame.round === "number" ? `${formatDay(roundDay(seasonYear, nextMyGame.round))}` : nextMyGame.round})</span></div>
            ) : (<div style={{ fontSize: 14, color: "var(--iceMuted)" }}>{NEXT_STEP[phase]}</div>)}
            <div style={{ fontSize: 11, color: txWindow.open ? "var(--iceMuted)" : "var(--loss)", marginTop: 3 }}>{txWindow.open ? "Échanges et signatures ouverts" : "Échanges et signatures gelés"} — {txWindow.reason}</div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {phase === "regular" && <>
              <button onClick={simRound} disabled={!!liveMatch} style={btnStyle("var(--red)")}><Play size={14} /> Simuler la ronde</button>
              <button onClick={simToSeasonEnd} disabled={!!liveMatch} style={btnStyle("var(--steel)")}><FastForward size={14} /> Simuler la saison</button>
            </>}
            {phase === "endRegular" && <button onClick={startPlayoffs} style={btnStyle("var(--red)")}><Award size={14} /> Commencer les séries</button>}
            {phase === "playoffs" && <>
              <button onClick={() => simPlayoffDay(false)} disabled={!!liveMatch} style={btnStyle("var(--red)")}><Play size={14} /> Simuler une journée des séries</button>
              <button onClick={() => simPlayoffDay(true)} disabled={!!liveMatch} style={btnStyle("var(--steel)")}><FastForward size={14} /> Simuler les séries au complet</button>
            </>}
            {phase === "preDraft" && <button onClick={goToDraft} style={btnStyle("var(--red)")}><ListOrdered size={14} /> Aller au repêchage ({formatDay(dates.draft)})</button>}
            {phase === "draft" && <button onClick={() => setTab("draft")} style={btnStyle("var(--red)")}><ListOrdered size={14} /> Repêchage en cours</button>}
            {phase === "preFreeAgency" && <button onClick={goToFreeAgency} style={btnStyle("var(--red)")}><UserPlus size={14} /> Avancer au 1er juillet (agents libres)</button>}
            {phase === "offseason" && <button onClick={startNewSeason} style={btnStyle("var(--red)")}><Play size={14} /> Commencer la saison {seasonYear + 1}-{seasonYear + 2}</button>}
            {nextMyGame && !liveMatch && <button onClick={() => startLiveMatch(nextMyGame)} style={btnStyle("var(--win)")}>Sim en direct (mon prochain match)</button>}
          </div>
        </div>

        {tab === "roster" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
              <h2 style={{ ...h2Style, marginBottom: 0 }}>Alignement</h2>
              <button onClick={openCreatePlayer} style={btnStyle("var(--win)")}>+ Créer un joueur</button>
            </div>
            <p style={{ fontSize: 12, color: "var(--iceMuted)", marginTop: 6, marginBottom: 14 }}>Clique un joueur pour voir ses cotes détaillées, puis "Modifier ce joueur" pour l'éditer.</p>
            <RosterTable roster={myTeam.roster} lines={myLines} staff={business.staff} myTeamId={myTeamId} teamId={myTeamId} scoutKnowledge={scoutKnowledge} onSelect={(p) => selectPlayer(p, myTeam)} injuries={injuries} day={currentDay} />
          </div>
        )}

        {tab === "lines" && <TacticsPlanner team={myTeam} lines={myLines} onAssign={updateLine} onSwap={swapLineSlots} onChangeRole={updateRole} onNaturalRoles={resetNaturalRoles} onAutoLines={autoOptimizeLines} onChangeSystem={updateSpecialSystem} onBestSystem={bestSpecialSystem} onAutoUnits={autoSpecialUnits} onSelectPlayer={selectPlayer} />}

        {tab === "depth" && <DepthChartPanel team={myTeam} farm={myFarmView} lines={myLines} needsWaivers={(p) => !waiverExempt(p, careerGames(p.id), seasonYear)} onSelectPlayer={selectPlayer} injuries={injuries} day={currentDay} cap={capStatus(teamsById[myTeamId].roster, seasonYear, myCapOpts)} />}

        {tab === "roles" && <RolesPanel team={myTeam} lines={myLines} onChangeRole={updateRole} onNaturalRoles={resetNaturalRoles} onSelectPlayer={selectPlayer} />}

        {tab === "strategy" && <StrategyEditor team={myTeam} lines={myLines} onChangeStrategy={updateStrategy} onChangeMentality={updateMentality} onAutoStrategy={autoOptimizeStrategy} onSelectPlayer={selectPlayer} />}

        {tab === "transactions" && <TransactionsCenter myTeam={myTeam} teams={teams} myTeamId={myTeamId} staff={business.staff} scoutKnowledge={scoutKnowledge} pendingScouts={pendingScouts} onRequestScout={requestScouting} onSelectPlayer={selectPlayer} onTrade={executeTrade} txWindow={txWindow} />}
        {tab === "transactions" && <CapSummary roster={teamsById[myTeamId].roster} year={seasonYear} opts={myCapOpts} />}
        {tab === "transactions" && <WaiversPanel waivers={waivers} myTeam={teamsById[myTeamId]} myTeamId={myTeamId} myClaims={myClaims} year={seasonYear} teamsById={teamsById} capOpts={myCapOpts} onSelectPlayer={selectPlayer} />}

        {tab === "freeagents" && <FreeAgentsPanel myTeam={myTeam} myTeamId={myTeamId} staff={business.staff} scoutKnowledge={scoutKnowledge} pendingScouts={pendingScouts} onSelectPlayer={(p) => selectPlayer(p, null)} freeAgents={freeAgents} onRefreshFreeAgents={refreshFreeAgents} txWindow={txWindow} />}

        {tab === "contracts" && <CapSummary roster={teamsById[myTeamId].roster} year={seasonYear} opts={myCapOpts} />}
        {tab === "contracts" && <ContractsPanel myTeam={myTeam} onSelectPlayer={selectPlayer} seasonYear={seasonYear} buyoutOpen={["preDraft", "draft", "preFreeAgency"].includes(phase)} deadCap={deadCap} />}

        {tab === "staff" && <StaffCenter business={business} staffMarket={staffMarket} myTeam={myTeam} month={monthLabel(currentDay)} progressionReport={progressionReport} onHire={hireStaff} onFire={fireStaff} onRefresh={refreshStaffMarket} onSetDelegation={setDelegation} onSelectPlayer={selectPlayer} cohesion={linesByTeam[myTeamId]?.cohesion ?? 100} onSetTrainingFocus={setTrainingFocus} />}

        {tab === "custom" && <CustomizationPanel teams={teams} inGame onNewGame={onNewGame} />}

        {tab === "inbox" && <InboxPanel messages={messages} onMarkRead={markRead} findPlayer={findPlayer} onOpenPlayer={openPlayerById} />}

        {tab === "finances" && <FinancesPanel business={business} teamCapacity={myTeam.capacity} onSetTierPrice={setTierPrice} onSetParkingPrice={setParkingPrice} onSetItemPrice={setItemPrice} onUpgrade={upgradeFacility} />}

        {tab === "schedule" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
              <h2 style={{ ...h2Style, marginBottom: 0 }}>Calendrier</h2>
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={() => setScheduleFilter("all")} style={{ ...btnStyle(scheduleFilter === "all" ? "var(--red)" : "var(--steel)"), fontSize: 12 }}>Calendrier complet</button>
                <button onClick={() => setScheduleFilter("mine")} style={{ ...btnStyle(scheduleFilter === "mine" ? "var(--red)" : "var(--steel)"), fontSize: 12 }}>Mon équipe seulement</button>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14, maxHeight: 520, overflow: "auto", paddingRight: 6, marginTop: 12 }}>
              {rounds.map((r) => {
                const roundGames = schedule.filter((g) => g.round === r && (scheduleFilter === "all" || g.home === myTeamId || g.away === myTeamId));
                if (roundGames.length === 0) return null;
                return (
                <div key={r}>
                  <div style={{ fontSize: 11, color: "var(--iceMuted)", letterSpacing: 1, marginBottom: 6 }}>RONDE {r}</div>
                  {roundGames.map((g) => {
                    const involved = g.home === myTeamId || g.away === myTeamId;
                    const expanded = expandedGameId === g.id;
                    return (
                      <div key={g.id} style={{ marginBottom: 4 }}>
                        <div onClick={() => g.played && setExpandedGameId(expanded ? null : g.id)} style={{ display: "flex", alignItems: "center", gap: 10, background: involved ? "var(--navy2)" : "#ffffff08", padding: "8px 12px", borderRadius: 3, fontSize: 14, cursor: g.played ? "pointer" : "default", border: involved ? `1px solid ${myTeam.color}44` : "1px solid transparent" }}>
                          {g.played ? <Circle size={6} fill={g.homeScore > g.awayScore ? "var(--win)" : "var(--loss)"} color="none" /> : <Circle size={6} fill="var(--iceMuted)" color="none" />}
                          <span style={{ flex: 1 }}>{teamsById[g.home].name}</span>
                          <span style={{ fontFamily: "Oswald, sans-serif", fontWeight: 600, minWidth: 50, textAlign: "center" }}>{g.played ? `${g.homeScore} – ${g.awayScore}${g.decidedIn === "OT" ? " (P)" : g.decidedIn === "SO" ? " (TB)" : ""}` : "à venir"}</span>
                          <span style={{ flex: 1, textAlign: "right" }}>{teamsById[g.away].name}</span>
                          {g.played && <button onClick={(e) => { e.stopPropagation(); setWatchingGame(g); }} style={{ ...btnStyle("var(--red)"), fontSize: 11, padding: "4px 8px" }}>Regarder</button>}
                          {g.played && (expanded ? <ChevronUp size={14} color="var(--iceMuted)" /> : <ChevronDown size={14} color="var(--iceMuted)" />)}
                        </div>
                        {expanded && g.played && <BoxscoreView game={g} teamsById={teamsById} linesByTeam={linesByTeam} onSelectPlayer={selectPlayer} />}
                      </div>
                    );
                  })}
                </div>
                );
              })}
            </div>
          </div>
        )}

        {tab === "stats" && <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
          {[["regular", "Saison régulière"], ["playoffs", "Séries éliminatoires"]].map(([k, l]) => <button key={k} onClick={() => setStatsMode(k)} style={{ ...btnStyle(statsMode === k ? "var(--red)" : "var(--steel)"), fontSize: 12 }}>{l}</button>)}
        </div>}
        {tab === "stats" && statsMode === "playoffs" && playoffLeaders.length === 0 && <p style={{ fontSize: 13, color: "var(--iceMuted)" }}>Aucun match de séries joué pour l'instant.</p>}
        {tab === "stats" && <StatsTables leaders={statsMode === "playoffs" ? playoffLeaders : leaders} standings={standings} teamHitTotals={teamHitTotals} teamAdvancedTotals={teamAdvancedTotals} teamsById={teamsById} myTeamId={myTeamId} onSelectPlayer={selectPlayer} />}

        {tab === "standings" && <StandingsTable standings={standings} teamsById={teamsById} myTeamId={myTeamId} history={history} />}

        {tab === "playoffs" && <PlayoffsPanel playoffs={playoffs} teamsById={teamsById} myTeamId={myTeamId} linesByTeam={linesByTeam} onSelectPlayer={selectPlayer} />}

        {tab === "scouting" && <ScoutingCenter scouts={scouts} missions={scoutMissions} coverage={scoutCoverage} onSetMission={setScoutMission} market={scoutMarket} onHire={hireScout} onFire={fireScout} onRefreshMarket={refreshScoutMarket} spend={scoutingSpend} cash={business.cash} maxExtra={MAX_EXTRA_SCOUTS} staff={business.staff}
          suggestions={scoutSuggestions} draftClass={draftClass} classYear={classYear} myTeam={myTeam} myTeamId={myTeamId} scoutKnowledge={scoutKnowledge} pendingScouts={pendingScouts} teamsById={teamsById}
          draftIds={myDraftIds} onReorder={setMyDraftIds} onRemoveFromList={toggleDraftList} draft={draft} minorLine={minorLine} onSelectPlayer={selectPlayer} onOpenPlayerById={openPlayerById} />}

        {tab === "draft" && (draft
          ? <DraftPanel draft={draft} draftDay={dates.draft} teamsById={teamsById} myTeam={myTeam} staff={business.staff} scoutKnowledge={scoutKnowledge} onSimToMyPick={() => runDraft({ untilMine: true })} onSimAll={() => runDraft({ all: true })} onSelectPlayer={selectPlayer} draftIds={draftList.year === draft.year ? draftList.ids : []} onPickFromList={() => { const p = myDraftChoice(draft); if (p) runDraft({ myPlayerId: p.id, untilMine: true }); }} />
          : <div><h2 style={h2Style}>Repêchage</h2><p style={{ fontSize: 13, color: "var(--iceMuted)" }}>Le repêchage a lieu le {formatDay(dates.draft)}, une semaine avant l'ouverture du marché des agents libres (1er juillet), après les séries. Ordre : équipes hors séries (pire dossier d'abord ; loterie pour les 2 premiers choix), puis selon la ronde d'élimination.</p></div>)}
      </div>
    </div>
  );
}
