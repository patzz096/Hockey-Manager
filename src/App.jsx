import { useState, useMemo } from "react";
import { Users, CalendarDays, Trophy, Play, FastForward, Circle, ChevronDown, ChevronUp, Layers, BarChart3, Sliders, ArrowLeftRight, DollarSign, UserCog, Mail, UserPlus, FileText, Network } from "lucide-react";
import { OFFENSIVE, DEFENSIVE, MENTAL, PHYSICAL, GOALIE_TECH, GOALIE_PHYSICAL, computeOvr, emptyAttrs, attr20 } from "./engine/attributes";
import { evaluateOffer } from "./engine/contracts";
import { DEFAULT_FACILITIES, DEFAULT_TICKET_TIERS, DEFAULT_CONCESSION_ITEMS, DEFAULT_PARKING, facilityUpgradeCost, autoTuneFinances, computeGameFinance } from "./engine/finance";
import { initLeague, buildSchedule, computeStandings } from "./engine/league";
import { buildLines } from "./engine/lines";
import { buildFreeAgentPoolRT } from "./engine/players";
import { seededRandom } from "./engine/random";
import { teamStrength, penaltyPropensity, TOTAL_CHUNKS, simulateChunk, emptyLiveAccum, mergeLivePeriod, simulateGame } from "./engine/simulation";
import { STAFF_ROLES, buildStaffMarketRT } from "./engine/staff";
import { assignScout, scoutingDelay, createScoutReport, staffViewPlayer } from "./engine/scouting";
import { FORECHECK_OPTIONS, DEFENSE_OPTIONS, ENTRY_OPTIONS, EXIT_OPTIONS, computeTeamProfile, getStrategyMultipliers } from "./engine/strategy";
import { VARS, FONT_IMPORT, h2Style, btnStyle } from "./ui/theme";
import { ContractOfferModal } from "./components/ContractOfferModal";
import { ContractsPanel } from "./components/ContractsPanel";
import { DepthChartPanel } from "./components/DepthChartPanel";
import { FinancesPanel } from "./components/FinancesPanel";
import { FreeAgentsPanel } from "./components/FreeAgentsPanel";
import { InboxPanel } from "./components/InboxPanel";
import { LinesEditor } from "./components/LinesEditor";
import { PlayerEditorModal } from "./components/PlayerEditorModal";
import { PlayerModal } from "./components/PlayerModal";
import { RosterTable } from "./components/RosterTable";
import { StaffCenter } from "./components/StaffCenter";
import { StandingsTable } from "./components/StandingsTable";
import { StatsTables } from "./components/StatsTables";
import { StrategyEditor } from "./components/StrategyEditor";
import { TransactionsCenter } from "./components/TransactionsCenter";
import { TeamCrest } from "./components/common";
import { BoxscoreView } from "./components/match/BoxscoreView";
import { LiveMatchViewer } from "./components/match/LiveMatchViewer";
import { LiveSimPanel } from "./components/match/LiveSimPanel";

export default function HockeyGM() {
  const [initial] = useState(initLeague);
  const [teams, setTeams] = useState(initial.teams);
  const [freeAgents, setFreeAgents] = useState(initial.freeAgents);
  const [staffMarket, setStaffMarket] = useState(initial.staffMarket);
  const [scoutKnowledge, setScoutKnowledge] = useState({});
  const [farmByTeam, setFarmByTeam] = useState(initial.farmByTeam);
  const [month, setMonth] = useState(1);
  const [currentDay, setCurrentDay] = useState(1);
  const [pendingScouts, setPendingScouts] = useState([]);
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
  const [tab, setTab] = useState("roster");
  const [rngSeed, setRngSeed] = useState(1000);
  const [expandedGameId, setExpandedGameId] = useState(null);
  const [watchingGame, setWatchingGame] = useState(null);
  const [liveMatch, setLiveMatch] = useState(null);
  const [scheduleFilter, setScheduleFilter] = useState("all");
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [offerTarget, setOfferTarget] = useState(null);
  const [business, setBusiness] = useState({ cash: 50000, ticketTiers: DEFAULT_TICKET_TIERS.map((t) => ({ ...t })), facilities: { ...DEFAULT_FACILITIES }, parking: { ...DEFAULT_PARKING }, concessionItems: DEFAULT_CONCESSION_ITEMS.map((i) => ({ ...i })), staff: { hockeyOpsDirector: null, financeDirector: null, headCoach: null, assistantOff: null, assistantDef: null, scoutAmateur: null, scoutPro: null }, delegation: { finance: "manual", hockeyOps: "manual" }, log: [] });

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
  const nextMyGame = useMemo(() => schedule.find((g) => !g.played && (g.home === myTeamId || g.away === myTeamId)), [schedule, myTeamId]);
  const rounds = useMemo(() => [...new Set(schedule.map((g) => g.round))], [schedule]);

  const seasonStats = useMemo(() => {
    const stats = {};
    teams.forEach((t) => t.roster.forEach((p) => { stats[p.id] = { g: 0, a: 0, pts: 0, hits: 0, pim: 0, shots: 0, plusMinus: 0, blocks: 0, faceoffWins: 0, gp: 0, player: p, team: t }; }));
    schedule.filter((g) => g.played).forEach((g) => {
      const home = teamsById[g.home], away = teamsById[g.away];
      [[g.box.home, home], [g.box.away, away]].forEach(([box, team]) => {
        team.roster.filter((p) => p.pos !== "G").forEach((p) => { stats[p.id].gp++; });
        Object.entries(box.goalsBy).forEach(([id, c]) => { stats[id].g += c; });
        Object.entries(box.assistsBy).forEach(([id, c]) => { stats[id].a += c; });
        Object.entries(box.hitsBy).forEach(([id, c]) => { stats[id].hits += c; });
        Object.entries(box.pimBy || {}).forEach(([id, c]) => { stats[id].pim += c; });
        Object.entries(box.shotsBy || {}).forEach(([id, c]) => { stats[id].shots += c; });
        Object.entries(box.plusMinusBy || {}).forEach(([id, c]) => { stats[id].plusMinus += c; });
        Object.entries(box.blocksBy || {}).forEach(([id, c]) => { stats[id].blocks += c; });
        Object.entries(box.faceoffsWonBy || {}).forEach(([id, c]) => { stats[id].faceoffWins += c; });
      });
    });
    Object.values(stats).forEach((s) => (s.pts = s.g + s.a));
    return stats;
  }, [teams, schedule, teamsById]);

  const leaders = useMemo(() => Object.values(seasonStats).filter((s) => s.player.pos !== "G" && s.gp > 0).sort((a, b) => b.pts - a.pts || b.g - a.g), [seasonStats]);
  const teamHitTotals = useMemo(() => {
    const totals = {};
    teams.forEach((t) => (totals[t.id] = 0));
    Object.values(seasonStats).forEach((s) => { totals[s.team.id] += s.hits; });
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
        const fin = computeGameFinance(teamsById[myTeamId], biz, winPct);
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
    setLiveMatch({ game, home: teamsById[game.home], away: teamsById[game.away], chunk: 1, homeScore: 0, awayScore: 0, accum: emptyLiveAccum() });
  }
  function simulateLiveNextPeriod() {
    setLiveMatch((prev) => {
      if (!prev || prev.chunk > TOTAL_CHUNKS) return prev;
      const staffByTeam = { [myTeamId]: business.staff };
      const result = simulateChunk(prev.home, prev.away, linesByTeam[prev.home.id], linesByTeam[prev.away.id], staffByTeam, prev.chunk, Math.random);
      const accum = mergeLivePeriod(prev.accum, result);
      return { ...prev, accum, homeScore: prev.homeScore + result.periodHomeScore, awayScore: prev.awayScore + result.periodAwayScore, chunk: prev.chunk + 1 };
    });
  }
  function finishLiveMatch() {
    if (!liveMatch) return;
    let { homeScore, awayScore } = liveMatch;
    if (homeScore === awayScore) { if (Math.random() > 0.45) homeScore++; else awayScore++; }
    const finalGame = {
      ...liveMatch.game, played: true, homeScore, awayScore,
      box: { home: liveMatch.accum.home, away: liveMatch.accum.away, goalLog: liveMatch.accum.goalLog, homeGoalie: { saves: liveMatch.accum.home.saves, shotsAgainst: liveMatch.accum.home.shotsAgainst }, awayGoalie: { saves: liveMatch.accum.away.saves, shotsAgainst: liveMatch.accum.away.shotsAgainst } },
    };
    const wins = (finalGame.home === myTeamId && finalGame.homeScore > finalGame.awayScore) || (finalGame.away === myTeamId && finalGame.awayScore > finalGame.homeScore) ? 1 : 0;
    if (wins > 0) setWinsThisMonth((w) => w + wins);
    setSchedule((prev) => prev.map((g) => (g.id === finalGame.id ? finalGame : g)));
    processFinance([finalGame]);
    setLiveMatch(null);
    setWatchingGame(null);
  }
  function simRound() {
    if (currentRound === null) return;
    const staffByTeam = { [myTeamId]: business.staff };
    const newlyPlayed = [];
    const updated = schedule.map((g) => {
      if (!g.played && g.round === currentRound) { const r = simulateGame(g, teamsById, rng, linesByTeam, staffByTeam); newlyPlayed.push(r); return r; }
      return g;
    });
    const wins = newlyPlayed.filter((g) => (g.home === myTeamId && g.homeScore > g.awayScore) || (g.away === myTeamId && g.awayScore > g.homeScore)).length;
    if (wins > 0) setWinsThisMonth((w) => w + wins);
    processFinance(newlyPlayed);
    setSchedule(updated);
    setRngSeed((s) => s + 7);
    advanceDays(1);
  }
  function simToSeasonEnd() {
    const staffByTeam = { [myTeamId]: business.staff };
    const newlyPlayed = [];
    const updated = schedule.map((g) => {
      if (g.played) return g;
      const r = simulateGame(g, teamsById, rng, linesByTeam, staffByTeam); newlyPlayed.push(r); return r;
    });
    const wins = newlyPlayed.filter((g) => (g.home === myTeamId && g.homeScore > g.awayScore) || (g.away === myTeamId && g.awayScore > g.homeScore)).length;
    if (wins > 0) setWinsThisMonth((w) => w + wins);
    processFinance(newlyPlayed);
    setSchedule(updated);
    setRngSeed((s) => s + 13);
    advanceDays(new Set(newlyPlayed.map((g) => g.round)).size);
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
    const fa = freeAgents.find((p) => p.id === playerId);
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
  function updateLine(section, idx, slot, playerId) {
    setLinesByTeam((prev) => {
      const teamLines = prev[myTeamId];
      if (section === "goalies") return { ...prev, [myTeamId]: { ...teamLines, goalies: { ...teamLines.goalies, [slot]: playerId } } };
      const arr = teamLines[section].map((l, i) => (i === idx ? { ...l, [slot]: playerId } : l));
      return { ...prev, [myTeamId]: { ...teamLines, [section]: arr } };
    });
  }
  function getSlotValue(teamLines, section, idx, key) {
    if (section === "goalies") return teamLines.goalies[key];
    return teamLines[section][idx][key];
  }
  function setSlotValue(teamLines, section, idx, key, val) {
    if (section === "goalies") return { ...teamLines, goalies: { ...teamLines.goalies, [key]: val } };
    const arr = teamLines[section].map((l, i) => (i === idx ? { ...l, [key]: val } : l));
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
  function updateStrategy(field, value) {
    setLinesByTeam((prev) => ({ ...prev, [myTeamId]: { ...prev[myTeamId], strategy: { ...prev[myTeamId].strategy, [field]: value } } }));
  }
  function updateMentality(field, value) {
    setLinesByTeam((prev) => ({ ...prev, [myTeamId]: { ...prev[myTeamId], mentality: { ...prev[myTeamId].mentality, [field]: value } } }));
  }
  function updateUnit(unitKey, idx, playerId) {
    setLinesByTeam((prev) => {
      const teamLines = prev[myTeamId];
      const arr = [...teamLines[unitKey]]; arr[idx] = playerId;
      return { ...prev, [myTeamId]: { ...teamLines, [unitKey]: arr } };
    });
  }
  function autoOptimizeLines() {
    const fresh = buildLines(myTeamView.roster);
    setLinesByTeam((prev) => ({ ...prev, [myTeamId]: { ...prev[myTeamId], forwards: fresh.forwards, defense: fresh.defense, goalies: fresh.goalies } }));
  }
  function autoOptimizeSpecialTeams() {
    const fresh = buildLines(myTeamView.roster);
    setLinesByTeam((prev) => ({ ...prev, [myTeamId]: { ...prev[myTeamId], pp: fresh.pp, pk: fresh.pk } }));
  }
  function autoOptimizeStrategy() {
    const team = myTeamView;
    const skaters = team.roster.filter((p) => p.pos !== "G");
    const n = skaters.length || 1;
    const profile = computeTeamProfile(team);
    const avgPenaltyProp = skaters.reduce((a, p) => a + penaltyPropensity(p), 0) / n;
    let best = null, bestScore = -Infinity;
    FORECHECK_OPTIONS.forEach((fc) => DEFENSE_OPTIONS.forEach((df) => ENTRY_OPTIONS.forEach((en) => EXIT_OPTIONS.forEach((ex) => {
      const combo = { forecheck: fc.id, defense: df.id, entry: en.id, exit: ex.id };
      const mult = getStrategyMultipliers(combo, profile, linesByTeam[myTeamId].mentality);
      const score = mult.own * 100 + (2 - mult.opp) * 60 - mult.pen * avgPenaltyProp * 0.5;
      if (score > bestScore) { bestScore = score; best = combo; }
    }))));
    setLinesByTeam((prev) => ({ ...prev, [myTeamId]: { ...prev[myTeamId], strategy: best } }));
  }
  function cleanLinesOfPlayer(l, playerId) {
    return {
      ...l,
      forwards: l.forwards.map((x) => ({ LW: x.LW === playerId ? undefined : x.LW, C: x.C === playerId ? undefined : x.C, RW: x.RW === playerId ? undefined : x.RW })),
      defense: l.defense.map((x) => ({ LD: x.LD === playerId ? undefined : x.LD, RD: x.RD === playerId ? undefined : x.RD })),
      goalies: { starter: l.goalies.starter === playerId ? undefined : l.goalies.starter, backup: l.goalies.backup === playerId ? undefined : l.goalies.backup },
      pp: l.pp.map((id) => (id === playerId ? undefined : id)),
      pk: l.pk.map((id) => (id === playerId ? undefined : id)),
    };
  }
  function executeTrade(otherTeamId, myIds, theirIds) {
    if (myIds.length === 0 && theirIds.length === 0) return;
    const theirTeamName = teamsById[otherTeamId]?.name || "l'autre équipe";
    const myT0 = teamsById[myTeamId], theirT0 = teamsById[otherTeamId];
    const myOutNames = myT0.roster.filter((p) => myIds.includes(p.id)).map((p) => p.name);
    const theirOutNames = theirT0.roster.filter((p) => theirIds.includes(p.id)).map((p) => p.name);
    setTeams((prev) => {
      const myT = prev.find((t) => t.id === myTeamId);
      const theirT = prev.find((t) => t.id === otherTeamId);
      const myOut = myT.roster.filter((p) => myIds.includes(p.id));
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
    const body = `Tu envoies: ${myOutNames.join(", ") || "rien"}\nTu reçois: ${theirOutNames.join(", ") || "rien"}`;
    addMessage({ from: "Directeur général adjoint", subject: `Échange conclu avec ${theirTeamName}`, category: "transaction", playerIds: [...myIds, ...theirIds], body });
  }
  function openOffer(player, isRenewal = false) {
    setSelectedPlayer(null);
    setOfferTarget({ player: isRenewal ? realPlayer(player) : player, isRenewal });
  }
  function submitOffer(player, offer, isRenewal) {
    const result = evaluateOffer(player, offer);
    const offerSummary = `Offre: ${offer.salary.toLocaleString()}k$/an sur ${offer.years} an${offer.years > 1 ? "s" : ""}${offer.signingBonus ? `, prime de ${offer.signingBonus.toLocaleString()}k$` : ""}${offer.noTrade ? ", clause de non-échange" : ""}.`;
    if (result.accept) {
      const newContract = { years: offer.years, salary: offer.salary, noTrade: offer.noTrade };
      if (isRenewal) {
        setTeams((prev) => prev.map((t) => (t.id !== myTeamId ? t : { ...t, roster: t.roster.map((p) => (p.id === player.id ? { ...p, contract: newContract } : p)) })));
      } else {
        setFreeAgents((prev) => prev.filter((p) => p.id !== player.id));
        setTeams((prev) => prev.map((t) => (t.id !== myTeamId ? t : { ...t, roster: [...t.roster, { ...player, contract: newContract }].sort((a, b) => b.ovr - a.ovr) })));
      }
      if (offer.signingBonus > 0) setBusiness((prev) => ({ ...prev, cash: prev.cash - offer.signingBonus }));
      addMessage({ from: "Agent du joueur", subject: `${player.name} a accepté l'offre`, category: "transaction", playerIds: [player.id], body: `${offerSummary}\n\n${player.name} a signé.` });
    } else {
      addMessage({ from: "Agent du joueur", subject: `${player.name} a refusé l'offre`, category: "transaction", playerIds: [player.id], body: `${offerSummary}\n\nL'agent estime la valeur du joueur plus proche de ${result.expSalary.toLocaleString()}k$/an sur ${result.expYears} an${result.expYears > 1 ? "s" : ""}. Reviens avec une meilleure offre.` });
    }
    setOfferTarget(null);
  }
  function refreshFreeAgents() {
    setFreeAgents(buildFreeAgentPoolRT(16, business.staff.scoutAmateur?.rating));
  }
  function findPlayer(playerId) {
    for (const t of teams) { const p = t.roster.find((x) => x.id === playerId); if (p) return p; }
    for (const list of Object.values(farmByTeam)) { const p = list.find((x) => x.id === playerId); if (p) return p; }
    return freeAgents.find((x) => x.id === playerId) || null;
  }
  // Une demande de dépistage part en mission : le rapport arrive après un délai qui dépend de
  // la cote du dépisteur (voir scoutingDelay), mesuré en jours (1 ronde du calendrier = 1 jour).
  function requestScouting(player) {
    if (pendingScouts.some((m) => m.playerId === player.id)) return;
    const scout = assignScout(player, business.staff);
    const delay = scoutingDelay(scout.rating);
    setPendingScouts((prev) => [...prev, { playerId: player.id, playerName: player.name, scout, requestedDay: currentDay, dueDay: currentDay + delay }]);
    addMessage({ from: scout.name, subject: `Mission de dépistage: ${player.name}`, category: "scout", playerIds: [player.id], body: `Dépisteur assigné: ${scout.name} (${attr20(scout.rating)}/20${scout.offSpecialty ? ", hors de sa spécialité" : ""}).\nRapport attendu dans ${delay} jour${delay > 1 ? "s" : ""} (jour ${currentDay + delay}).` });
  }
  function cancelScouting(playerId) {
    setPendingScouts((prev) => prev.filter((m) => m.playerId !== playerId));
  }
  function advanceDays(n) {
    if (n <= 0) return;
    const newDay = currentDay + n;
    const due = pendingScouts.filter((m) => m.dueDay <= newDay);
    setCurrentDay(newDay);
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
  function callUpPlayer(player) {
    setFarmByTeam((prev) => ({ ...prev, [myTeamId]: prev[myTeamId].filter((p) => p.id !== player.id) }));
    setTeams((prev) => prev.map((t) => (t.id !== myTeamId ? t : { ...t, roster: [...t.roster, { ...player, level: undefined }].sort((a, b) => b.ovr - a.ovr) })));
    addMessage({ from: "Directeur du club-école", subject: `Rappel: ${player.name}`, category: "transaction", playerIds: [player.id], body: `${player.name} (${player.pos}, cote ${player.ovr}) est rappelé du club-école vers l'équipe.` });
  }
  function sendDownPlayer(player) {
    setTeams((prev) => prev.map((t) => (t.id !== myTeamId ? t : { ...t, roster: t.roster.filter((p) => p.id !== player.id) })));
    setLinesByTeam((prev) => ({ ...prev, [myTeamId]: cleanLinesOfPlayer(prev[myTeamId], player.id) }));
    setFarmByTeam((prev) => ({ ...prev, [myTeamId]: [...(prev[myTeamId] || []), { ...player, level: "LAH" }] }));
    addMessage({ from: "Directeur du club-école", subject: `Rétrogradé: ${player.name}`, category: "transaction", playerIds: [player.id], body: `${player.name} est renvoyé au club-école.` });
  }
  function advanceMonth() {
    if (business.delegation.hockeyOps === "delegated") autoManageHockeyOps();
    const coachDev = (business.staff.headCoach?.devSkill + business.staff.assistantOff?.devSkill + business.staff.assistantDef?.devSkill) / [business.staff.headCoach, business.staff.assistantOff, business.staff.assistantDef].filter(Boolean).length || 50;
    const scoutProRating = business.staff.scoutPro?.rating || 50;
    const devBonus = ((coachDev - 50) / 50) * 0.5;
    const scoutBonus = ((scoutProRating - 50) / 50) * 0.2;
    const reportEntries = [];
    setTeams((prev) => prev.map((t) => {
      if (t.id !== myTeamId) return t;
      const newRoster = t.roster.map((p) => {
        const before = p.ovr;
        const growthRoom = p.potential - p.ovr;
        const ageFactor = p.age <= 19 ? 1.0 : p.age <= 22 ? 0.7 : p.age <= 26 ? 0.3 : -0.15;
        const magnitude = growthRoom > 0 ? growthRoom : 6;
        let delta = Math.round(magnitude * 0.05 * ageFactor * (1 + devBonus + scoutBonus) * (0.4 + Math.random() * 0.8));
        delta = Math.max(-4, Math.min(5, delta));
        if (delta === 0) return p;
        const attrKeys = p.pos === "G" ? [...GOALIE_TECH, ...MENTAL, ...GOALIE_PHYSICAL] : [...OFFENSIVE, ...DEFENSIVE, ...MENTAL, ...PHYSICAL];
        const newAttrs = { ...p.attrs };
        const picks = [...attrKeys].sort(() => Math.random() - 0.5).slice(0, 3);
        picks.forEach((k) => { newAttrs[k] = Math.max(20, Math.min(99, newAttrs[k] + delta)); });
        const newOvr = computeOvr(p.pos, newAttrs);
        reportEntries.push({ id: p.id, name: p.name, before, after: newOvr, delta: newOvr - before });
        return { ...p, attrs: newAttrs, ovr: newOvr };
      }).sort((a, b) => b.ovr - a.ovr);
      return { ...t, roster: newRoster };
    }));
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
    addMessage({ from: coachName, subject: `Rapport de développement — Mois ${month}`, category: "scout", playerIds: [...gainers, ...decliners].map((r) => r.id), body });

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
      addMessage({ from: "Ressources humaines", subject: `Primes de performance — Mois ${month}`, category: "finance", body: bonuses.map((b) => `${b.role} (${b.name}): +${b.amt.toLocaleString()} $ — ${b.reason}`).join("\n") });
    }
    setProfitThisMonth(0);
    setWinsThisMonth(0);
    setMonth((m) => m + 1);
    advanceDays(30);
  }

  if (!myTeamId) {
    return (
      <div style={{ ...VARS, minHeight: "600px", background: "var(--navy)", color: "var(--ice)", fontFamily: "Inter, sans-serif", padding: "40px 24px" }}>
        <style>{FONT_IMPORT}</style>
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          <div style={{ fontFamily: "Oswald, sans-serif", fontSize: 13, letterSpacing: 2, color: "var(--iceMuted)", marginBottom: 6 }}>SIMULATION DE GESTION — LIGUE FICTIVE</div>
          <h1 style={{ fontFamily: "Oswald, sans-serif", fontWeight: 700, fontSize: 40, margin: "0 0 8px" }}>Choisis ton équipe</h1>
          <p style={{ color: "var(--iceMuted)", fontSize: 15, maxWidth: 520, marginBottom: 32 }}>Gère tes trios, tes paires et tes gardiens, avance le calendrier et surveille les meneurs statistiques.</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: 12 }}>
            {teams.map((t) => {
              const s = teamStrength(t, linesByTeam[t.id]);
              return (
                <button key={t.id} onClick={() => setMyTeamId(t.id)} style={{ textAlign: "left", background: "var(--navy2)", border: `1px solid ${t.color}55`, borderLeft: `4px solid ${t.color}`, borderRadius: 4, padding: "14px 16px", color: "var(--ice)", cursor: "pointer", display: "flex", gap: 12, alignItems: "center" }}>
                  <TeamCrest team={t} size={38} />
                  <div>
                    <div style={{ fontFamily: "Oswald, sans-serif", fontWeight: 600, fontSize: 18 }}>{t.name}</div>
                    <div style={{ fontSize: 12, color: "var(--iceMuted)", marginTop: 2 }}>ATT {Math.round(s.offense)} · DÉF {Math.round(s.defense)}</div>
                  </div>
                </button>
              );
            })}
          </div>
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
  ];

  return (
    <div style={{ ...VARS, minHeight: "640px", background: "var(--navy)", color: "var(--ice)", fontFamily: "Inter, sans-serif", display: "flex" }}>
      <style>{FONT_IMPORT}</style>
      {selectedPlayer && <PlayerModal player={selectedPlayer.player} team={selectedPlayer.team} myTeam={myTeam} lines={selectedPlayer.team ? linesByTeam[selectedPlayer.team.id] : null} editable={selectedPlayer.team?.id === myTeamId} seasonStats={seasonStats} staff={business.staff} myTeamId={myTeamId} scoutKnowledge={scoutKnowledge} pendingScouts={pendingScouts} currentDay={currentDay} onRequestScout={requestScouting} onCancelScout={cancelScouting} onClose={() => setSelectedPlayer(null)} onEdit={openEditPlayer} onOfferContract={(p) => openOffer(p, true)} />}
      {offerTarget && <ContractOfferModal player={offerTarget.isRenewal ? staffViewPlayer(offerTarget.player, business.staff) : offerTarget.player} isRenewal={offerTarget.isRenewal} team={myTeam} onClose={() => setOfferTarget(null)} onSubmit={submitOffer} />}
      {watchingGame && <LiveMatchViewer game={watchingGame} home={teamsById[watchingGame.home]} away={teamsById[watchingGame.away]} onClose={() => setWatchingGame(null)} onSelectPlayer={selectPlayer} />}
      {editingPlayer && <PlayerEditorModal initial={editingPlayer.initial} isNew={editingPlayer.isNew} team={teamsById[myTeamId]} onSave={savePlayer} onClose={() => setEditingPlayer(null)} />}
      <div style={{ width: 190, background: "var(--navy2)", padding: "20px 12px", display: "flex", flexDirection: "column", gap: 4, borderRight: `1px solid ${myTeam.color}33` }}>
        <div style={{ padding: "0 8px 16px", display: "flex", alignItems: "center", gap: 10 }}>
          <TeamCrest team={myTeam} size={34} />
          <div style={{ fontFamily: "Oswald, sans-serif", fontWeight: 600, fontSize: 16, color: myTeam.color, lineHeight: 1.15 }}>{myTeam.name}</div>
        </div>
        {navItems.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 3, border: "none", background: tab === key ? "var(--navy)" : "transparent", color: tab === key ? "var(--ice)" : "var(--iceMuted)", fontSize: 14, cursor: "pointer", textAlign: "left" }}>
            <Icon size={15} /> {label}
            {key === "inbox" && messages.filter((m) => !m.read).length > 0 && (
              <span style={{ marginLeft: "auto", background: "var(--red)", color: "#fff", borderRadius: 10, fontSize: 10, padding: "1px 6px", fontWeight: 700 }}>{messages.filter((m) => !m.read).length}</span>
            )}
          </button>
        ))}
        <div style={{ marginTop: "auto", padding: "0 8px", fontSize: 11, color: "var(--iceMuted)" }}>Jour <span style={{ color: "var(--ice)" }}>{currentDay}</span> · Rang: <span style={{ color: "var(--ice)" }}>{myRank}e</span> · {myStanding?.pts ?? 0} pts</div>
      </div>
      <div style={{ flex: 1, padding: "24px 32px", overflow: "auto" }}>
        {liveMatch && <LiveSimPanel liveMatch={liveMatch} myTeamId={myTeamId} linesByTeam={linesByTeam} onSelectPlayer={selectPlayer} onNextPeriod={simulateLiveNextPeriod} onFinish={finishLiveMatch} onGoToLines={() => setTab("lines")} onGoToStrategy={() => setTab("strategy")} />}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
          <div>
            {nextMyGame ? (
              <div style={{ fontSize: 14 }}>Prochain match — <strong>{teamsById[nextMyGame.home].name}</strong> vs <strong>{teamsById[nextMyGame.away].name}</strong><span style={{ color: "var(--iceMuted)" }}> (ronde {nextMyGame.round})</span></div>
            ) : (<div style={{ fontSize: 14, color: "var(--win)" }}>Saison terminée.</div>)}
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button onClick={simRound} disabled={currentRound === null || !!liveMatch} style={btnStyle("var(--red)")}><Play size={14} /> Simuler la ronde</button>
            <button onClick={simToSeasonEnd} disabled={currentRound === null || !!liveMatch} style={btnStyle("var(--steel)")}><FastForward size={14} /> Simuler la saison</button>
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
            <RosterTable roster={myTeam.roster} lines={myLines} staff={business.staff} myTeamId={myTeamId} teamId={myTeamId} scoutKnowledge={scoutKnowledge} onSelect={(p) => selectPlayer(p, myTeam)} />
          </div>
        )}

        {tab === "lines" && <LinesEditor team={myTeam} lines={myLines} onChange={updateLine} onSwap={swapLineSlots} onChangeUnit={updateUnit} onAutoLines={autoOptimizeLines} onAutoSpecialTeams={autoOptimizeSpecialTeams} onSelectPlayer={selectPlayer} />}

        {tab === "depth" && <DepthChartPanel team={myTeam} farm={myFarmView} lines={myLines} onSelectPlayer={selectPlayer} onCallUp={callUpPlayer} onSendDown={sendDownPlayer} />}

        {tab === "strategy" && <StrategyEditor team={myTeam} lines={myLines} onChangeStrategy={updateStrategy} onChangeMentality={updateMentality} onAutoStrategy={autoOptimizeStrategy} />}

        {tab === "transactions" && <TransactionsCenter myTeam={myTeam} teams={teams} myTeamId={myTeamId} staff={business.staff} scoutKnowledge={scoutKnowledge} pendingScouts={pendingScouts} onRequestScout={requestScouting} onSelectPlayer={selectPlayer} onTrade={executeTrade} />}

        {tab === "freeagents" && <FreeAgentsPanel myTeam={myTeam} myTeamId={myTeamId} staff={business.staff} scoutKnowledge={scoutKnowledge} pendingScouts={pendingScouts} onRequestScout={requestScouting} onSelectPlayer={(p) => selectPlayer(p, null)} freeAgents={freeAgents} onSign={(p) => openOffer(p, false)} onRefreshFreeAgents={refreshFreeAgents} />}

        {tab === "contracts" && <ContractsPanel myTeam={myTeam} onOfferContract={(p) => openOffer(p, true)} onSelectPlayer={selectPlayer} />}

        {tab === "staff" && <StaffCenter business={business} staffMarket={staffMarket} myTeam={myTeam} month={month} progressionReport={progressionReport} onHire={hireStaff} onFire={fireStaff} onRefresh={refreshStaffMarket} onAdvanceMonth={advanceMonth} onSetDelegation={setDelegation} onSelectPlayer={selectPlayer} />}

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
                          <span style={{ fontFamily: "Oswald, sans-serif", fontWeight: 600, minWidth: 50, textAlign: "center" }}>{g.played ? `${g.homeScore} – ${g.awayScore}` : "à venir"}</span>
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

        {tab === "stats" && <StatsTables leaders={leaders} standings={standings} teamHitTotals={teamHitTotals} teamAdvancedTotals={teamAdvancedTotals} teamsById={teamsById} myTeamId={myTeamId} onSelectPlayer={selectPlayer} />}

        {tab === "standings" && <StandingsTable standings={standings} teamsById={teamsById} myTeamId={myTeamId} />}
      </div>
    </div>
  );
}
