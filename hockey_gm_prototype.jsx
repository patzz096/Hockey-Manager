import React, { useState, useMemo, useEffect } from "react";
import { Users, CalendarDays, Trophy, Play, FastForward, Circle, X, ChevronDown, ChevronUp, Layers, BarChart3, Sliders, ArrowLeftRight, DollarSign, UserCog, Mail, UserPlus, FileText, Star, Network } from "lucide-react";

// ---------- CONSTANTS ----------
const TEAM_SEED = [
  { id: "ANA", city: "Anaheim", name: "Ducks d'Anaheim", color: "#F47A38", capacity: 17174 , division: "Pacifique" },
  { id: "BOS", city: "Boston", name: "Bruins de Boston", color: "#FFB81C", capacity: 17850 , division: "Atlantique" },
  { id: "BUF", city: "Buffalo", name: "Sabres de Buffalo", color: "#002654", capacity: 19070 , division: "Atlantique" },
  { id: "CGY", city: "Calgary", name: "Flames de Calgary", color: "#C8102E", capacity: 19289 , division: "Pacifique" },
  { id: "CAR", city: "Caroline", name: "Hurricanes de la Caroline", color: "#CC0000", capacity: 18700 , division: "Métropolitaine" },
  { id: "CHI", city: "Chicago", name: "Blackhawks de Chicago", color: "#CF0A2C", capacity: 19717 , division: "Centrale" },
  { id: "COL", city: "Colorado", name: "Avalanche du Colorado", color: "#6F263D", capacity: 18007 , division: "Centrale" },
  { id: "CBJ", city: "Columbus", name: "Blue Jackets de Columbus", color: "#002654", capacity: 18500 , division: "Métropolitaine" },
  { id: "DAL", city: "Dallas", name: "Stars de Dallas", color: "#006847", capacity: 18532 , division: "Centrale" },
  { id: "DET", city: "Détroit", name: "Red Wings de Détroit", color: "#CE1126", capacity: 19515 , division: "Atlantique" },
  { id: "EDM", city: "Edmonton", name: "Oilers d'Edmonton", color: "#FF4C00", capacity: 18347 , division: "Pacifique" },
  { id: "FLA", city: "Floride", name: "Panthers de la Floride", color: "#C8102E", capacity: 19250 , division: "Atlantique" },
  { id: "LAK", city: "Los Angeles", name: "Kings de Los Angeles", color: "#111111", capacity: 18230 , division: "Pacifique" },
  { id: "MIN", city: "Minnesota", name: "Wild du Minnesota", color: "#154734", capacity: 17954 , division: "Centrale" },
  { id: "MTL", city: "Montréal", name: "Canadiens de Montréal", color: "#AF1E2D", capacity: 21105 , division: "Atlantique" },
  { id: "NSH", city: "Nashville", name: "Predators de Nashville", color: "#FFB81C", capacity: 17159 , division: "Centrale" },
  { id: "NJD", city: "New Jersey", name: "Devils du New Jersey", color: "#CE1126", capacity: 16514 , division: "Métropolitaine" },
  { id: "NYI", city: "New York", name: "Islanders de New York", color: "#00539B", capacity: 17255 , division: "Métropolitaine" },
  { id: "NYR", city: "New York", name: "Rangers de New York", color: "#0038A8", capacity: 18006 , division: "Métropolitaine" },
  { id: "OTT", city: "Ottawa", name: "Sénateurs d'Ottawa", color: "#C52032", capacity: 18652 , division: "Atlantique" },
  { id: "PHI", city: "Philadelphie", name: "Flyers de Philadelphie", color: "#F74902", capacity: 19543 , division: "Métropolitaine" },
  { id: "PIT", city: "Pittsburgh", name: "Penguins de Pittsburgh", color: "#FCB514", capacity: 18387 , division: "Métropolitaine" },
  { id: "SJS", city: "San Jose", name: "Sharks de San Jose", color: "#006D75", capacity: 17562 , division: "Pacifique" },
  { id: "SEA", city: "Seattle", name: "Kraken de Seattle", color: "#001628", capacity: 17151 , division: "Pacifique" },
  { id: "STL", city: "St. Louis", name: "Blues de St. Louis", color: "#002F87", capacity: 18096 , division: "Centrale" },
  { id: "TBL", city: "Tampa Bay", name: "Lightning de Tampa Bay", color: "#002868", capacity: 19092 , division: "Atlantique" },
  { id: "TOR", city: "Toronto", name: "Maple Leafs de Toronto", color: "#00205B", capacity: 18819 , division: "Atlantique" },
  { id: "UTA", city: "Utah", name: "Mammoth de l'Utah", color: "#71AFE5", capacity: 16000 , division: "Centrale" },
  { id: "VAN", city: "Vancouver", name: "Canucks de Vancouver", color: "#00205B", capacity: 18910 , division: "Pacifique" },
  { id: "VGK", city: "Vegas", name: "Golden Knights de Vegas", color: "#B4975A", capacity: 17500 , division: "Pacifique" },
  { id: "WSH", city: "Washington", name: "Capitals de Washington", color: "#C8102E", capacity: 18573 , division: "Métropolitaine" },
  { id: "WPG", city: "Winnipeg", name: "Jets de Winnipeg", color: "#041E42", capacity: 15321 , division: "Centrale" },
];

const FIRST_NAMES = ["Alexandre","Samuel","Félix","Olivier","Mathis","Xavier","Gabriel","Nathan","Thomas","William","Jérémy","Louis","Antoine","Zachary","Charles","Émile","Simon","Tristan","Étienne","Maxime","Jacob","Noah","Raphaël","Justin","Vincent","Elliot","Mathieu","Loïc"];
const LAST_NAMES = ["Tremblay","Gagnon","Roy","Côté","Bouchard","Gauthier","Morin","Lavoie","Fortin","Gagné","Ouellet","Pelletier","Bélanger","Lévesque","Bergeron","Leblanc","Paquette","Girard","Simard","Boucher","Caron","Beaulieu","Poirier","Cloutier","Dubé","Thibault","Fournier","Bilodeau"];

const OFFENSIVE = ["screening", "gettingOpen", "passing", "puckhandling", "shotAccuracy", "shotRange", "offensiveRead"];
const DEFENSIVE = ["checking", "faceoffs", "hitting", "positioning", "shotBlocking", "stickchecking", "defensiveRead"];
const MENTAL = ["aggressiveness", "bravery", "determination", "teamPlayer", "leadership", "temperament", "professionalism"];
const PHYSICAL = ["acceleration", "agility", "balance", "speed", "stamina", "strength", "fighting"];
const SKATER_CATEGORIES = [
  { key: "offensive", label: "Cotes offensives", attrs: OFFENSIVE },
  { key: "defensive", label: "Cotes défensives", attrs: DEFENSIVE },
  { key: "mental", label: "Cotes mentales", attrs: MENTAL },
  { key: "physical", label: "Cotes physiques", attrs: PHYSICAL },
];
const GOALIE_TECH = ["reflexes", "positioning", "reboundControl", "puckhandling", "recovery", "lateralMovement"];
const GOALIE_PHYSICAL = ["acceleration", "agility", "balance", "flexibility", "stamina", "strength"];
const GOALIE_CATEGORIES = [
  { key: "technique", label: "Cotes techniques", attrs: GOALIE_TECH },
  { key: "mental", label: "Cotes mentales", attrs: MENTAL },
  { key: "physical", label: "Cotes physiques", attrs: GOALIE_PHYSICAL },
];
const ATTR_LABELS = {
  screening: "Écran", gettingOpen: "Démarquage", passing: "Passes", puckhandling: "Maniement de rondelle",
  shotAccuracy: "Précision de tir", shotRange: "Portée de tir", offensiveRead: "Lecture offensive",
  checking: "Mise en échec", faceoffs: "Mises au jeu", hitting: "Contact physique", positioning: "Positionnement",
  shotBlocking: "Blocage de tirs", stickchecking: "Échec avec bâton", defensiveRead: "Lecture défensive",
  aggressiveness: "Agressivité", bravery: "Courage", determination: "Détermination", teamPlayer: "Esprit d'équipe",
  leadership: "Leadership", temperament: "Tempérament", professionalism: "Professionnalisme",
  acceleration: "Accélération", agility: "Agilité", balance: "Équilibre", speed: "Vitesse", stamina: "Endurance",
  strength: "Force", fighting: "Bagarre", reflexes: "Réflexes", reboundControl: "Contrôle de rebond",
  recovery: "Récupération", lateralMovement: "Déplacement latéral", flexibility: "Flexibilité",
};

const FORWARD_BONUS = [1.2, 1.05, 0.92, 0.8];
const DEFENSE_BONUS = [1.1, 1.0, 0.92];

// Systèmes de jeu façon coaching NHL. Chaque système a un "fit" qui dépend des attributs
// réels de l'effectif — deux équipes différentes obtiennent des multiplicateurs différents
// pour le même choix de stratégie.
const FORECHECK_OPTIONS = [
  { id: "aggressive", label: "Pression agressive (forecheck 2-1-2)" },
  { id: "balanced", label: "Équilibré (1-2-2)" },
  { id: "passive", label: "Trappe / contenu (1-4)" },
];
const DEFENSE_OPTIONS = [
  { id: "manToMan", label: "Homme à homme" },
  { id: "zone", label: "Zone" },
];
const ENTRY_OPTIONS = [
  { id: "carry", label: "Contrôle de la rondelle (entrée portée)" },
  { id: "dump", label: "Dégagement et chasse (dump and chase)" },
];
const EXIT_OPTIONS = [
  { id: "quick", label: "Sortie rapide / transition" },
  { id: "safe", label: "Sortie prudente" },
];
const DEFAULT_STRATEGY = { forecheck: "balanced", defense: "zone", entry: "carry", exit: "quick" };
function fitScore(value, ref = 70, span = 25) { return Math.max(-1, Math.min(1, (value - ref) / span)); }
function computeTeamProfile(team) {
  const skaters = team.roster.filter((p) => p.pos !== "G");
  const n = skaters.length || 1;
  const mean = (fn) => skaters.reduce((a, p) => a + fn(p), 0) / n;
  return {
    speed: mean((p) => p.attrs.speed),
    stamina: mean((p) => p.attrs.stamina),
    aggressiveness: mean((p) => p.attrs.aggressiveness),
    hitting: mean((p) => p.attrs.hitting),
    puckhandling: mean((p) => p.attrs.puckhandling),
    positioning: mean((p) => p.attrs.positioning),
    defensiveRead: mean((p) => p.attrs.defensiveRead),
    temperament: mean((p) => p.attrs.temperament),
    defenseSkill: mean((p) => avg(p.attrs, DEFENSIVE)),
  };
}
const STRATEGY_ENGINE = {
  forecheck: {
    aggressive: (p) => { const fit = fitScore((p.speed + p.stamina + p.aggressiveness) / 3); const aggFactor = Math.max(0, Math.min(1, (p.aggressiveness - 60) / 30)); return { own: 1 + 0.12 * fit, opp: 1 - 0.08 * fit, pen: 1.15 + 0.15 * aggFactor }; },
    balanced: () => ({ own: 1, opp: 1, pen: 1 }),
    passive: (p) => { const fit = fitScore((p.defensiveRead + p.positioning + p.temperament) / 3); return { own: 0.92 + 0.06 * fit, opp: 0.90 - 0.06 * fit, pen: 0.85 - 0.10 * fit }; },
  },
  defense: {
    manToMan: (p) => { const fit = fitScore((p.speed + p.defenseSkill) / 2); const aggFactor = Math.max(0, Math.min(1, (p.aggressiveness - 60) / 30)); return { own: 1 + 0.05 * fit, opp: 1 - 0.05 * fit, pen: 1.15 + 0.10 * aggFactor - 0.05 * fit }; },
    zone: (p) => { const fit = fitScore(p.positioning); return { own: 0.97, opp: 0.95 - 0.05 * fit, pen: 0.90 - 0.05 * fit }; },
  },
  entry: {
    carry: (p) => { const fit = fitScore(p.puckhandling); return { own: 1 + 0.10 * fit, opp: 1.02, pen: 1.02 }; },
    dump: (p) => { const fit = fitScore(p.hitting); return { own: 0.93 + 0.07 * fit, opp: 0.97, pen: 0.95 }; },
  },
  exit: {
    quick: (p) => { const fit = fitScore(p.speed); return { own: 1 + 0.06 * fit, opp: 1 - 0.03 * fit, pen: 1.0 }; },
    safe: (p) => { const fit = fitScore(p.positioning); return { own: 0.96, opp: 0.94 - 0.04 * fit, pen: 0.95 }; },
  },
};
const DEFAULT_MENTALITY = { aggression: 50, pinch: 50, discipline: 50 };
function getStrategyMultipliers(strategy, profile, mentality) {
  const fc = STRATEGY_ENGINE.forecheck[strategy.forecheck](profile);
  const df = STRATEGY_ENGINE.defense[strategy.defense](profile);
  const en = STRATEGY_ENGINE.entry[strategy.entry](profile);
  const ex = STRATEGY_ENGINE.exit[strategy.exit](profile);
  let own = fc.own * df.own * en.own * ex.own;
  let opp = fc.opp * df.opp * en.opp * ex.opp;
  let pen = fc.pen * df.pen * en.pen * ex.pen;
  if (mentality) {
    const agg = ((mentality.aggression ?? 50) - 50) / 50;
    const pinch = ((mentality.pinch ?? 50) - 50) / 50;
    const disc = ((mentality.discipline ?? 50) - 50) / 50;
    own *= 1 + agg * 0.05 + pinch * 0.03;
    opp *= 1 + agg * 0.04 + pinch * 0.05 - disc * 0.02;
    pen *= 1 + agg * 0.30 - disc * 0.25;
  }
  return { own, opp, pen };
}

// ---------- FINANCES / INSTALLATIONS ----------
const ARENA_CAPACITY = 5000;
const DEFAULT_FACILITIES = { concessions: 1, boutique: 1, parking: 1, marketing: 1 };
const FACILITY_LABELS = { concessions: "Concessions (cuisine)", boutique: "Boutique / marchandise", parking: "Stationnement (capacité)", marketing: "Marketing / publicité" };
const DEFAULT_TICKET_TIERS = [
  { key: "general", label: "Général", price: 28, basePrice: 28, share: 0.75 },
  { key: "passerelle", label: "Passerelle (mezzanine)", price: 45, basePrice: 45, share: 0.15 },
  { key: "loge", label: "Loges privées", price: 85, basePrice: 85, share: 0.10 },
];
const DEFAULT_CONCESSION_ITEMS = [
  { key: "hotdog", label: "Hot-dog", price: 5, basePrice: 5, avgPerFan: 0.35 },
  { key: "burger", label: "Hamburger", price: 8, basePrice: 8, avgPerFan: 0.20 },
  { key: "frites", label: "Frites", price: 4.5, basePrice: 4.5, avgPerFan: 0.35 },
  { key: "poutine", label: "Poutine", price: 7, basePrice: 7, avgPerFan: 0.30 },
  { key: "popcorn", label: "Pop-corn", price: 4.5, basePrice: 4.5, avgPerFan: 0.25 },
  { key: "bonbon", label: "Bonbons", price: 3.5, basePrice: 3.5, avgPerFan: 0.20 },
  { key: "chocolat", label: "Chocolat", price: 3, basePrice: 3, avgPerFan: 0.18 },
  { key: "slush", label: "Slush", price: 4, basePrice: 4, avgPerFan: 0.22 },
  { key: "boisson", label: "Boisson gazeuse", price: 4, basePrice: 4, avgPerFan: 0.55 },
  { key: "biere", label: "Bière", price: 8.5, basePrice: 8.5, avgPerFan: 0.30 },
];
const DEFAULT_PARKING = { price: 12, basePrice: 12, rate: 0.35 };
function facilityUpgradeCost(level) { return 4000 + level * 3500; }
function autoTuneFinances(biz, lastFin) {
  const totalCap = lastFin.tiers.reduce((a, t) => a + t.capacity, 0);
  const util = totalCap > 0 ? lastFin.attendance / totalCap : 0.7;
  let ticketTiers = biz.ticketTiers;
  if (util > 0.88) ticketTiers = ticketTiers.map((t) => ({ ...t, price: Math.round(t.price * 1.05) }));
  else if (util < 0.45) ticketTiers = ticketTiers.map((t) => ({ ...t, price: Math.max(5, Math.round(t.price * 0.95)) }));
  let facilities = biz.facilities;
  let cash = biz.cash;
  const upgradable = Object.keys(facilities).filter((k) => facilities[k] < 5);
  if (upgradable.length > 0) {
    const cheapest = upgradable.reduce((best, k) => (facilityUpgradeCost(facilities[k]) < facilityUpgradeCost(facilities[best]) ? k : best), upgradable[0]);
    const cost = facilityUpgradeCost(facilities[cheapest]);
    if (cash > cost * 3) { facilities = { ...facilities, [cheapest]: facilities[cheapest] + 1 }; cash -= cost; }
  }
  return { ...biz, ticketTiers, facilities, cash };
}
function priceElasticity(price, basePrice) { return Math.max(0.4, Math.min(1.4, 1.3 - (price / basePrice - 1) * 0.6)); }
function computeGameFinance(team, business, winPct) {
  const marketingBoost = business.facilities.marketing * 0.03;
  const baseDemand = Math.max(0.12, Math.min(0.97, 0.35 + winPct * 0.5 + marketingBoost));

  const tiers = business.ticketTiers.map((t) => {
    const capacity = Math.round(team.capacity * t.share);
    const elastic = priceElasticity(t.price, t.basePrice);
    const attendance = Math.max(0, Math.min(capacity, Math.round(capacity * baseDemand * elastic)));
    const revenue = Math.round(attendance * t.price);
    return { key: t.key, label: t.label, price: t.price, capacity, attendance, revenue };
  });
  const attendance = tiers.reduce((a, t) => a + t.attendance, 0);
  const ticketRevenue = tiers.reduce((a, t) => a + t.revenue, 0);

  const concessionLevelMult = 1 + (business.facilities.concessions - 1) * 0.15;
  const items = business.concessionItems.map((item) => {
    const elastic = priceElasticity(item.price, item.basePrice);
    const unitsSold = Math.max(0, Math.round(attendance * item.avgPerFan * elastic * concessionLevelMult));
    const revenue = Math.round(unitsSold * item.price);
    return { key: item.key, label: item.label, price: item.price, unitsSold, revenue };
  });
  const concessionsRevenue = items.reduce((a, i) => a + i.revenue, 0);

  const parkingLevelMult = 1 + (business.facilities.parking - 1) * 0.1;
  const parkingElastic = priceElasticity(business.parking.price, business.parking.basePrice);
  const parkingCapacity = Math.round(team.capacity * 0.28 * parkingLevelMult);
  const carsCount = Math.max(0, Math.min(parkingCapacity, Math.round(attendance * business.parking.rate * parkingElastic * parkingLevelMult)));
  const parkingRevenue = Math.round(carsCount * business.parking.price);

  const merchRevenue = Math.round(attendance * business.facilities.boutique * 1.4);
  const revenue = ticketRevenue + concessionsRevenue + parkingRevenue + merchRevenue;
  const payroll = Math.round((team.roster.reduce((a, p) => a + (p.contract?.salary || 0), 0) * 1000) / 56);
  const staffPayroll = Math.round((Object.values(business.staff || {}).reduce((a, s) => a + (s?.salary || 0), 0) * 1000) / 56);
  const maintenance = Object.values(business.facilities).reduce((a, l) => a + l * 250, 0);
  const arenaBase = 3500;
  const expenses = payroll + staffPayroll + maintenance + arenaBase;
  const profit = revenue - expenses;
  return { attendance, tiers, ticketRevenue, items, concessionsRevenue, carsCount, parkingCapacity, parkingRevenue, merchRevenue, revenue, payroll, staffPayroll, maintenance, arenaBase, expenses, profit };
}

// ---------- RNG ----------
function seededRandom(seed) { let s = seed; return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; }; }
function poisson(lambda, rng) { const L = Math.exp(-lambda); let k = 0, p = 1; do { k++; p *= rng(); } while (p > L); return k - 1; }
function weightedPick(items, weights, rng) {
  const total = weights.reduce((a, b) => a + b, 0);
  if (total <= 0) return items[Math.floor(rng() * items.length)];
  let r = rng() * total;
  for (let i = 0; i < items.length; i++) { r -= weights[i]; if (r <= 0) return items[i]; }
  return items[items.length - 1];
}
function randAttr(rng, base) { return Math.min(99, Math.max(20, Math.round(base + rng() * 40 - 20))); }
function avg(attrs, keys) { return keys.reduce((a, k) => a + attrs[k], 0) / keys.length; }

// ---------- PLAYER / TEAM GENERATION ----------
function computeOvr(pos, attrs) {
  if (pos === "G") return Math.round(avg(attrs, GOALIE_TECH) * 0.55 + avg(attrs, GOALIE_PHYSICAL) * 0.25 + avg(attrs, MENTAL) * 0.20);
  const off = avg(attrs, OFFENSIVE), def = avg(attrs, DEFENSIVE), men = avg(attrs, MENTAL), phy = avg(attrs, PHYSICAL);
  if (pos === "D" || pos === "LD" || pos === "RD") return Math.round(def * 0.40 + phy * 0.25 + off * 0.20 + men * 0.15);
  return Math.round(off * 0.45 + phy * 0.25 + men * 0.15 + def * 0.15);
}
function potentialCeiling(age, rng) {
  const maxBonus = age <= 19 ? 20 : age <= 22 ? 12 : age <= 26 ? 4 : 0;
  return Math.round(rng() * maxBonus);
}
// 4C + 8W (4 slots for LW, 4 for RW) + 6D (3 pairs) + 2G (starter/backup)
const ROSTER_POSITIONS = ["C","C","C","C","LW","LW","LW","LW","RW","RW","RW","RW","LD","LD","LD","RD","RD","RD","G","G"];

// Alignement réel — Cascades Élite (Ligue de Hockey d'Excellence du Québec)
const CASCADES_ROSTER_DATA = [
  { name: "Laurent Talbot", number: 33, pos: "G" },
  { name: "Théo Lapointe", number: 29, pos: "G" },
  { name: "Edison Hotte", number: 27, pos: "C" },
  { name: "Émile Fillion", number: 14, pos: "C" },
  { name: "Hubert Chamberland", number: 12, pos: "C" },
  { name: "Isaac Daigle", number: 28, pos: "C" },
  { name: "Liam Tanguay", number: 25, pos: "LW" },
  { name: "Logan Boisvert", number: 19, pos: "RW" },
  { name: "Loïc Huppé", number: 43, pos: "LW" },
  { name: "Lowen Fréchette", number: 9, pos: "RW" },
  { name: "Nolan Beauvilliers", number: 34, pos: "LW" },
  { name: "Derek Guérard", number: 42, pos: "LD" },
  { name: "Édouard Pouliot", number: 23, pos: "RD" },
  { name: "François-Xavier Guimond", number: 32, pos: "LD" },
  { name: "Jacob Corriveau", number: 45, pos: "RD" },
  { name: "Louis Légaré", number: 49, pos: "LD" },
  { name: "Zachary Pratte", number: 44, pos: "RD" },
];
const CURRENT_YEAR = 2026;
function randomContract(rng) { return { years: Math.max(1, Math.round(1 + rng() * 6)), salary: Math.round(300 + rng() * 7500) }; }
function randomContractRT() { return { years: Math.max(1, Math.round(1 + Math.random() * 6)), salary: Math.round(300 + Math.random() * 7500) }; }

// ---------- MOTEUR DE NÉGOCIATION DE CONTRAT ----------
function expectedSalary(player) {
  const qualityRef = Math.max(player.ovr, player.ovr * 0.7 + player.potential * 0.3);
  return Math.round(250 + Math.pow(qualityRef / 99, 2.6) * 9500);
}
function expectedYears(player) {
  if (player.age < 23 && player.potential - player.ovr > 8) return 4;
  if (player.age >= 30) return 1;
  if (player.age >= 27) return 2;
  return 3;
}
function evaluateOffer(player, offer) {
  const expSalary = expectedSalary(player);
  const expYears = expectedYears(player);
  const salaryRatio = offer.salary / expSalary;
  const yearsFit = 1 - Math.min(1, Math.abs(offer.years - expYears) * 0.12);
  const noTradeBonus = offer.noTrade ? (player.ovr >= 80 ? 0.10 : 0.03) : 0;
  const bonusEffect = Math.min(0.08, (offer.signingBonus || 0) / 15000);
  const score = (salaryRatio - 1) * 0.65 + yearsFit * 0.25 + noTradeBonus + bonusEffect;
  const probability = Math.max(0.03, Math.min(0.97, 0.5 + score));
  const accept = Math.random() < probability;
  return { accept, probability, expSalary, expYears };
}

function buildRealRoster(data, teamIndex, rng) {
  return data.map((d, i) => {
    const allAttrs = d.pos === "G" ? [...GOALIE_TECH, ...MENTAL, ...GOALIE_PHYSICAL] : [...OFFENSIVE, ...DEFENSIVE, ...MENTAL, ...PHYSICAL];
    const attrs = {};
    allAttrs.forEach((a) => { attrs[a] = (d.attrs && d.attrs[a] != null) ? d.attrs[a] : 60; });
    const ovr = computeOvr(d.pos, attrs);
    const potential = Math.min(99, ovr + (d.age <= 22 ? 10 : d.age <= 26 ? 4 : 0));
    const contract = d.contract || randomContract(rng);
    return { id: `${teamIndex}-${i}`, name: d.name, number: d.number, pos: d.pos, age: d.age, attrs, ovr, potential, contract };
  }).sort((a, b) => b.ovr - a.ovr);
}
// Alignement projeté à partir des statistiques réelles 2025-26 et des contrats connus (approximatifs pour certains joueurs)
const MTL_ROSTER_DATA = [
  { name: "Nick Suzuki", number: 14, pos: "C", age: 27, nationality: "CA", contract: { years: 7, salary: 7875 }, attrs: { passing: 88, offensiveRead: 90, shotAccuracy: 78, gettingOpen: 82, leadership: 92, teamPlayer: 88, faceoffs: 75, defensiveRead: 80, positioning: 78, speed: 78, determination: 85, professionalism: 88, temperament: 85 } },
  { name: "Cole Caufield", number: 22, pos: "LW", age: 25, nationality: "US", contract: { years: 7, salary: 7850 }, attrs: { shotAccuracy: 95, shotRange: 93, gettingOpen: 88, acceleration: 85, speed: 86, offensiveRead: 82, puckhandling: 75, hitting: 35, checking: 35, strength: 45, determination: 82 } },
  { name: "Juraj Slafkovský", number: 20, pos: "RW", age: 22, nationality: "SK", contract: { years: 7, salary: 7600 }, attrs: { strength: 85, hitting: 78, checking: 75, puckhandling: 74, shotAccuracy: 70, offensiveRead: 72, speed: 70, acceleration: 70, balance: 80, determination: 80 } },
  { name: "Kirby Dach", number: 77, pos: "C", age: 25, nationality: "CA", contract: { years: 2, salary: 3362 }, attrs: { passing: 80, puckhandling: 82, offensiveRead: 78, shotAccuracy: 70, strength: 75, faceoffs: 65, stamina: 55 } },
  { name: "Ivan Demidov", number: 93, pos: "LW", age: 20, nationality: "RU", contract: { years: 2, salary: 950 }, attrs: { puckhandling: 90, shotAccuracy: 82, offensiveRead: 85, gettingOpen: 84, agility: 85, acceleration: 82, speed: 80, passing: 80, strength: 55 } },
  { name: "Josh Anderson", number: 17, pos: "RW", age: 32, nationality: "CA", contract: { years: 3, salary: 5500 }, attrs: { strength: 88, hitting: 85, checking: 80, speed: 78, shotAccuracy: 68, puckhandling: 55, bravery: 85, aggressiveness: 75 } },
  { name: "Brendan Gallagher", number: 11, pos: "LW", age: 34, nationality: "CA", contract: { years: 1, salary: 3750 }, attrs: { determination: 92, hitting: 78, checking: 72, bravery: 90, shotAccuracy: 68, speed: 60, stamina: 60, professionalism: 88, leadership: 75 } },
  { name: "Patrik Laine", number: 29, pos: "RW", age: 28, nationality: "FI", contract: { years: 1, salary: 875 }, attrs: { shotAccuracy: 92, shotRange: 94, offensiveRead: 75, speed: 68, checking: 35, hitting: 32, defensiveRead: 45, professionalism: 55, temperament: 55 } },
  { name: "Alex Newhook", number: 15, pos: "C", age: 25, nationality: "CA", contract: { years: 3, salary: 2750 }, attrs: { speed: 85, acceleration: 86, agility: 82, offensiveRead: 74, puckhandling: 76, shotAccuracy: 70, faceoffs: 55 } },
  { name: "Jake Evans", number: 71, pos: "C", age: 30, nationality: "CA", contract: { years: 3, salary: 1700 }, attrs: { defensiveRead: 82, faceoffs: 80, positioning: 80, stickchecking: 78, shotAccuracy: 60, offensiveRead: 65, professionalism: 85, teamPlayer: 85 } },
  { name: "Zachary Bolduc", number: 76, pos: "LW", age: 23, nationality: "CA", contract: { years: 2, salary: 1000 }, attrs: { shotAccuracy: 78, shotRange: 76, puckhandling: 72, speed: 74, offensiveRead: 68, strength: 60 } },
  { name: "Oliver Kapanen", number: 24, pos: "RW", age: 23, nationality: "FI", contract: { years: 2, salary: 850 }, attrs: { offensiveRead: 65, defensiveRead: 65, speed: 72, puckhandling: 65, passing: 65 } },
  { name: "Joe Veleno", number: 40, pos: "C", age: 24, nationality: "CA", contract: { years: 1, salary: 1250 }, attrs: { checking: 65, hitting: 62, speed: 70, faceoffs: 60, offensiveRead: 55 } },
  { name: "Noah Dobson", number: 8, pos: "LD", age: 26, nationality: "CA", contract: { years: 7, salary: 9500 }, attrs: { passing: 85, offensiveRead: 84, shotAccuracy: 75, puckhandling: 78, positioning: 78, defensiveRead: 78, speed: 75, acceleration: 72, strength: 70 } },
  { name: "Lane Hutson", number: 48, pos: "RD", age: 22, nationality: "US", contract: { years: 2, salary: 950 }, attrs: { passing: 92, offensiveRead: 90, puckhandling: 88, agility: 88, acceleration: 85, speed: 82, shotAccuracy: 70, strength: 40, hitting: 30, checking: 35, positioning: 60 } },
  { name: "Kaiden Guhle", number: 21, pos: "LD", age: 24, nationality: "CA", contract: { years: 7, salary: 5625 }, attrs: { positioning: 82, defensiveRead: 80, hitting: 78, checking: 78, strength: 80, stickchecking: 78, puckhandling: 65, passing: 65, speed: 70 } },
  { name: "Mike Matheson", number: 8, pos: "RD", age: 32, nationality: "CA", contract: { years: 5, salary: 4875 }, attrs: { speed: 82, acceleration: 78, offensiveRead: 75, passing: 75, positioning: 70, leadership: 78, professionalism: 80 } },
  { name: "Alexandre Carrier", number: 45, pos: "LD", age: 27, nationality: "CA", contract: { years: 3, salary: 2500 }, attrs: { positioning: 75, defensiveRead: 74, stickchecking: 72, puckhandling: 62, speed: 70 } },
  { name: "Jayden Struble", number: 47, pos: "RD", age: 23, nationality: "US", contract: { years: 2, salary: 1150 }, attrs: { hitting: 75, checking: 72, strength: 78, positioning: 62, speed: 68 } },
  { name: "Arber Xhekaj", number: 72, pos: "LD", age: 25, nationality: "CA", contract: { years: 3, salary: 2300 }, attrs: { hitting: 88, checking: 85, strength: 90, fighting: 90, aggressiveness: 85, bravery: 88, positioning: 55, puckhandling: 45, speed: 55, temperament: 40 } },
  { name: "Jakub Dobeš", number: 75, pos: "G", age: 24, nationality: "CZ", contract: { years: 2, salary: 950 }, attrs: { reflexes: 82, positioning: 80, reboundControl: 76, recovery: 78, lateralMovement: 78, determination: 80, professionalism: 75, agility: 75, stamina: 78 } },
  { name: "Samuel Montembeault", number: 35, pos: "G", age: 29, nationality: "CA", contract: { years: 3, salary: 3250 }, attrs: { reflexes: 75, positioning: 76, reboundControl: 74, recovery: 72, lateralMovement: 72, professionalism: 78, stamina: 72 } },
];
const TOR_ROSTER_DATA = [
  { name: "Auston Matthews", number: 34, pos: "C", age: 28, nationality: "US", contract: { years: 3, salary: 13250 }, attrs: { shotAccuracy: 93, shotRange: 90, offensiveRead: 85, faceoffs: 80, leadership: 88, professionalism: 85, speed: 78, strength: 75 } },
  { name: "William Nylander", number: 88, pos: "LW", age: 29, nationality: "SE", contract: { years: 6, salary: 11500 }, attrs: { passing: 85, offensiveRead: 86, puckhandling: 85, shotAccuracy: 82, speed: 80, stamina: 85 } },
  { name: "John Tavares", number: 91, pos: "C", age: 35, nationality: "CA", contract: { years: 1, salary: 4400 }, attrs: { shotAccuracy: 80, offensiveRead: 82, faceoffs: 78, leadership: 82, professionalism: 85, speed: 60, strength: 70 } },
  { name: "Max Domi", number: 11, pos: "C", age: 31, nationality: "CA", contract: { years: 2, salary: 3750 }, attrs: { checking: 75, hitting: 70, aggressiveness: 78, passing: 72, offensiveRead: 68, speed: 72 } },
  { name: "Matthew Knies", number: 23, pos: "RW", age: 23, nationality: "US", contract: { years: 6, salary: 7750 }, attrs: { strength: 82, hitting: 75, checking: 70, shotAccuracy: 75, puckhandling: 68, speed: 70, determination: 80 } },
  { name: "Bobby McMann", number: 74, pos: "LW", age: 29, nationality: "CA", contract: { years: 2, salary: 2000 }, attrs: { shotAccuracy: 70, speed: 75, hitting: 60, checking: 58 } },
  { name: "Nicolas Roy", number: 55, pos: "C", age: 29, nationality: "CA", contract: { years: 4, salary: 4000 }, attrs: { defensiveRead: 75, faceoffs: 72, checking: 65, hitting: 62, shotAccuracy: 62 } },
  { name: "David Kämpf", number: 64, pos: "C", age: 31, nationality: "CZ", contract: { years: 1, salary: 2400 }, attrs: { defensiveRead: 85, faceoffs: 82, positioning: 82, stickchecking: 80, shotAccuracy: 45 } },
  { name: "Pontus Holmberg", number: 29, pos: "C", age: 25, nationality: "SE", contract: { years: 2, salary: 1300 }, attrs: { offensiveRead: 60, defensiveRead: 62, speed: 68 } },
  { name: "Nikita Grebenkin", number: 68, pos: "RW", age: 23, nationality: "RU", contract: { years: 2, salary: 900 }, attrs: { puckhandling: 68, speed: 72, strength: 65 } },
  { name: "Easton Cowan", number: 27, pos: "LW", age: 21, nationality: "CA", contract: { years: 3, salary: 900 }, attrs: { offensiveRead: 70, puckhandling: 72, speed: 75, strength: 50 } },
  { name: "Steven Lorentz", number: 18, pos: "RW", age: 30, nationality: "CA", contract: { years: 2, salary: 1300 }, attrs: { hitting: 68, checking: 65, strength: 75, speed: 60 } },
  { name: "Morgan Rielly", number: 44, pos: "LD", age: 32, nationality: "CA", contract: { years: 4, salary: 7500 }, attrs: { passing: 80, offensiveRead: 78, puckhandling: 75, speed: 75, leadership: 80 } },
  { name: "Jake McCabe", number: 22, pos: "RD", age: 32, nationality: "US", contract: { years: 3, salary: 6250 }, attrs: { positioning: 80, defensiveRead: 80, hitting: 75, checking: 75, strength: 78 } },
  { name: "Brandon Carlo", number: 25, pos: "LD", age: 29, nationality: "US", contract: { years: 6, salary: 4100 }, attrs: { positioning: 82, defensiveRead: 80, hitting: 78, checking: 76, strength: 82, shotBlocking: 80 } },
  { name: "Oliver Ekman-Larsson", number: 95, pos: "RD", age: 34, nationality: "SE", contract: { years: 1, salary: 3500 }, attrs: { passing: 74, offensiveRead: 72, positioning: 68, speed: 68, professionalism: 80 } },
  { name: "Simon Benoit", number: 2, pos: "LD", age: 27, nationality: "CA", contract: { years: 3, salary: 1350 }, attrs: { hitting: 75, checking: 72, strength: 78, positioning: 60 } },
  { name: "Chris Tanev", number: 8, pos: "RD", age: 36, nationality: "CA", contract: { years: 3, salary: 4500 }, attrs: { positioning: 88, defensiveRead: 86, shotBlocking: 85, stickchecking: 82, strength: 72, professionalism: 85 } },
  { name: "Timothy Liljegren", number: 37, pos: "LD", age: 27, nationality: "SE", contract: { years: 2, salary: 1400 }, attrs: { positioning: 65, puckhandling: 65, speed: 70 } },
  { name: "Anthony Stolarz", number: 41, pos: "G", age: 32, nationality: "US", contract: { years: 3, salary: 2600 }, attrs: { reflexes: 82, positioning: 82, reboundControl: 78, recovery: 78 } },
  { name: "Dennis Hildeby", number: 70, pos: "G", age: 24, nationality: "SE", contract: { years: 2, salary: 850 }, attrs: { reflexes: 72, positioning: 72, reboundControl: 68, recovery: 68 } },
];
const BOS_ROSTER_DATA = [
  { name: "David Pastrnak", number: 88, pos: "LW", age: 29, nationality: "CZ", contract: { years: 5, salary: 11250 }, attrs: { shotAccuracy: 94, shotRange: 92, offensiveRead: 85, puckhandling: 80, speed: 78, gettingOpen: 85 } },
  { name: "Pavel Zacha", number: 18, pos: "C", age: 28, nationality: "CZ", contract: { years: 4, salary: 4750 }, attrs: { passing: 75, offensiveRead: 74, shotAccuracy: 70, faceoffs: 65, defensiveRead: 65 } },
  { name: "Morgan Geekie", number: 39, pos: "C", age: 27, nationality: "CA", contract: { years: 5, salary: 3300 }, attrs: { shotAccuracy: 72, strength: 75, hitting: 65, checking: 62, offensiveRead: 68 } },
  { name: "Viktor Arvidsson", number: 33, pos: "RW", age: 32, nationality: "SE", contract: { years: 1, salary: 1500 }, attrs: { speed: 78, shotAccuracy: 75, offensiveRead: 70, acceleration: 78 } },
  { name: "Elias Lindholm", number: 28, pos: "C", age: 30, nationality: "SE", contract: { years: 5, salary: 7750 }, attrs: { passing: 74, offensiveRead: 75, shotAccuracy: 74, faceoffs: 68, defensiveRead: 65 } },
  { name: "Casey Mittelstadt", number: 37, pos: "C", age: 26, nationality: "US", contract: { years: 2, salary: 2900 }, attrs: { passing: 72, offensiveRead: 70, puckhandling: 70, shotAccuracy: 65 } },
  { name: "Fraser Minten", number: 24, pos: "C", age: 21, nationality: "CA", contract: { years: 2, salary: 850 }, attrs: { defensiveRead: 62, faceoffs: 60, offensiveRead: 58 } },
  { name: "Marat Khusnutdinov", number: 82, pos: "LW", age: 23, nationality: "RU", contract: { years: 2, salary: 950 }, attrs: { speed: 74, offensiveRead: 62, checking: 60, defensiveRead: 62 } },
  { name: "Tanner Jeannot", number: 13, pos: "RW", age: 27, nationality: "CA", contract: { years: 4, salary: 2650 }, attrs: { hitting: 82, checking: 78, strength: 80, aggressiveness: 75, fighting: 70 } },
  { name: "Sean Kuraly", number: 52, pos: "C", age: 32, nationality: "US", contract: { years: 2, salary: 1400 }, attrs: { checking: 70, hitting: 68, faceoffs: 65, defensiveRead: 68, speed: 65 } },
  { name: "Mark Kastelic", number: 47, pos: "LW", age: 26, nationality: "CA", contract: { years: 2, salary: 1400 }, attrs: { hitting: 75, checking: 70, strength: 75, aggressiveness: 65 } },
  { name: "Michael Eyssimont", number: 25, pos: "RW", age: 27, nationality: "US", contract: { years: 2, salary: 900 }, attrs: { speed: 75, checking: 60, hitting: 58 } },
  { name: "Alex Steeves", number: 79, pos: "LW", age: 24, nationality: "US", contract: { years: 2, salary: 850 }, attrs: { speed: 70, shotAccuracy: 62, offensiveRead: 58 } },
  { name: "Charlie McAvoy", number: 73, pos: "LD", age: 27, nationality: "US", contract: { years: 6, salary: 9500 }, attrs: { passing: 82, offensiveRead: 80, positioning: 75, defensiveRead: 76, speed: 78, puckhandling: 76, leadership: 78 } },
  { name: "Hampus Lindholm", number: 27, pos: "RD", age: 32, nationality: "SE", contract: { years: 5, salary: 6500 }, attrs: { positioning: 78, defensiveRead: 78, puckhandling: 70, passing: 68, shotBlocking: 76, strength: 75 } },
  { name: "Mason Lohrei", number: 6, pos: "LD", age: 23, nationality: "US", contract: { years: 2, salary: 900 }, attrs: { puckhandling: 72, passing: 70, offensiveRead: 68, speed: 72, positioning: 60 } },
  { name: "Nikita Zadorov", number: 91, pos: "RD", age: 30, nationality: "RU", contract: { years: 5, salary: 5000 }, attrs: { hitting: 82, checking: 80, strength: 85, positioning: 65, aggressiveness: 70 } },
  { name: "Henri Jokiharju", number: 4, pos: "LD", age: 26, nationality: "FI", contract: { years: 4, salary: 3400 }, attrs: { positioning: 68, defensiveRead: 66, puckhandling: 62, passing: 62 } },
  { name: "Andrew Peeke", number: 26, pos: "RD", age: 27, nationality: "US", contract: { years: 3, salary: 2500 }, attrs: { positioning: 70, defensiveRead: 68, hitting: 65, checking: 62 } },
  { name: "Jeremy Swayman", number: 1, pos: "G", age: 27, nationality: "US", contract: { years: 7, salary: 8250 }, attrs: { reflexes: 88, positioning: 85, reboundControl: 80, recovery: 82, professionalism: 80 } },
  { name: "Michael DiPietro", number: 78, pos: "G", age: 26, nationality: "CA", contract: { years: 1, salary: 800 }, attrs: { reflexes: 68, positioning: 68, reboundControl: 65, recovery: 65 } },
];
const BUF_ROSTER_DATA = [
  { name: "Tage Thompson", number: 72, pos: "C", age: 27, nationality: "US", contract: { years: 6, salary: 7143 }, attrs: { shotAccuracy: 85, shotRange: 88, strength: 80, speed: 75, offensiveRead: 75 } },
  { name: "Alex Tuch", number: 89, pos: "LW", age: 29, nationality: "US", contract: { years: 6, salary: 4750 }, attrs: { strength: 78, hitting: 65, shotAccuracy: 78, speed: 72, offensiveRead: 74 } },
  { name: "Josh Norris", number: 9, pos: "C", age: 26, nationality: "US", contract: { years: 3, salary: 4200 }, attrs: { shotAccuracy: 75, offensiveRead: 72, faceoffs: 65, passing: 68 } },
  { name: "JJ Peterka", number: 77, pos: "RW", age: 23, nationality: "DE", contract: { years: 3, salary: 3200 }, attrs: { speed: 80, shotAccuracy: 76, puckhandling: 78, offensiveRead: 74 } },
  { name: "Jiri Kulich", number: 17, pos: "LW", age: 21, nationality: "CZ", contract: { years: 2, salary: 950 }, attrs: { speed: 78, shotAccuracy: 74, acceleration: 78 } },
  { name: "Zach Benson", number: 10, pos: "RW", age: 20, nationality: "CA", contract: { years: 2, salary: 900 }, attrs: { offensiveRead: 72, puckhandling: 74, speed: 70 } },
  { name: "Ryan McLeod", number: 71, pos: "C", age: 25, nationality: "CA", contract: { years: 3, salary: 2000 }, attrs: { speed: 78, checking: 68, defensiveRead: 65 } },
  { name: "Jason Zucker", number: 18, pos: "LW", age: 33, nationality: "US", contract: { years: 1, salary: 3200 }, attrs: { speed: 75, hitting: 60, shotAccuracy: 65, professionalism: 75 } },
  { name: "Jack Quinn", number: 22, pos: "RW", age: 23, nationality: "CA", contract: { years: 2, salary: 1600 }, attrs: { shotAccuracy: 70, speed: 72 } },
  { name: "Peyton Krebs", number: 19, pos: "C", age: 23, nationality: "CA", contract: { years: 2, salary: 1650 }, attrs: { passing: 68, offensiveRead: 65 } },
  { name: "Beck Malenstyn", number: 62, pos: "LW", age: 26, nationality: "CA", contract: { years: 2, salary: 900 }, attrs: { hitting: 70, checking: 65, speed: 68 } },
  { name: "Rasmus Dahlin", number: 26, pos: "LD", age: 25, nationality: "SE", contract: { years: 8, salary: 11000 }, attrs: { passing: 85, offensiveRead: 84, puckhandling: 80, speed: 82, leadership: 75 } },
  { name: "Owen Power", number: 25, pos: "RD", age: 22, nationality: "CA", contract: { years: 5, salary: 8355 }, attrs: { positioning: 75, passing: 74, puckhandling: 72, speed: 74, strength: 75 } },
  { name: "Bowen Byram", number: 4, pos: "LD", age: 24, nationality: "CA", contract: { years: 2, salary: 3900 }, attrs: { puckhandling: 76, offensiveRead: 72, speed: 78, positioning: 60 } },
  { name: "Mattias Samuelsson", number: 23, pos: "RD", age: 24, nationality: "US", contract: { years: 3, salary: 2350 }, attrs: { hitting: 75, checking: 72, strength: 78, positioning: 65 } },
  { name: "Conor Timmins", number: 38, pos: "LD", age: 26, nationality: "CA", contract: { years: 2, salary: 1400 }, attrs: { positioning: 65, defensiveRead: 64, puckhandling: 60 } },
  { name: "Jacob Bryson", number: 78, pos: "RD", age: 27, nationality: "CA", contract: { years: 1, salary: 900 }, attrs: { hitting: 65, checking: 62, positioning: 58 } },
  { name: "Devon Levi", number: 27, pos: "G", age: 23, nationality: "CA", contract: { years: 2, salary: 950 }, attrs: { reflexes: 78, positioning: 75, reboundControl: 72, recovery: 74 } },
  { name: "Alex Lyon", number: 34, pos: "G", age: 32, nationality: "US", contract: { years: 1, salary: 850 }, attrs: { reflexes: 70, positioning: 70, reboundControl: 66 } },
];
const DET_ROSTER_DATA = [
  { name: "Dylan Larkin", number: 71, pos: "C", age: 29, nationality: "US", contract: { years: 5, salary: 8700 }, attrs: { speed: 85, shotAccuracy: 78, offensiveRead: 80, leadership: 85, acceleration: 85 } },
  { name: "Lucas Raymond", number: 23, pos: "LW", age: 23, nationality: "SE", contract: { years: 7, salary: 9000 }, attrs: { offensiveRead: 80, puckhandling: 78, shotAccuracy: 76, speed: 78 } },
  { name: "Alex DeBrincat", number: 93, pos: "RW", age: 28, nationality: "US", contract: { years: 1, salary: 7875 }, attrs: { shotAccuracy: 88, shotRange: 82, offensiveRead: 82, gettingOpen: 82, speed: 76 } },
  { name: "Patrick Kane", number: 88, pos: "LW", age: 37, nationality: "US", contract: { years: 1, salary: 2750 }, attrs: { passing: 82, offensiveRead: 85, puckhandling: 80, shotAccuracy: 78, speed: 55, professionalism: 80 } },
  { name: "J.T. Compher", number: 37, pos: "C", age: 30, nationality: "US", contract: { years: 3, salary: 5100 }, attrs: { checking: 68, defensiveRead: 68, shotAccuracy: 65 } },
  { name: "Andrew Copp", number: 18, pos: "C", age: 31, nationality: "US", contract: { years: 2, salary: 5625 }, attrs: { checking: 70, faceoffs: 68, defensiveRead: 68, hitting: 62 } },
  { name: "Marco Kasper", number: 92, pos: "C", age: 22, nationality: "AT", contract: { years: 2, salary: 950 }, attrs: { offensiveRead: 65, checking: 62, speed: 70 } },
  { name: "Michael Rasmussen", number: 27, pos: "C", age: 26, nationality: "CA", contract: { years: 4, salary: 3400 }, attrs: { strength: 78, hitting: 70, checking: 68, shotAccuracy: 62 } },
  { name: "Tyler Motte", number: 64, pos: "RW", age: 30, nationality: "US", contract: { years: 1, salary: 1200 }, attrs: { speed: 75, checking: 65, hitting: 60 } },
  { name: "Jonatan Berggren", number: 52, pos: "LW", age: 25, nationality: "SE", contract: { years: 1, salary: 1000 }, attrs: { shotAccuracy: 68, offensiveRead: 64 } },
  { name: "Moritz Seider", number: 53, pos: "LD", age: 24, nationality: "DE", contract: { years: 7, salary: 8550 }, attrs: { positioning: 80, defensiveRead: 80, passing: 74, puckhandling: 72, strength: 80, leadership: 75 } },
  { name: "Simon Edvinsson", number: 77, pos: "RD", age: 22, nationality: "SE", contract: { years: 2, salary: 950 }, attrs: { puckhandling: 75, offensiveRead: 72, speed: 75, positioning: 65 } },
  { name: "Ben Chiarot", number: 8, pos: "LD", age: 34, nationality: "CA", contract: { years: 1, salary: 4750 }, attrs: { hitting: 75, checking: 72, strength: 78, positioning: 65 } },
  { name: "Jeff Petry", number: 46, pos: "RD", age: 37, nationality: "CA", contract: { years: 1, salary: 1500 }, attrs: { positioning: 68, puckhandling: 65, passing: 65 } },
  { name: "Albert Johansson", number: 63, pos: "LD", age: 24, nationality: "SE", contract: { years: 1, salary: 850 }, attrs: { positioning: 60, speed: 68 } },
  { name: "Erik Gustafsson", number: 51, pos: "RD", age: 33, nationality: "SE", contract: { years: 1, salary: 1400 }, attrs: { passing: 70, offensiveRead: 68, puckhandling: 68 } },
  { name: "Cam Talbot", number: 33, pos: "G", age: 38, nationality: "CA", contract: { years: 1, salary: 2500 }, attrs: { reflexes: 76, positioning: 78, reboundControl: 74, professionalism: 80 } },
  { name: "Ville Husso", number: 35, pos: "G", age: 30, nationality: "FI", contract: { years: 1, salary: 950 }, attrs: { reflexes: 72, positioning: 72, reboundControl: 68 } },
];
const FLA_ROSTER_DATA = [
  { name: "Aleksander Barkov", number: 16, pos: "C", age: 30, nationality: "FI", contract: { years: 6, salary: 10000 }, attrs: { offensiveRead: 90, passing: 82, defensiveRead: 82, faceoffs: 85, leadership: 90, shotAccuracy: 78, professionalism: 90 } },
  { name: "Matthew Tkachuk", number: 19, pos: "LW", age: 28, nationality: "US", contract: { years: 5, salary: 9500 }, attrs: { hitting: 85, checking: 78, shotAccuracy: 82, offensiveRead: 80, aggressiveness: 85, strength: 82, determination: 88 } },
  { name: "Sam Reinhart", number: 13, pos: "RW", age: 30, nationality: "CA", contract: { years: 6, salary: 8625 }, attrs: { shotAccuracy: 88, offensiveRead: 80, gettingOpen: 82, speed: 75 } },
  { name: "Brad Marchand", number: 63, pos: "LW", age: 37, nationality: "CA", contract: { years: 2, salary: 5250 }, attrs: { offensiveRead: 82, passing: 78, aggressiveness: 75, shotAccuracy: 78, leadership: 80, temperament: 45 } },
  { name: "Carter Verhaeghe", number: 23, pos: "RW", age: 30, nationality: "CA", contract: { years: 4, salary: 6500 }, attrs: { shotAccuracy: 80, speed: 76, offensiveRead: 75 } },
  { name: "Sam Bennett", number: 9, pos: "C", age: 29, nationality: "CA", contract: { years: 6, salary: 8000 }, attrs: { hitting: 78, checking: 75, strength: 80, shotAccuracy: 70, aggressiveness: 78, fighting: 70 } },
  { name: "Anton Lundell", number: 15, pos: "C", age: 24, nationality: "FI", contract: { years: 6, salary: 5000 }, attrs: { defensiveRead: 75, faceoffs: 72, offensiveRead: 70 } },
  { name: "Eetu Luostarinen", number: 27, pos: "C", age: 27, nationality: "FI", contract: { years: 5, salary: 3000 }, attrs: { defensiveRead: 74, checking: 68, speed: 72 } },
  { name: "Jesper Boqvist", number: 70, pos: "LW", age: 27, nationality: "SE", contract: { years: 1, salary: 900 }, attrs: { speed: 72, offensiveRead: 62 } },
  { name: "Aaron Ekblad", number: 5, pos: "LD", age: 29, nationality: "CA", contract: { years: 8, salary: 6100 }, attrs: { positioning: 80, shotBlocking: 78, strength: 80, hitting: 70, puckhandling: 65, passing: 65 } },
  { name: "Gustav Forsling", number: 42, pos: "RD", age: 29, nationality: "SE", contract: { years: 8, salary: 8500 }, attrs: { positioning: 78, defensiveRead: 78, puckhandling: 68, passing: 66 } },
  { name: "Seth Jones", number: 3, pos: "LD", age: 31, nationality: "US", contract: { years: 4, salary: 5750 }, attrs: { passing: 78, offensiveRead: 76, speed: 76, puckhandling: 74 } },
  { name: "Niko Mikkola", number: 77, pos: "RD", age: 29, nationality: "FI", contract: { years: 3, salary: 2750 }, attrs: { hitting: 74, checking: 70, positioning: 65 } },
  { name: "Dmitry Kulikov", number: 7, pos: "LD", age: 35, nationality: "RU", contract: { years: 1, salary: 1200 }, attrs: { positioning: 62, hitting: 60, defensiveRead: 60 } },
  { name: "Sergei Bobrovsky", number: 72, pos: "G", age: 37, nationality: "RU", contract: { years: 2, salary: 10000 }, attrs: { reflexes: 85, positioning: 86, reboundControl: 80, recovery: 80, professionalism: 85 } },
  { name: "Spencer Knight", number: 30, pos: "G", age: 24, nationality: "US", contract: { years: 2, salary: 3800 }, attrs: { reflexes: 76, positioning: 74, reboundControl: 70 } },
];
const OTT_ROSTER_DATA = [
  { name: "Tim Stützle", number: 18, pos: "C", age: 23, nationality: "DE", contract: { years: 7, salary: 8700 }, attrs: { offensiveRead: 85, passing: 80, shotAccuracy: 78, speed: 80, puckhandling: 80 } },
  { name: "Brady Tkachuk", number: 7, pos: "LW", age: 26, nationality: "US", contract: { years: 6, salary: 9500 }, attrs: { hitting: 82, checking: 75, shotAccuracy: 74, aggressiveness: 80, leadership: 85, strength: 80, bravery: 85 } },
  { name: "Drake Batherson", number: 19, pos: "RW", age: 27, nationality: "CA", contract: { years: 5, salary: 4975 }, attrs: { shotAccuracy: 78, offensiveRead: 74, speed: 74 } },
  { name: "Claude Giroux", number: 28, pos: "C", age: 37, nationality: "CA", contract: { years: 1, salary: 3500 }, attrs: { passing: 78, offensiveRead: 78, faceoffs: 70, leadership: 80, speed: 55, professionalism: 85 } },
  { name: "Shane Pinto", number: 57, pos: "C", age: 24, nationality: "US", contract: { years: 2, salary: 3700 }, attrs: { shotAccuracy: 74, offensiveRead: 70, faceoffs: 65 } },
  { name: "Ridly Greig", number: 71, pos: "LW", age: 22, nationality: "CA", contract: { years: 4, salary: 2100 }, attrs: { hitting: 70, checking: 65, speed: 75, aggressiveness: 70 } },
  { name: "Adam Gaudette", number: 88, pos: "C", age: 29, nationality: "US", contract: { years: 1, salary: 900 }, attrs: { checking: 65, faceoffs: 62, speed: 70 } },
  { name: "Fabian Zetterlund", number: 20, pos: "RW", age: 26, nationality: "SE", contract: { years: 3, salary: 2900 }, attrs: { shotAccuracy: 70, offensiveRead: 65 } },
  { name: "Michael Amadio", number: 22, pos: "LW", age: 28, nationality: "CA", contract: { years: 1, salary: 1200 }, attrs: { speed: 70, checking: 60 } },
  { name: "Jake Sanderson", number: 85, pos: "LD", age: 23, nationality: "US", contract: { years: 8, salary: 8500 }, attrs: { positioning: 78, passing: 76, offensiveRead: 75, speed: 78, leadership: 72 } },
  { name: "Thomas Chabot", number: 72, pos: "RD", age: 28, nationality: "CA", contract: { years: 3, salary: 8000 }, attrs: { passing: 78, offensiveRead: 76, puckhandling: 74, positioning: 68 } },
  { name: "Artem Zub", number: 2, pos: "LD", age: 29, nationality: "RU", contract: { years: 4, salary: 4600 }, attrs: { positioning: 74, defensiveRead: 74, shotBlocking: 72 } },
  { name: "Nick Jensen", number: 3, pos: "RD", age: 34, nationality: "US", contract: { years: 2, salary: 2250 }, attrs: { positioning: 68, defensiveRead: 66 } },
  { name: "Tyler Kleven", number: 22, pos: "LD", age: 23, nationality: "US", contract: { years: 2, salary: 900 }, attrs: { hitting: 72, checking: 68, strength: 75 } },
  { name: "Linus Ullmark", number: 35, pos: "G", age: 32, nationality: "SE", contract: { years: 4, salary: 8250 }, attrs: { reflexes: 87, positioning: 84, reboundControl: 80, recovery: 80, professionalism: 80 } },
  { name: "Mads Søgaard", number: 40, pos: "G", age: 25, nationality: "DK", contract: { years: 2, salary: 900 }, attrs: { reflexes: 70, positioning: 70, reboundControl: 65 } },
];
const TBL_ROSTER_DATA = [
  { name: "Nikita Kucherov", number: 86, pos: "LW", age: 32, nationality: "RU", contract: { years: 4, salary: 12000 }, attrs: { shotAccuracy: 92, offensiveRead: 92, passing: 88, puckhandling: 85, gettingOpen: 88, speed: 78 } },
  { name: "Brayden Point", number: 21, pos: "C", age: 29, nationality: "CA", contract: { years: 6, salary: 9500 }, attrs: { shotAccuracy: 85, offensiveRead: 82, faceoffs: 72, speed: 80, checking: 60 } },
  { name: "Jake Guentzel", number: 59, pos: "RW", age: 31, nationality: "US", contract: { years: 7, salary: 9000 }, attrs: { shotAccuracy: 82, offensiveRead: 78, speed: 76 } },
  { name: "Brandon Hagel", number: 38, pos: "LW", age: 27, nationality: "CA", contract: { years: 8, salary: 6800 }, attrs: { hitting: 72, checking: 70, shotAccuracy: 76, speed: 78, offensiveRead: 74 } },
  { name: "Anthony Cirelli", number: 71, pos: "C", age: 28, nationality: "CA", contract: { years: 6, salary: 6250 }, attrs: { defensiveRead: 78, faceoffs: 75, checking: 70, shotAccuracy: 65 } },
  { name: "Nick Paul", number: 20, pos: "RW", age: 30, nationality: "CA", contract: { years: 6, salary: 3150 }, attrs: { hitting: 70, checking: 68, shotAccuracy: 68, strength: 75 } },
  { name: "Yanni Gourde", number: 37, pos: "C", age: 33, nationality: "CA", contract: { years: 2, salary: 3167 }, attrs: { checking: 68, hitting: 62, speed: 74, defensiveRead: 66 } },
  { name: "Conor Sheary", number: 73, pos: "LW", age: 33, nationality: "US", contract: { years: 1, salary: 900 }, attrs: { speed: 74, shotAccuracy: 68 } },
  { name: "Gage Goncalves", number: 89, pos: "C", age: 23, nationality: "CA", contract: { years: 2, salary: 900 }, attrs: { offensiveRead: 62, speed: 70 } },
  { name: "Victor Hedman", number: 77, pos: "LD", age: 34, nationality: "SE", contract: { years: 2, salary: 7875 }, attrs: { positioning: 85, passing: 82, offensiveRead: 80, puckhandling: 78, strength: 82, leadership: 82, shotBlocking: 80 } },
  { name: "Ryan McDonagh", number: 27, pos: "RD", age: 36, nationality: "US", contract: { years: 1, salary: 6750 }, attrs: { positioning: 76, defensiveRead: 76, hitting: 68, leadership: 75 } },
  { name: "Erik Cernak", number: 81, pos: "LD", age: 28, nationality: "SK", contract: { years: 4, salary: 5000 }, attrs: { hitting: 78, checking: 75, strength: 80, positioning: 70 } },
  { name: "Nick Perbix", number: 48, pos: "RD", age: 25, nationality: "US", contract: { years: 3, salary: 2050 }, attrs: { positioning: 65, puckhandling: 62 } },
  { name: "Darren Raddysh", number: 43, pos: "LD", age: 28, nationality: "CA", contract: { years: 3, salary: 1650 }, attrs: { puckhandling: 65, offensiveRead: 62, speed: 70 } },
  { name: "Andrei Vasilevskiy", number: 88, pos: "G", age: 31, nationality: "RU", contract: { years: 5, salary: 9500 }, attrs: { reflexes: 88, positioning: 88, reboundControl: 82, recovery: 82, professionalism: 85 } },
  { name: "Jonas Johansson", number: 31, pos: "G", age: 29, nationality: "SE", contract: { years: 1, salary: 900 }, attrs: { reflexes: 70, positioning: 70, reboundControl: 65 } },
];
const CAR_ROSTER_DATA = [
  { name: "Sebastian Aho", number: 20, pos: "C", age: 28, nationality: "FI", contract: { years: 6, salary: 9750 }, attrs: { shotAccuracy: 85, offensiveRead: 85, passing: 80, faceoffs: 70, speed: 78, leadership: 82 } },
  { name: "Seth Jarvis", number: 24, pos: "LW", age: 23, nationality: "CA", contract: { years: 8, salary: 8000 }, attrs: { shotAccuracy: 78, speed: 78, offensiveRead: 74, puckhandling: 72 } },
  { name: "Andrei Svechnikov", number: 37, pos: "RW", age: 25, nationality: "RU", contract: { years: 5, salary: 7750 }, attrs: { strength: 80, hitting: 65, shotAccuracy: 78, puckhandling: 75, speed: 75 } },
  { name: "Jordan Staal", number: 11, pos: "C", age: 37, nationality: "CA", contract: { years: 1, salary: 5000 }, attrs: { faceoffs: 78, defensiveRead: 78, checking: 70, strength: 78, leadership: 75 } },
  { name: "Nikolaj Ehlers", number: 27, pos: "LW", age: 29, nationality: "DK", contract: { years: 8, salary: 6375 }, attrs: { shotAccuracy: 82, speed: 82, offensiveRead: 76, acceleration: 82 } },
  { name: "Logan Stankoven", number: 13, pos: "RW", age: 22, nationality: "CA", contract: { years: 2, salary: 950 }, attrs: { speed: 80, shotAccuracy: 74, offensiveRead: 70 } },
  { name: "Jesperi Kotkaniemi", number: 82, pos: "C", age: 25, nationality: "FI", contract: { years: 4, salary: 4820 }, attrs: { offensiveRead: 68, checking: 62, defensiveRead: 65 } },
  { name: "William Carrier", number: 28, pos: "LW", age: 29, nationality: "CA", contract: { years: 3, salary: 1650 }, attrs: { hitting: 75, checking: 70, strength: 78, fighting: 60 } },
  { name: "Jack Roslovic", number: 96, pos: "C", age: 28, nationality: "US", contract: { years: 2, salary: 1500 }, attrs: { offensiveRead: 65, speed: 74, shotAccuracy: 65 } },
  { name: "Jaccob Slavin", number: 74, pos: "LD", age: 31, nationality: "US", contract: { years: 7, salary: 6396 }, attrs: { positioning: 88, defensiveRead: 86, shotBlocking: 82, speed: 80, puckhandling: 70, leadership: 78 } },
  { name: "K'Andre Miller", number: 6, pos: "RD", age: 25, nationality: "US", contract: { years: 8, salary: 7500 }, attrs: { puckhandling: 76, offensiveRead: 74, speed: 76, positioning: 70, passing: 70 } },
  { name: "Sean Walker", number: 26, pos: "LD", age: 31, nationality: "CA", contract: { years: 4, salary: 3600 }, attrs: { positioning: 70, hitting: 68, defensiveRead: 68, speed: 72 } },
  { name: "Shayne Gostisbehere", number: 4, pos: "RD", age: 32, nationality: "US", contract: { years: 1, salary: 3200 }, attrs: { passing: 76, offensiveRead: 74, puckhandling: 74, speed: 70, positioning: 55 } },
  { name: "Jalen Chatfield", number: 5, pos: "LD", age: 29, nationality: "CA", contract: { years: 3, salary: 3000 }, attrs: { positioning: 68, hitting: 65, defensiveRead: 65 } },
  { name: "Alexander Nikishin", number: 73, pos: "RD", age: 23, nationality: "RU", contract: { years: 2, salary: 950 }, attrs: { puckhandling: 68, speed: 74, offensiveRead: 64, strength: 72 } },
  { name: "Pyotr Kochetkov", number: 52, pos: "G", age: 26, nationality: "RU", contract: { years: 3, salary: 3125 }, attrs: { reflexes: 80, positioning: 78, reboundControl: 75, recovery: 76 } },
  { name: "Frederik Andersen", number: 31, pos: "G", age: 36, nationality: "DK", contract: { years: 2, salary: 3600 }, attrs: { reflexes: 78, positioning: 80, reboundControl: 76, recovery: 74, professionalism: 82 } },
];
const NYR_ROSTER_DATA = [
  { name: "Artemi Panarin", number: 10, pos: "LW", age: 33, nationality: "RU", contract: { years: 2, salary: 11643 }, attrs: { passing: 90, offensiveRead: 88, puckhandling: 85, shotAccuracy: 82, speed: 78 } },
  { name: "Mika Zibanejad", number: 93, pos: "C", age: 32, nationality: "SE", contract: { years: 5, salary: 8500 }, attrs: { shotAccuracy: 82, offensiveRead: 78, faceoffs: 68, passing: 75, leadership: 75 } },
  { name: "Vincent Trocheck", number: 16, pos: "C", age: 32, nationality: "CA", contract: { years: 3, salary: 5625 }, attrs: { faceoffs: 75, checking: 70, offensiveRead: 72, speed: 76 } },
  { name: "J.T. Miller", number: 9, pos: "C", age: 32, nationality: "US", contract: { years: 5, salary: 8000 }, attrs: { shotAccuracy: 76, offensiveRead: 78, hitting: 68, checking: 65, passing: 74 } },
  { name: "Alexis Lafrenière", number: 13, pos: "RW", age: 23, nationality: "CA", contract: { years: 7, salary: 7450 }, attrs: { shotAccuracy: 78, offensiveRead: 76, speed: 76, puckhandling: 74 } },
  { name: "Kaapo Kakko", number: 24, pos: "LW", age: 24, nationality: "FI", contract: { years: 1, salary: 2400 }, attrs: { shotAccuracy: 70, strength: 74, hitting: 60, offensiveRead: 62 } },
  { name: "Will Cuylle", number: 50, pos: "RW", age: 23, nationality: "CA", contract: { years: 2, salary: 1650 }, attrs: { hitting: 72, checking: 66, shotAccuracy: 68, strength: 76 } },
  { name: "Jimmy Vesey", number: 26, pos: "LW", age: 32, nationality: "US", contract: { years: 1, salary: 800 }, attrs: { shotAccuracy: 65, speed: 68 } },
  { name: "Matt Rempe", number: 73, pos: "C", age: 23, nationality: "CA", contract: { years: 2, salary: 900 }, attrs: { strength: 88, hitting: 82, fighting: 85, aggressiveness: 78, speed: 58 } },
  { name: "Adam Fox", number: 23, pos: "LD", age: 27, nationality: "US", contract: { years: 6, salary: 9500 }, attrs: { passing: 88, offensiveRead: 86, puckhandling: 82, speed: 78, positioning: 72, leadership: 78 } },
  { name: "Braden Schneider", number: 4, pos: "RD", age: 24, nationality: "CA", contract: { years: 4, salary: 3400 }, attrs: { hitting: 74, checking: 72, positioning: 70, strength: 78 } },
  { name: "Ryan Lindgren", number: 55, pos: "LD", age: 27, nationality: "US", contract: { years: 3, salary: 4500 }, attrs: { positioning: 76, defensiveRead: 76, hitting: 70, shotBlocking: 74 } },
  { name: "Zac Jones", number: 6, pos: "RD", age: 24, nationality: "US", contract: { years: 2, salary: 1500 }, attrs: { puckhandling: 68, offensiveRead: 64, speed: 74 } },
  { name: "Victor Mancini", number: 90, pos: "LD", age: 23, nationality: "US", contract: { years: 2, salary: 850 }, attrs: { hitting: 68, positioning: 60 } },
  { name: "Igor Shesterkin", number: 31, pos: "G", age: 30, nationality: "RU", contract: { years: 8, salary: 11559 }, attrs: { reflexes: 92, positioning: 90, reboundControl: 85, recovery: 85, professionalism: 82 } },
  { name: "Jonathan Quick", number: 32, pos: "G", age: 40, nationality: "US", contract: { years: 1, salary: 1200 }, attrs: { reflexes: 72, positioning: 74, reboundControl: 68, professionalism: 85 } },
];
const NYI_ROSTER_DATA = [
  { name: "Mathew Barzal", number: 13, pos: "C", age: 28, nationality: "CA", contract: { years: 5, salary: 9150 }, attrs: { offensiveRead: 85, puckhandling: 84, speed: 84, passing: 78 } },
  { name: "Bo Horvat", number: 14, pos: "C", age: 30, nationality: "CA", contract: { years: 5, salary: 8500 }, attrs: { shotAccuracy: 78, faceoffs: 76, leadership: 82, offensiveRead: 72 } },
  { name: "Anders Lee", number: 27, pos: "LW", age: 35, nationality: "US", contract: { years: 1, salary: 6000 }, attrs: { strength: 78, hitting: 65, shotAccuracy: 74, gettingOpen: 74 } },
  { name: "Kyle Palmieri", number: 21, pos: "RW", age: 34, nationality: "US", contract: { years: 1, salary: 3000 }, attrs: { shotAccuracy: 76, speed: 70, offensiveRead: 68 } },
  { name: "Simon Holmström", number: 10, pos: "LW", age: 23, nationality: "SE", contract: { years: 2, salary: 1000 }, attrs: { offensiveRead: 66, speed: 70 } },
  { name: "Pierre Engvall", number: 18, pos: "RW", age: 29, nationality: "SE", contract: { years: 3, salary: 3000 }, attrs: { speed: 74, checking: 62, strength: 74 } },
  { name: "Casey Cizikas", number: 53, pos: "C", age: 34, nationality: "CA", contract: { years: 2, salary: 2500 }, attrs: { checking: 78, faceoffs: 68, hitting: 68, defensiveRead: 70 } },
  { name: "Jean-Gabriel Pageau", number: 44, pos: "C", age: 33, nationality: "CA", contract: { years: 1, salary: 3250 }, attrs: { faceoffs: 78, defensiveRead: 74, checking: 68 } },
  { name: "Ryan Pulock", number: 6, pos: "LD", age: 31, nationality: "CA", contract: { years: 3, salary: 6150 }, attrs: { shotAccuracy: 72, positioning: 74, hitting: 70, strength: 78 } },
  { name: "Adam Pelech", number: 3, pos: "RD", age: 30, nationality: "CA", contract: { years: 4, salary: 5000 }, attrs: { positioning: 80, defensiveRead: 78, shotBlocking: 78, strength: 76 } },
  { name: "Alexander Romanov", number: 28, pos: "LD", age: 25, nationality: "RU", contract: { years: 6, salary: 4166 }, attrs: { hitting: 78, checking: 74, strength: 80, aggressiveness: 72 } },
  { name: "Scott Mayfield", number: 24, pos: "RD", age: 33, nationality: "US", contract: { years: 2, salary: 3500 }, attrs: { hitting: 72, positioning: 68, strength: 76 } },
  { name: "Dennis Cholowski", number: 21, pos: "LD", age: 27, nationality: "CA", contract: { years: 1, salary: 900 }, attrs: { puckhandling: 65, offensiveRead: 62 } },
  { name: "Ilya Sorokin", number: 30, pos: "G", age: 30, nationality: "RU", contract: { years: 6, salary: 8250 }, attrs: { reflexes: 88, positioning: 87, reboundControl: 82, recovery: 82, professionalism: 82 } },
  { name: "Semyon Varlamov", number: 40, pos: "G", age: 37, nationality: "RU", contract: { years: 1, salary: 1500 }, attrs: { reflexes: 74, positioning: 76, reboundControl: 70 } },
];
const NJD_ROSTER_DATA = [
  { name: "Jack Hughes", number: 86, pos: "C", age: 24, nationality: "US", contract: { years: 8, salary: 8000 }, attrs: { speed: 90, offensiveRead: 88, shotAccuracy: 85, acceleration: 90, puckhandling: 84 } },
  { name: "Nico Hischier", number: 13, pos: "C", age: 26, nationality: "CH", contract: { years: 8, salary: 8450 }, attrs: { offensiveRead: 84, faceoffs: 78, defensiveRead: 78, leadership: 82, shotAccuracy: 76 } },
  { name: "Jesper Bratt", number: 63, pos: "LW", age: 27, nationality: "SE", contract: { years: 8, salary: 5500 }, attrs: { passing: 82, offensiveRead: 82, puckhandling: 78, speed: 78 } },
  { name: "Timo Meier", number: 28, pos: "RW", age: 29, nationality: "CH", contract: { years: 8, salary: 8800 }, attrs: { strength: 82, shotAccuracy: 80, hitting: 68, checking: 62 } },
  { name: "Dawson Mercer", number: 91, pos: "LW", age: 24, nationality: "CA", contract: { years: 3, salary: 4600 }, attrs: { offensiveRead: 72, speed: 76, shotAccuracy: 72 } },
  { name: "Ondrej Palat", number: 18, pos: "RW", age: 34, nationality: "CZ", contract: { years: 1, salary: 3350 }, attrs: { offensiveRead: 70, checking: 62, shotAccuracy: 68 } },
  { name: "Erik Haula", number: 56, pos: "C", age: 34, nationality: "FI", contract: { years: 1, salary: 1500 }, attrs: { speed: 74, faceoffs: 65, checking: 62 } },
  { name: "Stefan Noesen", number: 23, pos: "LW", age: 32, nationality: "US", contract: { years: 3, salary: 2750 }, attrs: { hitting: 74, checking: 70, strength: 76 } },
  { name: "Luke Hughes", number: 43, pos: "LD", age: 22, nationality: "US", contract: { years: 8, salary: 7100 }, attrs: { passing: 82, offensiveRead: 80, puckhandling: 78, speed: 80 } },
  { name: "Dougie Hamilton", number: 7, pos: "RD", age: 32, nationality: "CA", contract: { years: 4, salary: 9000 }, attrs: { shotAccuracy: 78, passing: 78, offensiveRead: 76, strength: 76, puckhandling: 74 } },
  { name: "Jonas Siegenthaler", number: 71, pos: "LD", age: 28, nationality: "CH", contract: { years: 4, salary: 3400 }, attrs: { positioning: 78, defensiveRead: 76, hitting: 70, strength: 78 } },
  { name: "Brett Pesce", number: 3, pos: "RD", age: 30, nationality: "US", contract: { years: 6, salary: 6000 }, attrs: { positioning: 80, defensiveRead: 78, shotBlocking: 76, strength: 76 } },
  { name: "Simon Nemec", number: 24, pos: "LD", age: 21, nationality: "SK", contract: { years: 2, salary: 950 }, attrs: { puckhandling: 74, offensiveRead: 72, speed: 74 } },
  { name: "Jacob Markström", number: 25, pos: "G", age: 35, nationality: "SE", contract: { years: 4, salary: 6000 }, attrs: { reflexes: 82, positioning: 84, reboundControl: 78, professionalism: 82 } },
  { name: "Jake Allen", number: 34, pos: "G", age: 35, nationality: "CA", contract: { years: 2, salary: 1800 }, attrs: { reflexes: 74, positioning: 76, reboundControl: 70 } },
];
const PHI_ROSTER_DATA = [
  { name: "Matvei Michkov", number: 39, pos: "LW", age: 20, nationality: "RU", contract: { years: 3, salary: 950 }, attrs: { shotAccuracy: 85, offensiveRead: 82, puckhandling: 82, gettingOpen: 80 } },
  { name: "Travis Konecny", number: 11, pos: "RW", age: 28, nationality: "CA", contract: { years: 8, salary: 8250 }, attrs: { shotAccuracy: 82, offensiveRead: 78, aggressiveness: 74, speed: 76 } },
  { name: "Sean Couturier", number: 14, pos: "C", age: 32, nationality: "CA", contract: { years: 4, salary: 4533 }, attrs: { defensiveRead: 82, faceoffs: 78, checking: 72, offensiveRead: 70 } },
  { name: "Owen Tippett", number: 74, pos: "LW", age: 26, nationality: "CA", contract: { years: 6, salary: 5300 }, attrs: { shotAccuracy: 78, speed: 76, strength: 74 } },
  { name: "Tyson Foerster", number: 71, pos: "RW", age: 23, nationality: "CA", contract: { years: 6, salary: 3900 }, attrs: { shotAccuracy: 76, offensiveRead: 70, strength: 72 } },
  { name: "Bobby Brink", number: 10, pos: "LW", age: 23, nationality: "US", contract: { years: 2, salary: 1400 }, attrs: { offensiveRead: 68, puckhandling: 68, speed: 70 } },
  { name: "Noah Cates", number: 27, pos: "C", age: 26, nationality: "US", contract: { years: 3, salary: 3200 }, attrs: { defensiveRead: 72, checking: 66, faceoffs: 62 } },
  { name: "Trevor Zegras", number: 11, pos: "C", age: 24, nationality: "US", contract: { years: 1, salary: 5750 }, attrs: { puckhandling: 80, offensiveRead: 76, shotAccuracy: 72, passing: 74 } },
  { name: "Travis Sanheim", number: 6, pos: "LD", age: 29, nationality: "CA", contract: { years: 8, salary: 6250 }, attrs: { positioning: 78, puckhandling: 74, offensiveRead: 72, speed: 76 } },
  { name: "Cam York", number: 8, pos: "RD", age: 24, nationality: "US", contract: { years: 6, salary: 4225 }, attrs: { puckhandling: 74, offensiveRead: 72, speed: 76, positioning: 66 } },
  { name: "Jamie Drysdale", number: 5, pos: "LD", age: 23, nationality: "CA", contract: { years: 3, salary: 2900 }, attrs: { puckhandling: 76, offensiveRead: 72, speed: 76 } },
  { name: "Rasmus Ristolainen", number: 55, pos: "RD", age: 30, nationality: "FI", contract: { years: 5, salary: 5100 }, attrs: { hitting: 76, checking: 72, strength: 80, positioning: 64 } },
  { name: "Nick Seeler", number: 24, pos: "LD", age: 32, nationality: "US", contract: { years: 3, salary: 2100 }, attrs: { hitting: 74, checking: 70, positioning: 65 } },
  { name: "Egor Zamula", number: 27, pos: "RD", age: 24, nationality: "RU", contract: { years: 2, salary: 900 }, attrs: { positioning: 62, puckhandling: 64 } },
  { name: "Samuel Ersson", number: 33, pos: "G", age: 26, nationality: "SE", contract: { years: 3, salary: 3600 }, attrs: { reflexes: 78, positioning: 78, reboundControl: 74 } },
  { name: "Ivan Fedotov", number: 82, pos: "G", age: 29, nationality: "RU", contract: { years: 2, salary: 2400 }, attrs: { reflexes: 74, positioning: 76, reboundControl: 70 } },
];
const PIT_ROSTER_DATA = [
  { name: "Sidney Crosby", number: 87, pos: "C", age: 38, nationality: "CA", contract: { years: 2, salary: 8700 }, attrs: { offensiveRead: 90, faceoffs: 82, passing: 84, leadership: 92, shotAccuracy: 80, professionalism: 90 } },
  { name: "Evgeni Malkin", number: 71, pos: "C", age: 39, nationality: "RU", contract: { years: 2, salary: 6100 }, attrs: { offensiveRead: 82, shotAccuracy: 78, passing: 78, speed: 62, strength: 76 } },
  { name: "Rickard Rakell", number: 67, pos: "LW", age: 32, nationality: "SE", contract: { years: 3, salary: 5000 }, attrs: { shotAccuracy: 78, offensiveRead: 72, speed: 72 } },
  { name: "Bryan Rust", number: 17, pos: "RW", age: 33, nationality: "US", contract: { years: 4, salary: 5125 }, attrs: { speed: 78, shotAccuracy: 74, offensiveRead: 70 } },
  { name: "Rutger McGroarty", number: 91, pos: "LW", age: 21, nationality: "US", contract: { years: 3, salary: 950 }, attrs: { strength: 74, shotAccuracy: 68, offensiveRead: 64 } },
  { name: "Justin Brazeau", number: 55, pos: "RW", age: 27, nationality: "CA", contract: { years: 2, salary: 1600 }, attrs: { strength: 78, hitting: 68, shotAccuracy: 66 } },
  { name: "Noel Acciari", number: 55, pos: "C", age: 33, nationality: "US", contract: { years: 3, salary: 2000 }, attrs: { checking: 72, hitting: 68, faceoffs: 64 } },
  { name: "Blake Lizotte", number: 46, pos: "C", age: 27, nationality: "US", contract: { years: 3, salary: 2750 }, attrs: { speed: 76, checking: 68, faceoffs: 62 } },
  { name: "Erik Karlsson", number: 65, pos: "LD", age: 35, nationality: "SE", contract: { years: 2, salary: 10000 }, attrs: { passing: 86, offensiveRead: 85, puckhandling: 80, speed: 76, shotAccuracy: 72 } },
  { name: "Kris Letang", number: 58, pos: "RD", age: 38, nationality: "CA", contract: { years: 2, salary: 6100 }, attrs: { passing: 78, offensiveRead: 76, speed: 74, puckhandling: 74, leadership: 76 } },
  { name: "Ryan Graves", number: 27, pos: "LD", age: 29, nationality: "CA", contract: { years: 4, salary: 4500 }, attrs: { hitting: 74, checking: 70, strength: 78, positioning: 64 } },
  { name: "Owen Pickering", number: 78, pos: "RD", age: 21, nationality: "CA", contract: { years: 2, salary: 900 }, attrs: { speed: 74, puckhandling: 62, positioning: 58 } },
  { name: "Ian Moore", number: 24, pos: "LD", age: 23, nationality: "US", contract: { years: 2, salary: 850 }, attrs: { positioning: 60, puckhandling: 60 } },
  { name: "Tristan Jarry", number: 35, pos: "G", age: 30, nationality: "CA", contract: { years: 2, salary: 5375 }, attrs: { reflexes: 78, positioning: 78, reboundControl: 72 } },
  { name: "Alex Nedeljkovic", number: 39, pos: "G", age: 29, nationality: "US", contract: { years: 2, salary: 1750 }, attrs: { reflexes: 72, positioning: 72, reboundControl: 68 } },
];
const WSH_ROSTER_DATA = [
  { name: "Alex Ovechkin", number: 8, pos: "LW", age: 40, nationality: "RU", contract: { years: 1, salary: 9000 }, attrs: { shotAccuracy: 90, shotRange: 88, strength: 78, leadership: 80, speed: 62 } },
  { name: "Dylan Strome", number: 17, pos: "C", age: 28, nationality: "CA", contract: { years: 7, salary: 5166 }, attrs: { passing: 82, offensiveRead: 80, shotAccuracy: 74, faceoffs: 68 } },
  { name: "Tom Wilson", number: 43, pos: "RW", age: 31, nationality: "CA", contract: { years: 5, salary: 6500 }, attrs: { hitting: 85, checking: 78, strength: 84, aggressiveness: 80, fighting: 75, shotAccuracy: 68 } },
  { name: "Aliaksei Protas", number: 21, pos: "LW", age: 24, nationality: "BY", contract: { years: 8, salary: 4550 }, attrs: { strength: 78, shotAccuracy: 74, offensiveRead: 70, speed: 72 } },
  { name: "Connor McMichael", number: 24, pos: "C", age: 24, nationality: "CA", contract: { years: 2, salary: 2150 }, attrs: { shotAccuracy: 74, speed: 76, offensiveRead: 68 } },
  { name: "Pierre-Luc Dubois", number: 80, pos: "C", age: 27, nationality: "CA", contract: { years: 6, salary: 6000 }, attrs: { strength: 80, faceoffs: 72, checking: 68, shotAccuracy: 70 } },
  { name: "Andrew Mangiapane", number: 88, pos: "RW", age: 29, nationality: "CA", contract: { years: 3, salary: 3750 }, attrs: { speed: 76, shotAccuracy: 74, checking: 62 } },
  { name: "Anthony Beauvillier", number: 72, pos: "LW", age: 28, nationality: "CA", contract: { years: 1, salary: 1200 }, attrs: { speed: 76, shotAccuracy: 68 } },
  { name: "Nic Dowd", number: 26, pos: "C", age: 35, nationality: "US", contract: { years: 2, salary: 1600 }, attrs: { faceoffs: 74, checking: 68, defensiveRead: 70 } },
  { name: "John Carlson", number: 74, pos: "LD", age: 35, nationality: "US", contract: { years: 5, salary: 8000 }, attrs: { passing: 82, offensiveRead: 80, shotAccuracy: 76, puckhandling: 74, leadership: 78 } },
  { name: "Jakob Chychrun", number: 6, pos: "RD", age: 27, nationality: "CA", contract: { years: 5, salary: 4600 }, attrs: { shotAccuracy: 78, hitting: 72, strength: 78, puckhandling: 70 } },
  { name: "Rasmus Sandin", number: 38, pos: "LD", age: 25, nationality: "SE", contract: { years: 4, salary: 4000 }, attrs: { puckhandling: 74, offensiveRead: 72, passing: 72, speed: 74 } },
  { name: "Matt Roy", number: 3, pos: "RD", age: 30, nationality: "CA", contract: { years: 6, salary: 4166 }, attrs: { positioning: 78, defensiveRead: 76, shotBlocking: 76, hitting: 68 } },
  { name: "Trevor van Riemsdyk", number: 57, pos: "LD", age: 32, nationality: "US", contract: { years: 3, salary: 3625 }, attrs: { positioning: 70, defensiveRead: 68, hitting: 62 } },
  { name: "Logan Thompson", number: 48, pos: "G", age: 28, nationality: "CA", contract: { years: 5, salary: 3500 }, attrs: { reflexes: 82, positioning: 80, reboundControl: 76 } },
  { name: "Charlie Lindgren", number: 79, pos: "G", age: 31, nationality: "US", contract: { years: 3, salary: 3000 }, attrs: { reflexes: 74, positioning: 76, reboundControl: 70 } },
];
const CBJ_ROSTER_DATA = [
  { name: "Adam Fantilli", number: 19, pos: "C", age: 21, nationality: "CA", contract: { years: 3, salary: 950 }, attrs: { shotAccuracy: 78, offensiveRead: 76, speed: 80, strength: 74 } },
  { name: "Kirill Marchenko", number: 86, pos: "LW", age: 24, nationality: "RU", contract: { years: 8, salary: 6250 }, attrs: { shotAccuracy: 80, offensiveRead: 76, speed: 76, puckhandling: 74 } },
  { name: "Boone Jenner", number: 38, pos: "C", age: 32, nationality: "CA", contract: { years: 4, salary: 5000 }, attrs: { hitting: 76, checking: 74, faceoffs: 70, leadership: 78, shotAccuracy: 68 } },
  { name: "Dmitri Voronkov", number: 10, pos: "RW", age: 25, nationality: "RU", contract: { years: 2, salary: 1000 }, attrs: { strength: 82, hitting: 70, shotAccuracy: 72 } },
  { name: "Yegor Chinakhov", number: 59, pos: "LW", age: 24, nationality: "RU", contract: { years: 2, salary: 2100 }, attrs: { shotAccuracy: 76, speed: 74, offensiveRead: 68 } },
  { name: "Cole Sillinger", number: 4, pos: "C", age: 22, nationality: "CA", contract: { years: 3, salary: 2850 }, attrs: { shotAccuracy: 72, faceoffs: 66, checking: 62 } },
  { name: "Sean Monahan", number: 23, pos: "C", age: 31, nationality: "CA", contract: { years: 5, salary: 5625 }, attrs: { faceoffs: 76, offensiveRead: 74, shotAccuracy: 72, passing: 72 } },
  { name: "Mathieu Olivier", number: 24, pos: "RW", age: 27, nationality: "CA", contract: { years: 4, salary: 2000 }, attrs: { hitting: 82, checking: 76, strength: 82, fighting: 72 } },
  { name: "Zach Werenski", number: 8, pos: "LD", age: 28, nationality: "US", contract: { years: 8, salary: 9583 }, attrs: { shotAccuracy: 80, passing: 82, offensiveRead: 80, puckhandling: 78, speed: 76, leadership: 74 } },
  { name: "Ivan Provorov", number: 9, pos: "RD", age: 28, nationality: "RU", contract: { years: 7, salary: 8500 }, attrs: { positioning: 78, hitting: 74, shotBlocking: 76, strength: 78, puckhandling: 68 } },
  { name: "Damon Severson", number: 78, pos: "LD", age: 31, nationality: "CA", contract: { years: 6, salary: 6250 }, attrs: { puckhandling: 74, offensiveRead: 72, positioning: 70, speed: 74 } },
  { name: "David Jiricek", number: 91, pos: "RD", age: 21, nationality: "CZ", contract: { years: 2, salary: 950 }, attrs: { shotAccuracy: 70, strength: 76, positioning: 62 } },
  { name: "Erik Gudbranson", number: 44, pos: "LD", age: 33, nationality: "CA", contract: { years: 2, salary: 2100 }, attrs: { hitting: 78, checking: 72, strength: 82, positioning: 60 } },
  { name: "Elvis Merzlikins", number: 90, pos: "G", age: 31, nationality: "CH", contract: { years: 3, salary: 5400 }, attrs: { reflexes: 78, positioning: 78, reboundControl: 74 } },
  { name: "Jet Greaves", number: 73, pos: "G", age: 24, nationality: "CA", contract: { years: 2, salary: 850 }, attrs: { reflexes: 72, positioning: 70, reboundControl: 66 } },
];


function buildNamedRoster(data, teamIndex, rng) {
  return data.map((d, i) => {
    const teamBase = 68 - teamIndex * 1.3;
    const allAttrs = d.pos === "G" ? [...GOALIE_TECH, ...MENTAL, ...GOALIE_PHYSICAL] : [...OFFENSIVE, ...DEFENSIVE, ...MENTAL, ...PHYSICAL];
    const attrs = {};
    allAttrs.forEach((a) => (attrs[a] = randAttr(rng, teamBase)));
    const age = Math.round(16 + rng() * 2);
    const ovr = computeOvr(d.pos, attrs);
    const potential = Math.min(99, ovr + potentialCeiling(age, rng));
    return { id: `${teamIndex}-${i}`, name: d.name, number: d.number, pos: d.pos, age, attrs, ovr, potential, contract: randomContract(rng) };
  }).sort((a, b) => b.ovr - a.ovr);
}

const NATION_FLAG = { CA: "🇨🇦", US: "🇺🇸", SE: "🇸🇪", FI: "🇫🇮", RU: "🇷🇺", CZ: "🇨🇿", SK: "🇸🇰", CH: "🇨🇭", DE: "🇩🇪", AT: "🇦🇹", DK: "🇩🇰", BY: "🇧🇾" };
const NATION_NAME = { CA: "Canada", US: "États-Unis", SE: "Suède", FI: "Finlande", RU: "Russie", CZ: "Tchéquie", SK: "Slovaquie", CH: "Suisse", DE: "Allemagne", AT: "Autriche", DK: "Danemark", BY: "Bélarus" };
const NATIONALITY_POOL = [{ code: "CA", weight: 50 }, { code: "US", weight: 25 }, { code: "SE", weight: 8 }, { code: "FI", weight: 6 }, { code: "RU", weight: 5 }, { code: "CZ", weight: 4 }, { code: "SK", weight: 3 }, { code: "CH", weight: 2 }, { code: "DE", weight: 2 }];
function pickNationality(rng) {
  const total = NATIONALITY_POOL.reduce((a, n) => a + n.weight, 0);
  let r = rng() * total;
  for (const n of NATIONALITY_POOL) { r -= n.weight; if (r <= 0) return n.code; }
  return "CA";
}
function buildRoster(teamIndex, rng) {
  return ROSTER_POSITIONS.map((pos, i) => {
    const fn = FIRST_NAMES[Math.floor(rng() * FIRST_NAMES.length)];
    const ln = LAST_NAMES[Math.floor(rng() * LAST_NAMES.length)];
    const teamBase = 68 - teamIndex * 1.3;
    const allAttrs = pos === "G" ? [...GOALIE_TECH, ...MENTAL, ...GOALIE_PHYSICAL] : [...OFFENSIVE, ...DEFENSIVE, ...MENTAL, ...PHYSICAL];
    const attrs = {};
    allAttrs.forEach((a) => (attrs[a] = randAttr(rng, teamBase)));
    const age = Math.round(17 + rng() * 20);
    const ovr = computeOvr(pos, attrs);
    const potential = Math.min(99, ovr + potentialCeiling(age, rng));
    return { id: `${teamIndex}-${i}`, name: `${fn} ${ln}`, pos, age, attrs, ovr, potential, contract: randomContract(rng), nationality: pickNationality(rng) };
  }).sort((a, b) => b.ovr - a.ovr);
}
function buildFreeAgentPool(rng, count = 16) {
  const positions = ["C", "LW", "RW", "LD", "RD", "G"];
  const list = [];
  for (let i = 0; i < count; i++) {
    const pos = positions[i % positions.length];
    const fn = FIRST_NAMES[Math.floor(rng() * FIRST_NAMES.length)];
    const ln = LAST_NAMES[Math.floor(rng() * LAST_NAMES.length)];
    const teamBase = 58 + rng() * 12;
    const allAttrs = pos === "G" ? [...GOALIE_TECH, ...MENTAL, ...GOALIE_PHYSICAL] : [...OFFENSIVE, ...DEFENSIVE, ...MENTAL, ...PHYSICAL];
    const attrs = {};
    allAttrs.forEach((a) => (attrs[a] = randAttr(rng, teamBase)));
    const age = Math.round(19 + rng() * 14);
    const ovr = computeOvr(pos, attrs);
    const potential = Math.min(99, ovr + potentialCeiling(age, rng));
    list.push({ id: `FA-${i}`, name: `${fn} ${ln}`, pos, age, attrs, ovr, potential, contract: null, nationality: pickNationality(rng) });
  }
  return list;
}
function buildFarmRoster(teamIndex, rng, count = 10) {
  const positions = ["C", "C", "LW", "RW", "LW", "LD", "RD", "LD", "G", "G"];
  const list = [];
  for (let i = 0; i < count; i++) {
    const pos = positions[i % positions.length];
    const fn = FIRST_NAMES[Math.floor(rng() * FIRST_NAMES.length)];
    const ln = LAST_NAMES[Math.floor(rng() * LAST_NAMES.length)];
    const teamBase = 48 + rng() * 12;
    const allAttrs = pos === "G" ? [...GOALIE_TECH, ...MENTAL, ...GOALIE_PHYSICAL] : [...OFFENSIVE, ...DEFENSIVE, ...MENTAL, ...PHYSICAL];
    const attrs = {};
    allAttrs.forEach((a) => (attrs[a] = randAttr(rng, teamBase)));
    const age = Math.round(18 + rng() * 3);
    const ovr = computeOvr(pos, attrs);
    const potential = Math.min(99, ovr + potentialCeiling(age, rng) + Math.round(rng() * 6));
    list.push({ id: `FARM-${teamIndex}-${i}`, name: `${fn} ${ln}`, pos, age, attrs, ovr, potential, contract: randomContract(rng), nationality: pickNationality(rng), level: "LAH" });
  }
  return list;
}
function assignDraftInfo(players, rng) {
  const ranked = [...players].map((p) => ({ p, key: p.ovr + rng() * 18 })).sort((a, b) => b.key - a.key);
  const draftableCount = Math.round(players.length * 0.78);
  ranked.forEach(({ p }, i) => {
    if (i < draftableCount) { p.draftPick = i + 1; p.draftYear = Math.max(2016, Math.min(CURRENT_YEAR, CURRENT_YEAR - Math.max(0, p.age - 18))); }
    else { p.draftPick = null; p.draftYear = null; }
  });
}

function buildLines(roster) {
  const C = roster.filter((p) => p.pos === "C").sort((a, b) => b.ovr - a.ovr);
  const LW = roster.filter((p) => p.pos === "LW").sort((a, b) => b.ovr - a.ovr);
  const RW = roster.filter((p) => p.pos === "RW").sort((a, b) => b.ovr - a.ovr);
  const LD = roster.filter((p) => p.pos === "LD").sort((a, b) => b.ovr - a.ovr);
  const RD = roster.filter((p) => p.pos === "RD").sort((a, b) => b.ovr - a.ovr);
  const G = roster.filter((p) => p.pos === "G").sort((a, b) => b.ovr - a.ovr);
  const skaters = roster.filter((p) => p.pos !== "G");
  const forwards = [0, 1, 2, 3].map((i) => ({ LW: LW[i]?.id, C: C[i]?.id, RW: RW[i]?.id }));
  const defense = [0, 1, 2].map((i) => ({ LD: LD[i]?.id, RD: RD[i]?.id }));
  const goalies = { starter: G[0]?.id, backup: G[1]?.id };
  const pp = [...skaters].sort((a, b) => avg(b.attrs, OFFENSIVE) - avg(a.attrs, OFFENSIVE)).slice(0, 5).map((p) => p.id);
  const pk = [...skaters].sort((a, b) => avg(b.attrs, DEFENSIVE) - avg(a.attrs, DEFENSIVE)).slice(0, 4).map((p) => p.id);
  return { forwards, defense, goalies, pp, pk, strategy: { ...DEFAULT_STRATEGY }, mentality: { ...DEFAULT_MENTALITY } };
}

const STAFF_ROLES = { hockeyOpsDirector: "Directeur des opérations hockey", financeDirector: "Directeur des finances", headCoach: "Entraîneur-chef", assistantOff: "Adjoint offensif", assistantDef: "Adjoint défensif", scoutAmateur: "Dépisteur amateur", scoutPro: "Dépisteur professionnel" };
const STAFF_BASE_SALARY = { hockeyOpsDirector: 2200, financeDirector: 1800, headCoach: 1800, assistantOff: 900, assistantDef: 900, scoutAmateur: 700, scoutPro: 900 };
function buildStaffMarket(rng, count = 12) {
  const roles = Object.keys(STAFF_ROLES);
  const coachRoles = ["headCoach", "assistantOff", "assistantDef"];
  const list = [];
  for (let i = 0; i < count; i++) {
    const role = roles[i % roles.length];
    const rating = Math.round(40 + rng() * 55);
    const fn = FIRST_NAMES[Math.floor(rng() * FIRST_NAMES.length)];
    const ln = LAST_NAMES[Math.floor(rng() * LAST_NAMES.length)];
    const salary = Math.round(STAFF_BASE_SALARY[role] * Math.pow(rating / 70, 1.6) * (0.85 + rng() * 0.3));
    const devSkill = coachRoles.includes(role) ? Math.round(35 + rng() * 60) : undefined;
    list.push({ id: `STAFF-${i}`, name: `${fn} ${ln}`, role, rating, salary, devSkill });
  }
  return list;
}
function buildStaffMarketRT(count = 6) {
  const rng = Math.random;
  const roles = Object.keys(STAFF_ROLES);
  const coachRoles = ["headCoach", "assistantOff", "assistantDef"];
  const list = [];
  for (let i = 0; i < count; i++) {
    const role = roles[i % roles.length];
    const rating = Math.round(40 + rng() * 55);
    const fn = FIRST_NAMES[Math.floor(rng() * FIRST_NAMES.length)];
    const ln = LAST_NAMES[Math.floor(rng() * LAST_NAMES.length)];
    const salary = Math.round(STAFF_BASE_SALARY[role] * Math.pow(rating / 70, 1.6) * (0.85 + rng() * 0.3));
    const devSkill = coachRoles.includes(role) ? Math.round(35 + rng() * 60) : undefined;
    list.push({ id: `STAFF-${Date.now()}-${i}`, name: `${fn} ${ln}`, role, rating, salary, devSkill });
  }
  return list;
}
function buildFreeAgentPoolRT(count = 16, scoutRating = 50) {
  const rng = Math.random;
  const scoutBonus = ((scoutRating || 50) - 50) / 50 * 8;
  const positions = ["C", "LW", "RW", "LD", "RD", "G"];
  const list = [];
  for (let i = 0; i < count; i++) {
    const pos = positions[i % positions.length];
    const fn = FIRST_NAMES[Math.floor(rng() * FIRST_NAMES.length)];
    const ln = LAST_NAMES[Math.floor(rng() * LAST_NAMES.length)];
    const teamBase = 58 + rng() * 12 + scoutBonus;
    const allAttrs = pos === "G" ? [...GOALIE_TECH, ...MENTAL, ...GOALIE_PHYSICAL] : [...OFFENSIVE, ...DEFENSIVE, ...MENTAL, ...PHYSICAL];
    const attrs = {};
    allAttrs.forEach((a) => (attrs[a] = randAttr(rng, teamBase)));
    const age = Math.round(19 + rng() * 14);
    const ovr = computeOvr(pos, attrs);
    const potential = Math.min(99, ovr + potentialCeiling(age, rng));
    list.push({ id: `FA-${Date.now()}-${i}`, name: `${fn} ${ln}`, pos, age, attrs, ovr, potential, contract: null, draftPick: null, draftYear: null, nationality: pickNationality(rng) });
  }
  return list;
}
function initLeague() {
  const rng = seededRandom(42);
  const REAL_ROSTERS = { MTL: MTL_ROSTER_DATA, TOR: TOR_ROSTER_DATA, BOS: BOS_ROSTER_DATA, BUF: BUF_ROSTER_DATA, DET: DET_ROSTER_DATA, FLA: FLA_ROSTER_DATA, OTT: OTT_ROSTER_DATA, TBL: TBL_ROSTER_DATA, CAR: CAR_ROSTER_DATA, NYR: NYR_ROSTER_DATA, NYI: NYI_ROSTER_DATA, NJD: NJD_ROSTER_DATA, PHI: PHI_ROSTER_DATA, PIT: PIT_ROSTER_DATA, WSH: WSH_ROSTER_DATA, CBJ: CBJ_ROSTER_DATA };
  const teams = TEAM_SEED.map((t, idx) => {
    const realData = REAL_ROSTERS[t.id];
    const roster = realData ? buildRealRoster(realData, idx, rng) : buildRoster(idx, rng);
    return { ...t, roster, lines: buildLines(roster) };
  });
  const farmByTeam = {};
  teams.forEach((t, idx) => { farmByTeam[t.id] = buildFarmRoster(idx, rng, 10); });
  const freeAgents = buildFreeAgentPool(rng, 16);
  const allPlayers = [...teams.flatMap((t) => t.roster), ...Object.values(farmByTeam).flat(), ...freeAgents];
  assignDraftInfo(allPlayers, rng);
  const staffMarket = buildStaffMarket(rng, 12);
  return { teams, freeAgents, staffMarket, farmByTeam };
}

function lineInfo(playerId, lines) {
  for (let i = 0; i < lines.forwards.length; i++) { const l = lines.forwards[i]; if (l.LW === playerId || l.C === playerId || l.RW === playerId) return { type: "F", idx: i, bonus: FORWARD_BONUS[i] }; }
  for (let i = 0; i < lines.defense.length; i++) { const l = lines.defense[i]; if (l.LD === playerId || l.RD === playerId) return { type: "D", idx: i, bonus: DEFENSE_BONUS[i] }; }
  if (lines.goalies.starter === playerId) return { type: "G", idx: 0, bonus: 1 };
  if (lines.goalies.backup === playerId) return { type: "G", idx: 1, bonus: 0.25 };
  return { type: "?", idx: -1, bonus: 0.7 };
}
function lineLabel(playerId, lines) {
  const info = lineInfo(playerId, lines);
  let label = info.type === "F" ? `Trio ${info.idx + 1}` : info.type === "D" ? `Paire ${info.idx + 1}` : info.type === "G" ? (info.idx === 0 ? "Partant" : "Réserviste") : "—";
  const tags = [];
  if (lines.pp && lines.pp.includes(playerId)) tags.push("AN1");
  if (lines.pk && lines.pk.includes(playerId)) tags.push("DN1");
  return tags.length ? `${label} · ${tags.join("/")}` : label;
}

function weightedAvg(players, valueFn, weightFn) {
  let wsum = 0, vsum = 0;
  players.forEach((p) => { const w = weightFn(p); wsum += w; vsum += valueFn(p) * w; });
  return wsum > 0 ? vsum / wsum : 60;
}
function teamStrength(team, lines, staff) {
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

// ---------- SCHEDULE ----------
function buildSchedule(teams) {
  const ids = teams.map((t) => t.id);
  const games = [];
  let round = 0;
  for (let leg = 0; leg < 2; leg++) {
    const arr = [...ids];
    const n = arr.length;
    for (let r = 0; r < n - 1; r++) {
      round++;
      for (let i = 0; i < n / 2; i++) {
        const home = arr[i], away = arr[n - 1 - i];
        const [h, a] = leg === 0 ? [home, away] : [away, home];
        games.push({ id: `${round}-${i}`, round, home: h, away: a, played: false, homeScore: null, awayScore: null, box: null });
      }
      arr.splice(1, 0, arr.pop());
    }
  }
  return games;
}

// ---------- SIMULATION ----------
function goalieLine(goalie, goalsAgainst, rng, scale = 1) {
  const lambda = (16 + ((goalie?.attrs.reflexes || 70) / 99) * 16) * scale;
  const saves = poisson(Math.max(0.3, lambda), rng);
  return { playerId: goalie?.id, saves, shotsAgainst: saves + goalsAgainst };
}

function unitRating(ids, roster, keys) {
  const players = (ids || []).map((id) => roster.find((p) => p.id === id)).filter(Boolean);
  if (players.length === 0) return 60;
  return players.reduce((a, p) => a + avg(p.attrs, keys), 0) / players.length;
}
function penaltyPropensity(p) { return (p.attrs.aggressiveness + p.attrs.hitting + (100 - p.attrs.temperament)) / 3; }
function teamPenaltyLambda(team, penMult) {
  const skaters = team.roster.filter((p) => p.pos !== "G");
  const avgProp = skaters.reduce((a, p) => a + penaltyPropensity(p), 0) / skaters.length;
  return Math.max(1, Math.min(8, 3.0 * penMult * (avgProp / 60)));
}
function assignPenalties(team, count, rng) {
  const skaters = team.roster.filter((p) => p.pos !== "G");
  const weights = skaters.map((p) => Math.pow(penaltyPropensity(p), 1.5));
  const pimBy = {};
  for (let i = 0; i < count; i++) { const p = weightedPick(skaters, weights, rng); pimBy[p.id] = (pimBy[p.id] || 0) + 2; }
  return pimBy;
}
const CHUNK_MIN = 5;
const CHUNKS_PER_PERIOD = 4;
const TOTAL_CHUNKS = 12;
function simulateChunk(home, away, linesHome, linesAway, staffByTeam, chunkIndex, rng) {
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
function emptyLiveAccum() {
  return {
    home: { goalsBy: {}, assistsBy: {}, hitsBy: {}, shotsBy: {}, pimBy: {}, blocksBy: {}, plusMinusBy: {}, faceoffsWonBy: {}, toiBy: {}, ppGoals: 0, penalties: 0, shots: 0, corsiFor: 0, faceoffsWon: 0, faceoffsTotal: 0, saves: 0, shotsAgainst: 0 },
    away: { goalsBy: {}, assistsBy: {}, hitsBy: {}, shotsBy: {}, pimBy: {}, blocksBy: {}, plusMinusBy: {}, faceoffsWonBy: {}, toiBy: {}, ppGoals: 0, penalties: 0, shots: 0, corsiFor: 0, faceoffsWon: 0, faceoffsTotal: 0, saves: 0, shotsAgainst: 0 },
    goalLog: [],
  };
}
function mergeLivePeriod(accum, periodResult) {
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
function generatePPGoals(team, ppGoalsCount, rng, ppUnitIds) {
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
function mergeCount(target, source) { Object.entries(source).forEach(([k, v]) => { target[k] = (target[k] || 0) + v; }); }

function skillPower(val, exp = 2.2) { return Math.pow(Math.max(1, val) / 99, exp) * 100; }
function offenseSkillScore(p) { return p.attrs.shotAccuracy * 0.30 + p.attrs.shotRange * 0.15 + p.attrs.puckhandling * 0.20 + p.attrs.offensiveRead * 0.20 + p.attrs.gettingOpen * 0.15; }
function playmakingScore(p) { return p.attrs.passing * 0.6 + p.attrs.offensiveRead * 0.4; }

function generateBoxscore(team, goals, shots, rng, lines, strategy, hitScale = 1) {
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
function simulateFaceoffs(home, away, rng, scale = 1) {
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
function simulateBlocksAndCorsi(homeShots, awayShots, home, away, rng) {
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
function pickOnIceLine(lines, rng) {
  const idx = weightedPick([0, 1, 2, 3], FORWARD_BONUS, rng);
  const l = lines.forwards[idx] || {};
  return [l.LW, l.C, l.RW].filter(Boolean);
}
const FORWARD_TOI_BASE = [19, 16, 13, 10];
const DEFENSE_TOI_BASE = [22, 18, 14];
function formatTOI(min) {
  if (min == null) return "—";
  const m = Math.floor(min);
  const s = Math.round((min - m) * 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}
function computeTOI(lines, rng, scale = 1) {
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
function pickOnIcePair(lines, rng) {
  const idx = weightedPick([0, 1, 2], DEFENSE_BONUS, rng);
  const l = lines.defense[idx] || {};
  return [l.LD, l.RD].filter(Boolean);
}
function buildGoalLog(homeEvents, awayEvents, homePPEvents, awayPPEvents, rng) {
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
function applyPlusMinus(events, scoringLines, concedingLines, rng, scoringPM, concedingPM) {
  events.forEach((ev) => {
    const plusIds = [ev.scorerId, ...ev.assistIds];
    plusIds.forEach((id) => { scoringPM[id] = (scoringPM[id] || 0) + 1; });
    const minusIds = [...pickOnIceLine(concedingLines, rng), ...pickOnIcePair(concedingLines, rng)];
    minusIds.forEach((id) => { concedingPM[id] = (concedingPM[id] || 0) - 1; });
  });
}

function simulateGame(game, teamsById, rng, linesByTeam, staffByTeam = {}) {
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

function computeStandings(teams, games) {
  const table = {};
  teams.forEach((t) => (table[t.id] = { id: t.id, w: 0, l: 0, gf: 0, ga: 0, pts: 0, gp: 0 }));
  games.filter((g) => g.played).forEach((g) => {
    const h = table[g.home], a = table[g.away];
    h.gp++; a.gp++; h.gf += g.homeScore; h.ga += g.awayScore; a.gf += g.awayScore; a.ga += g.homeScore;
    if (g.homeScore > g.awayScore) { h.w++; h.pts += 2; a.l++; } else { a.w++; a.pts += 2; h.l++; }
  });
  return Object.values(table).sort((x, y) => y.pts - x.pts || (y.gf - y.ga) - (x.gf - x.ga));
}

// ---------- STYLE ----------
const VARS = { "--navy": "#0B1B2E", "--navy2": "#122A45", "--ice": "#F0F4F8", "--iceMuted": "#C7D2DD", "--red": "#C8102E", "--steel": "#5C7080", "--win": "#2E8B57", "--loss": "#B84A4A" };
const FONT_IMPORT = "@import url('https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=Inter:wght@400;500;600&display=swap');";
const h2Style = { fontFamily: "Oswald, sans-serif", fontWeight: 600, fontSize: 20, marginBottom: 14 };
function btnStyle(bg) { return { display: "flex", alignItems: "center", gap: 6, background: bg, color: "#fff", border: "none", borderRadius: 3, padding: "9px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer" }; }

// ---------- TRI DES TABLEAUX ----------
function useSort(initialKey, initialDir = "desc") {
  const [sortKey, setSortKey] = useState(initialKey);
  const [sortDir, setSortDir] = useState(initialDir);
  function toggle(key) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("desc"); }
  }
  return [sortKey, sortDir, toggle];
}
function sortRows(rows, key, dir, accessor) {
  const sign = dir === "asc" ? 1 : -1;
  return [...rows].sort((a, b) => {
    const av = accessor(a, key), bv = accessor(b, key);
    if (typeof av === "string") return sign * av.localeCompare(bv);
    return sign * ((av ?? 0) - (bv ?? 0));
  });
}
function SortTh({ label, sortKey, activeKey, activeDir, onSort }) {
  const active = sortKey === activeKey;
  return (
    <th onClick={() => onSort(sortKey)} style={{ textAlign: "left", padding: "6px 10px", color: active ? "var(--ice)" : "var(--iceMuted)", fontWeight: 500, fontSize: 12, borderBottom: "1px solid #ffffff22", cursor: "pointer", userSelect: "none", whiteSpace: "nowrap" }}>
      {label}{active ? (activeDir === "asc" ? " ▲" : " ▼") : ""}
    </th>
  );
}
function teamInitials(name) {
  return name.split(" ").filter((w) => w.length > 1 || /[A-ZÀ-Ü]/.test(w)).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}
function TeamCrest({ team, size = 40 }) {
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: `linear-gradient(145deg, ${team.color}, ${team.color}cc)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: "2px solid #ffffff33", boxShadow: "0 2px 4px #00000055" }}>
      <span style={{ fontFamily: "Oswald, sans-serif", fontWeight: 700, fontSize: size * 0.38, color: "#fff" }}>{teamInitials(team.name)}</span>
    </div>
  );
}
function hashStr(s) { let h = 0; for (let i = 0; i < s.length; i++) { h = (h * 31 + s.charCodeAt(i)) >>> 0; } return h; }
function deriveBio(player) {
  const h = hashStr(player.id + player.name);
  const shoots = h % 2 === 0 ? "Gauche" : "Droite";
  const isD = player.pos === "LD" || player.pos === "RD";
  const baseHeight = player.pos === "G" ? 185 : isD ? 188 : 180;
  const heightCm = baseHeight + (h % 13) - 6;
  const baseWeight = player.pos === "G" ? 84 : isD ? 92 : 85;
  const weightKg = baseWeight + ((h >> 3) % 15) - 7;
  return { shoots, heightCm, weightKg };
}
function ratingColor(val) { return val >= 85 ? "var(--win)" : val >= 65 ? "#D9A404" : "var(--loss)"; }
function emptyAttrs(pos, val = 60) {
  const keys = pos === "G" ? [...GOALIE_TECH, ...MENTAL, ...GOALIE_PHYSICAL] : [...OFFENSIVE, ...DEFENSIVE, ...MENTAL, ...PHYSICAL];
  const o = {}; keys.forEach((k) => (o[k] = val)); return o;
}
const inputStyle = { background: "var(--navy)", color: "var(--ice)", border: "1px solid #ffffff33", borderRadius: 3, padding: "7px 8px", fontSize: 13, width: "100%" };

// ---------- ATTRIBUTS /20 ET ÉTOILES RELATIVES À L'ÉQUIPE (façon FM24) ----------
function attr20(val) { return Math.max(1, Math.min(20, Math.round((val / 99) * 20))); }
function attr20Color(v20) { return v20 >= 16 ? "var(--win)" : v20 >= 11 ? "#D9A404" : "var(--loss)"; }
function teamOvrBenchmark(team) {
  if (!team || !team.roster.length) return 65;
  return team.roster.reduce((a, p) => a + p.ovr, 0) / team.roster.length;
}
function getScoutInfo(player, ownerTeamId, myTeamId, staff, scoutKnowledge) {
  const explicit = scoutKnowledge[player.id];
  if (explicit) return explicit;
  if (ownerTeamId === myTeamId) {
    const best = Math.max(staff?.scoutAmateur?.rating || 0, staff?.scoutPro?.rating || 0, 45);
    return { known: true, month: null, scoutName: "Personnel interne", quality: best };
  }
  return { known: false, month: null, scoutName: null, quality: 0 };
}
function scoutQualityColor(quality) { return quality >= 65 ? "#D9A404" : "var(--ice)"; }
function starsFor(value, benchmark) {
  const diff = value - benchmark;
  const steps = [20, 14, 8, 3, -3, -8, -14, -20];
  const vals = [5, 4.5, 4, 3.5, 3, 2.5, 2, 1.5];
  for (let i = 0; i < steps.length; i++) if (diff >= steps[i]) return vals[i];
  return 1;
}
function starsText(value) {
  const rounded = Math.round(value * 2) / 2;
  const full = Math.floor(rounded);
  const half = rounded - full >= 0.5;
  return "★".repeat(full) + (half ? "⯨" : "") + "☆".repeat(Math.max(0, 5 - full - (half ? 1 : 0)));
}
function StarRating({ value, size = 14, color = "#D9A404" }) {
  const items = [];
  for (let i = 1; i <= 5; i++) {
    const fillPct = value >= i ? 100 : value >= i - 0.5 ? 50 : 0;
    items.push(
      <span key={i} style={{ position: "relative", width: size, height: size, display: "inline-block" }}>
        <Star size={size} color="#ffffff33" />
        <span style={{ position: "absolute", top: 0, left: 0, width: `${fillPct}%`, height: "100%", overflow: "hidden" }}>
          <Star size={size} color={color} fill={color} />
        </span>
      </span>
    );
  }
  return <div style={{ display: "inline-flex", gap: 1 }}>{items}</div>;
}
function PlayerStars({ player, team, width }) {
  const bench = teamOvrBenchmark(team);
  const cur = starsFor(player.ovr, bench);
  const pot = starsFor(player.potential, bench);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: width ? "nowrap" : "wrap" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ fontSize: 11, color: "var(--iceMuted)" }}>Act.</span><StarRating value={cur} /></div>
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ fontSize: 11, color: "var(--iceMuted)" }}>Pot.</span><StarRating value={pot} color="#7A9EDB" /></div>
    </div>
  );
}
function AttrRow({ label, val }) {
  const v20 = attr20(val);
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "3px 0" }}>
      <span style={{ fontSize: 12, color: "var(--iceMuted)" }}>{label}</span>
      <span style={{ background: attr20Color(v20), color: "#0B1B2E", fontWeight: 700, fontSize: 11, borderRadius: 3, padding: "1px 7px", minWidth: 24, textAlign: "center" }}>{v20}</span>
    </div>
  );
}
function scoutReport(player, staff) {
  const cats = player.pos === "G" ? GOALIE_CATEGORIES : SKATER_CATEGORIES;
  const allAttrs = cats.flatMap((c) => c.attrs).map((k) => ({ k, v: player.attrs[k] }));
  const sorted = [...allAttrs].sort((a, b) => b.v - a.v);
  const strengths = sorted.slice(0, 2).map((a) => ATTR_LABELS[a.k].toLowerCase());
  const weaknesses = sorted.slice(-2).map((a) => ATTR_LABELS[a.k].toLowerCase());
  const gap = player.potential - player.ovr;
  const scout = staff?.scoutPro || staff?.scoutAmateur;
  let projection;
  if (gap >= 12) projection = "Marge de progression importante — un projet à long terme prometteur.";
  else if (gap >= 5) projection = "Encore de la place pour progresser avec le bon encadrement.";
  else if (gap <= -2) projection = "A probablement atteint son plafond, sinon amorce un déclin.";
  else projection = "Joueur déjà proche de son plein potentiel.";
  const header = scout ? `Analyse de ${scout.name} (dépisteur, cote ${scout.rating})` : "Analyse interne (aucun dépisteur en poste — évaluation limitée)";
  return { header, body: `Points forts: ${strengths.join(" et ")}. À travailler: ${weaknesses.join(" et ")}. ${projection}` };
}
function InfoCard({ label, children, accent }) {
  return (
    <div style={{ background: "var(--navy)", border: `1px solid ${accent ? accent + "55" : "#ffffff22"}`, borderTop: accent ? `3px solid ${accent}` : "1px solid #ffffff22", borderRadius: 4, padding: "10px 12px", flex: 1, minWidth: 130 }}>
      <div style={{ fontSize: 10, color: "var(--iceMuted)", letterSpacing: 0.5, marginBottom: 5 }}>{label}</div>
      {children}
    </div>
  );
}
function PlayerModal({ player, team, lines, editable, seasonStats, staff, myTeamId, scoutKnowledge, onRequestScout, onClose, onEdit, onOfferContract }) {
  const categories = player.pos === "G" ? GOALIE_CATEGORIES : SKATER_CATEGORIES;
  const bio = deriveBio(player);
  const stat = seasonStats ? seasonStats[player.id] : null;
  const benchmark = teamOvrBenchmark(team);
  const role = lineLabel(player.id, lines);
  const scoutInfo = getScoutInfo(player, team.id, myTeamId, staff, scoutKnowledge);
  const known = scoutInfo.known;
  const qColor = scoutQualityColor(scoutInfo.quality);
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "#00000099", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 16 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "var(--navy2)", border: `1px solid ${team.color}55`, borderRadius: 4, width: 500, maxWidth: "94vw", maxHeight: "90vh", overflow: "auto" }}>
        <div style={{ background: `linear-gradient(90deg, ${team.color}, ${team.color}99)`, padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#00000030", display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid #ffffff55", flexShrink: 0 }}>
              <span style={{ fontFamily: "Oswald, sans-serif", fontWeight: 700, fontSize: 16, color: "#fff" }}>{player.number ?? player.pos}</span>
            </div>
            <div>
              <div style={{ fontFamily: "Oswald, sans-serif", fontWeight: 600, fontSize: 17, color: "#fff" }}>{player.name}</div>
              <div style={{ fontSize: 12, color: "#ffffffcc" }}>{NATION_FLAG[player.nationality] || "🏳️"} {team.name} · {player.pos} · {player.age} ans</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer" }}><X size={18} /></button>
        </div>
        <div style={{ padding: 16 }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
            <InfoCard label="CÔTE ACTUELLE / POTENTIELLE" accent={known ? "#D9A404" : "var(--steel)"}>
              {known ? (<><StarRating value={starsFor(player.ovr, benchmark)} size={13} color={qColor} /><div style={{ marginTop: 4 }}><StarRating value={starsFor(player.potential, benchmark)} size={13} color={qColor === "#D9A404" ? "#6FA8DC" : "var(--iceMuted)"} /></div></>) : (<div style={{ fontSize: 13, color: "var(--iceMuted)" }}>Non dépisté</div>)}
            </InfoCard>
            <InfoCard label="SOUS CONTRAT" accent="var(--win)">
              <div style={{ fontSize: 13, fontWeight: 600 }}>{known ? contractLabel(player.contract) : "?"}</div>
            </InfoCard>
            <InfoCard label="RÔLE DANS L'ÉQUIPE" accent="var(--steel)">
              <div style={{ fontSize: 13, fontWeight: 600 }}>{role}</div>
            </InfoCard>
            <InfoCard label="REPÊCHAGE">
              <div style={{ fontSize: 13, fontWeight: 600 }}>{known ? draftLabel(player) : "?"}</div>
            </InfoCard>
          </div>

          <InfoCard label="DÉPISTAGE">
            {known ? (
              <div style={{ fontSize: 12 }}>
                <span style={{ color: qColor, fontWeight: 700 }}>{scoutInfo.month ? `Connu depuis le mois ${scoutInfo.month}` : "Connu (personnel de l'équipe)"}</span>
                <span style={{ color: "var(--iceMuted)" }}> · évalué par {scoutInfo.scoutName} · qualité {attr20(scoutInfo.quality)}/20</span>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <span style={{ fontSize: 12, color: "var(--iceMuted)" }}>Ce joueur n'a pas été dépisté par ton personnel.</span>
                <button onClick={() => onRequestScout(player)} style={{ ...btnStyle("var(--red)"), fontSize: 12 }}>Demander un dépistage</button>
              </div>
            )}
          </InfoCard>

          {known && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr", gap: "2px 12px", fontSize: 12, margin: "16px 0 18px", color: "var(--iceMuted)" }}>
              <div>Nationalité <span style={{ color: "var(--ice)" }}>{NATION_FLAG[player.nationality] || ""} {NATION_NAME[player.nationality] || "—"}</span></div>
              <div>Tire <span style={{ color: "var(--ice)" }}>{bio.shoots}</span></div>
              <div>Taille <span style={{ color: "var(--ice)" }}>{bio.heightCm} cm</span></div>
              <div>Poids <span style={{ color: "var(--ice)" }}>{bio.weightKg} kg</span></div>
              <div>Forme <span style={{ color: "var(--win)" }}>Bonne</span></div>
            </div>
          )}

          {known ? (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px", marginTop: 16 }}>
              {categories.map((cat) => (
                <div key={cat.key} style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 11, letterSpacing: 0.5, color: "var(--iceMuted)", marginBottom: 4, borderBottom: "1px solid #ffffff1a", paddingBottom: 3 }}>{cat.label.toUpperCase()}</div>
                  {cat.attrs.map((k) => <AttrRow key={k} label={ATTR_LABELS[k]} val={player.attrs[k]} />)}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: 12, color: "var(--iceMuted)", margin: "16px 0" }}>Attributs cachés tant que ce joueur n'a pas été dépisté.</div>
          )}
          {known && player.pos !== "G" && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: "var(--iceMuted)", marginBottom: 6, borderTop: "1px solid #ffffff1a", paddingTop: 10 }}>STATISTIQUES DE SAISON</div>
              <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
                <thead><tr style={{ color: "var(--iceMuted)", fontSize: 11 }}>{["PJ", "B", "A", "PTS", "T", "+/-", "MEC", "PUN"].map((h) => (<th key={h} style={{ padding: "3px 6px", borderBottom: "1px solid #ffffff1a" }}>{h}</th>))}</tr></thead>
                <tbody><tr>{[stat?.gp || 0, stat?.g || 0, stat?.a || 0, stat?.pts || 0, stat?.shots || 0, stat?.plusMinus || 0, stat?.hits || 0, stat?.pim || 0].map((v, i) => (<td key={i} style={{ padding: "5px 6px", textAlign: "center" }}>{i === 5 && v > 0 ? `+${v}` : v}</td>))}</tr></tbody>
              </table>
            </div>
          )}
          {editable && known && (() => { const report = scoutReport(player, staff); return (
            <div style={{ background: "var(--navy)", border: "1px solid #ffffff22", borderRadius: 4, padding: 12, marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: "#D9A404", marginBottom: 4, fontWeight: 600 }}>{report.header.toUpperCase()}</div>
              <div style={{ fontSize: 13, color: "var(--iceMuted)", lineHeight: 1.5 }}>{report.body}</div>
            </div>
          ); })()}
          {editable && (
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => onEdit(player)} style={{ ...btnStyle("var(--steel)"), flex: 1, justifyContent: "center" }}>Modifier ce joueur</button>
              <button onClick={() => onOfferContract(player)} style={{ ...btnStyle("var(--win)"), flex: 1, justifyContent: "center" }}>Nouveau contrat</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PlayerEditorModal({ initial, isNew, team, onSave, onClose }) {
  const [name, setName] = useState(initial.name);
  const [pos, setPos] = useState(initial.pos);
  const [age, setAge] = useState(initial.age);
  const [attrs, setAttrs] = useState(initial.attrs);
  const [potentialOverride, setPotentialOverride] = useState(initial.potential);
  const [nationality, setNationality] = useState(initial.nationality || "CA");

  const ovr = computeOvr(pos, attrs);
  const categories = pos === "G" ? GOALIE_CATEGORIES : SKATER_CATEGORIES;

  function changePos(newPos) { setPos(newPos); setAttrs(emptyAttrs(newPos, 60)); }
  function setAttr(k, v) { setAttrs((prev) => ({ ...prev, [k]: v })); }
  function handleSave() {
    if (!name.trim()) return;
    const finalPotential = Math.max(ovr, Math.min(99, Number(potentialOverride) || ovr));
    onSave({
      id: initial.id, name: name.trim(), pos, age: Number(age) || 20, attrs, ovr, potential: finalPotential,
      number: initial.number, contract: initial.contract || randomContractRT(), draftPick: initial.draftPick ?? null, draftYear: initial.draftYear ?? null, nationality: nationality,
    });
  }

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "#00000099", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 60, padding: 16 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "var(--navy2)", border: "1px solid #ffffff33", borderTop: "4px solid var(--red)", borderRadius: 4, padding: 24, width: 440, maxWidth: "92vw", maxHeight: "88vh", overflow: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
          <div style={{ fontFamily: "Oswald, sans-serif", fontWeight: 600, fontSize: 20 }}>{isNew ? "Créer un joueur" : "Modifier le joueur"}</div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--iceMuted)", cursor: "pointer" }}><X size={18} /></button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 80px", gap: 8, marginBottom: 10 }}>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nom du joueur" style={inputStyle} />
          <select value={pos} onChange={(e) => changePos(e.target.value)} style={inputStyle}>
            {["C", "LW", "RW", "LD", "RD", "G"].map((p) => (<option key={p} value={p}>{p}</option>))}
          </select>
          <input type="number" value={age} onChange={(e) => setAge(e.target.value)} style={inputStyle} min={17} max={42} />
        </div>
        <select value={nationality} onChange={(e) => setNationality(e.target.value)} style={{ ...inputStyle, marginBottom: 16 }}>
          {NATIONALITY_POOL.map((n) => (<option key={n.code} value={n.code}>{NATION_FLAG[n.code]} {NATION_NAME[n.code]}</option>))}
        </select>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 18, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ fontSize: 12, color: "var(--iceMuted)" }}>Actuel</span><StarRating value={starsFor(ovr, teamOvrBenchmark(team))} /></div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flex: 1, minWidth: 160 }}>
            <span style={{ fontSize: 12, color: "var(--iceMuted)" }}>Potentiel</span>
            <StarRating value={starsFor(potentialOverride, teamOvrBenchmark(team))} color="#7A9EDB" />
            <input type="range" min={ovr} max={99} value={potentialOverride} onChange={(e) => setPotentialOverride(Number(e.target.value))} style={{ flex: 1 }} />
          </div>
        </div>
        {categories.map((cat) => (
          <div key={cat.key} style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: "var(--iceMuted)", marginBottom: 8, borderBottom: "1px solid #ffffff1a", paddingBottom: 4 }}>{cat.label}</div>
            {cat.attrs.map((k) => (
              <div key={k} style={{ marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--iceMuted)", marginBottom: 2 }}><span>{ATTR_LABELS[k]}</span><span>{attr20(attrs[k])}/20</span></div>
                <input type="range" min={20} max={99} value={attrs[k]} onChange={(e) => setAttr(k, Number(e.target.value))} style={{ width: "100%" }} />
              </div>
            ))}
          </div>
        ))}
        <button onClick={handleSave} style={{ ...btnStyle("var(--red)"), width: "100%", justifyContent: "center", marginTop: 8 }}>Enregistrer</button>
      </div>
    </div>
  );
}
function ContractOfferModal({ player, isRenewal, team, onClose, onSubmit }) {
  const expSalary = expectedSalary(player);
  const expYears = expectedYears(player);
  const [salary, setSalary] = useState(expSalary);
  const [years, setYears] = useState(expYears);
  const [signingBonus, setSigningBonus] = useState(0);
  const [noTrade, setNoTrade] = useState(false);
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "#00000099", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 60, padding: 16 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "var(--navy2)", border: "1px solid #ffffff33", borderTop: "4px solid var(--win)", borderRadius: 4, padding: 24, width: 420, maxWidth: "92vw", maxHeight: "88vh", overflow: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
          <div>
            <div style={{ fontSize: 12, color: "var(--iceMuted)", display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>{isRenewal ? "Renouvellement de contrat" : "Offre de contrat"} · {player.pos} · {player.age} ans · <StarRating value={starsFor(player.ovr, teamOvrBenchmark(team))} size={12} /></div>
            <div style={{ fontFamily: "Oswald, sans-serif", fontWeight: 600, fontSize: 20 }}>{player.name}</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--iceMuted)", cursor: "pointer" }}><X size={18} /></button>
        </div>
        <p style={{ fontSize: 12, color: "var(--iceMuted)", margin: "10px 0 18px" }}>Attentes estimées de l'agent: ~{expSalary.toLocaleString()}k$/an sur {expYears} an{expYears > 1 ? "s" : ""}. Trop loin de ces attentes, l'offre risque d'être refusée.</p>

        <div style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--iceMuted)", marginBottom: 4 }}><span>Salaire annuel</span><span>{salary.toLocaleString()}k$</span></div>
          <input type="range" min={200} max={12000} step={100} value={salary} onChange={(e) => setSalary(Number(e.target.value))} style={{ width: "100%" }} />
        </div>
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--iceMuted)", marginBottom: 4 }}><span>Durée du contrat</span><span>{years} an{years > 1 ? "s" : ""}</span></div>
          <input type="range" min={1} max={7} step={1} value={years} onChange={(e) => setYears(Number(e.target.value))} style={{ width: "100%" }} />
        </div>
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--iceMuted)", marginBottom: 4 }}><span>Prime à la signature</span><span>{signingBonus.toLocaleString()}k$</span></div>
          <input type="range" min={0} max={3000} step={100} value={signingBonus} onChange={(e) => setSigningBonus(Number(e.target.value))} style={{ width: "100%" }} />
        </div>
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, marginBottom: 20, cursor: "pointer" }}>
          <input type="checkbox" checked={noTrade} onChange={(e) => setNoTrade(e.target.checked)} />
          Clause de non-échange (les vedettes y tiennent davantage)
        </label>
        <button onClick={() => onSubmit(player, { salary, years, signingBonus, noTrade }, isRenewal)} style={{ ...btnStyle("var(--win)"), width: "100%", justifyContent: "center" }}>Envoyer l'offre</button>
      </div>
    </div>
  );
}
function RosterTable({ roster, lines, staff, myTeamId, teamId, scoutKnowledge, onSelect }) {
  const [sortKey, sortDir, toggleSort] = useSort("ovr");
  const benchmark = teamOvrBenchmark({ roster });
  const accessor = (p, key) => {
    if (key === "number") return p.number ?? -1;
    if (key === "name") return p.name;
    if (key === "pos") return p.pos;
    if (key === "age") return p.age;
    if (key === "line") return lineLabel(p.id, lines);
    if (key === "ovr") return p.ovr;
    if (key === "potential") return p.potential;
    if (key === "salary") return p.contract?.salary || 0;
    return 0;
  };
  const sorted = sortRows(roster, sortKey, sortDir, accessor);
  return (
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
      <thead><tr>
        <SortTh label="#" sortKey="number" activeKey={sortKey} activeDir={sortDir} onSort={toggleSort} />
        <SortTh label="Joueur" sortKey="name" activeKey={sortKey} activeDir={sortDir} onSort={toggleSort} />
        <SortTh label="Pos" sortKey="pos" activeKey={sortKey} activeDir={sortDir} onSort={toggleSort} />
        <SortTh label="Âge" sortKey="age" activeKey={sortKey} activeDir={sortDir} onSort={toggleSort} />
        <SortTh label="Trio/Paire" sortKey="line" activeKey={sortKey} activeDir={sortDir} onSort={toggleSort} />
        <SortTh label="Cote actuelle" sortKey="ovr" activeKey={sortKey} activeDir={sortDir} onSort={toggleSort} />
        <SortTh label="Potentiel" sortKey="potential" activeKey={sortKey} activeDir={sortDir} onSort={toggleSort} />
        <SortTh label="Contrat" sortKey="salary" activeKey={sortKey} activeDir={sortDir} onSort={toggleSort} />
        <th></th>
      </tr></thead>
      <tbody>
        {sorted.map((p) => {
          const scoutInfo = getScoutInfo(p, teamId, myTeamId, staff, scoutKnowledge);
          const qColor = scoutQualityColor(scoutInfo.quality);
          return (
          <tr key={p.id} onClick={() => onSelect(p)} style={{ borderBottom: "1px solid #ffffff11", cursor: "pointer" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#ffffff0a")} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
            <td style={{ padding: "7px 10px", color: "var(--iceMuted)" }}>{p.number ?? "—"}</td>
            <td style={{ padding: "7px 10px" }}>{NATION_FLAG[p.nationality] || ""} {p.name}</td>
            <td style={{ padding: "7px 10px" }}>{p.pos}</td>
            <td style={{ padding: "7px 10px" }}>{p.age}</td>
            <td style={{ padding: "7px 10px", color: "var(--iceMuted)" }}>{lineLabel(p.id, lines)}</td>
            <td style={{ padding: "7px 10px" }}><StarRating value={starsFor(p.ovr, benchmark)} size={12} color={qColor} /></td>
            <td style={{ padding: "7px 10px" }}><StarRating value={starsFor(p.potential, benchmark)} size={12} color={qColor === "#D9A404" ? "#7A9EDB" : "var(--iceMuted)"} /></td>
            <td style={{ padding: "7px 10px", color: "var(--iceMuted)", fontSize: 12 }}>{contractLabel(p.contract)}</td>
            <td style={{ padding: "7px 10px", color: "var(--iceMuted)", fontSize: 12 }}>Profil ›</td>
          </tr>
          );
        })}
      </tbody>
    </table>
  );
}
function Select({ value, options, onSelect, benchmark }) {
  return (
    <select value={value || ""} onChange={(e) => onSelect(e.target.value)} style={{ background: "var(--navy)", color: "var(--ice)", border: "1px solid #ffffff33", borderRadius: 3, padding: "6px 8px", fontSize: 13, width: "100%" }}>
      {options.map((p) => (<option key={p.id} value={p.id}>{p.name} {benchmark != null ? starsText(starsFor(p.ovr, benchmark)) : ""}</option>))}
    </select>
  );
}
function PitchPlayer({ label, sub, tone, onClick, onDrop, onDragOver, armedTarget }) {
  return (
    <div onClick={onClick} onDrop={onDrop} onDragOver={onDragOver} style={{ background: tone, borderRadius: 6, padding: "5px 9px", textAlign: "center", minWidth: 74, boxShadow: armedTarget ? "0 0 0 2px #fff, 0 2px 5px #00000055" : "0 2px 5px #00000055", border: "1px solid #ffffff44", cursor: "pointer" }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "#0B1B2E", whiteSpace: "nowrap" }}>{label}</div>
      {sub && <div style={{ fontSize: 9, color: "#0B1B2E99", fontWeight: 600 }}>{sub}</div>}
    </div>
  );
}
function LineupPitch({ team, lines, onSelectPlayer, onAssign, armedId, onConsumeArmed }) {
  const findP = (id) => team.roster.find((x) => x.id === id);
  const nameOf = (id) => { const p = findP(id); return p ? p.name.split(" ").slice(-1)[0] : "—"; };
  const lineTone = ["#D9A404", "#C7D2DD", "#C08A4E", "#8C97A3"];
  const pairTone = ["#D9A404", "#C7D2DD", "#C08A4E"];
  function slotProps(section, idx, key, currentId) {
    return {
      onDragOver: (e) => e.preventDefault(),
      onDrop: (e) => { e.preventDefault(); const pid = e.dataTransfer.getData("text/plain"); if (pid) onAssign(section, idx, key, pid); },
      onClick: () => {
        if (armedId) { onAssign(section, idx, key, armedId); onConsumeArmed(); }
        else { const p = findP(currentId); if (p) onSelectPlayer(p, team); }
      },
      armedTarget: !!armedId,
    };
  }
  return (
    <div style={{ background: "linear-gradient(180deg, #cfe8f5, #a9d4e8)", borderRadius: 8, padding: "16px 10px", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: "50%", left: 0, right: 0, height: 2, background: "#c8102e88" }} />
      <div style={{ position: "absolute", top: "26%", left: 0, right: 0, height: 2, background: "#1e5f8c66" }} />
      <div style={{ position: "absolute", top: "74%", left: 0, right: 0, height: 2, background: "#1e5f8c66" }} />
      <div style={{ position: "absolute", top: "50%", left: "50%", width: 46, height: 46, marginLeft: -23, marginTop: -23, borderRadius: "50%", border: "2px solid #c8102e88" }} />
      <div style={{ display: "flex", flexDirection: "column", gap: 12, position: "relative" }}>
        {lines.forwards.map((l, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "center", gap: 10, flexWrap: "wrap" }}>
            <PitchPlayer label={nameOf(l.LW)} sub={`AG · T${i + 1}`} tone={lineTone[i]} {...slotProps("forwards", i, "LW", l.LW)} />
            <PitchPlayer label={nameOf(l.C)} sub={`C · T${i + 1}`} tone={lineTone[i]} {...slotProps("forwards", i, "C", l.C)} />
            <PitchPlayer label={nameOf(l.RW)} sub={`AD · T${i + 1}`} tone={lineTone[i]} {...slotProps("forwards", i, "RW", l.RW)} />
          </div>
        ))}
        {lines.defense.map((l, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "center", gap: 34, flexWrap: "wrap" }}>
            <PitchPlayer label={nameOf(l.LD)} sub={`DG · P${i + 1}`} tone={pairTone[i]} {...slotProps("defense", i, "LD", l.LD)} />
            <PitchPlayer label={nameOf(l.RD)} sub={`DD · P${i + 1}`} tone={pairTone[i]} {...slotProps("defense", i, "RD", l.RD)} />
          </div>
        ))}
        <div style={{ display: "flex", justifyContent: "center" }}>
          <PitchPlayer label={nameOf(lines.goalies.starter)} sub="Gardien" tone="#5C7080" {...slotProps("goalies", null, "starter", lines.goalies.starter)} />
        </div>
      </div>
      <div style={{ position: "relative", display: "flex", justifyContent: "center", alignItems: "center", gap: 6, marginTop: 10, fontSize: 11, color: "#0B1B2E" }}>
        <span>Réserviste:</span>
        <span
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); const pid = e.dataTransfer.getData("text/plain"); if (pid) onAssign("goalies", null, "backup", pid); }}
          onClick={() => { if (armedId) { onAssign("goalies", null, "backup", armedId); onConsumeArmed(); } }}
          style={{ background: "#ffffffcc", borderRadius: 4, padding: "2px 8px", fontWeight: 600, cursor: "pointer" }}
        >
          {nameOf(lines.goalies.backup)}
        </span>
      </div>
    </div>
  );
}
function encodeDrag(origin, playerId) { return origin ? `pitch:${origin.section}:${origin.idx}:${origin.key}:${playerId}` : `list:${playerId}`; }
function decodeDrag(str) {
  if (!str) return null;
  if (str.startsWith("pitch:")) { const parts = str.split(":"); return { type: "pitch", section: parts[1], idx: parts[2] === "null" ? null : Number(parts[2]), key: parts[3], playerId: parts[4] }; }
  if (str.startsWith("list:")) return { type: "list", playerId: str.slice(5) };
  return { type: "list", playerId: str };
}
function LineupPitch({ team, lines, onSelectPlayer, onAssign, onSwap, armed, onArm, onConsumeArmed }) {
  const findP = (id) => team.roster.find((x) => x.id === id);
  const nameOf = (id) => { const p = findP(id); return p ? p.name.split(" ").slice(-1)[0] : "—"; };
  const lineTone = ["#D9A404", "#C7D2DD", "#C08A4E", "#8C97A3"];
  const pairTone = ["#D9A404", "#C7D2DD", "#C08A4E"];
  function handleDrop(e, section, idx, key) {
    e.preventDefault();
    const decoded = decodeDrag(e.dataTransfer.getData("text/plain"));
    if (!decoded) return;
    if (decoded.type === "pitch") { if (decoded.section === section && decoded.idx === idx && decoded.key === key) return; onSwap(decoded.section, decoded.idx, decoded.key, section, idx, key); }
    else onAssign(section, idx, key, decoded.playerId);
  }
  function handleClick(section, idx, key, currentId) {
    if (armed) {
      if (armed.origin && armed.origin.section === section && armed.origin.idx === idx && armed.origin.key === key) { onConsumeArmed(); return; }
      if (armed.origin) onSwap(armed.origin.section, armed.origin.idx, armed.origin.key, section, idx, key);
      else onAssign(section, idx, key, armed.playerId);
      onConsumeArmed();
    } else if (currentId) {
      onArm({ playerId: currentId, origin: { section, idx, key } });
    }
  }
  function handleDoubleClick(currentId) { const p = findP(currentId); if (p) onSelectPlayer(p, team); }
  function slotProps(section, idx, key, currentId) {
    return {
      draggable: !!currentId,
      onDragStart: (e) => currentId && e.dataTransfer.setData("text/plain", encodeDrag({ section, idx, key }, currentId)),
      onDragOver: (e) => e.preventDefault(),
      onDrop: (e) => handleDrop(e, section, idx, key),
      onClick: () => handleClick(section, idx, key, currentId),
      onDoubleClick: () => handleDoubleClick(currentId),
      armedTarget: !!armed,
    };
  }
  return (
    <div style={{ background: "linear-gradient(180deg, #cfe8f5, #a9d4e8)", borderRadius: 8, padding: "16px 10px", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: "50%", left: 0, right: 0, height: 2, background: "#c8102e88" }} />
      <div style={{ position: "absolute", top: "26%", left: 0, right: 0, height: 2, background: "#1e5f8c66" }} />
      <div style={{ position: "absolute", top: "74%", left: 0, right: 0, height: 2, background: "#1e5f8c66" }} />
      <div style={{ position: "absolute", top: "50%", left: "50%", width: 46, height: 46, marginLeft: -23, marginTop: -23, borderRadius: "50%", border: "2px solid #c8102e88" }} />
      <div style={{ display: "flex", flexDirection: "column", gap: 12, position: "relative" }}>
        {lines.forwards.map((l, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "center", gap: 10, flexWrap: "wrap" }}>
            <PitchPlayer label={nameOf(l.LW)} sub={`AG · T${i + 1}`} tone={lineTone[i]} {...slotProps("forwards", i, "LW", l.LW)} />
            <PitchPlayer label={nameOf(l.C)} sub={`C · T${i + 1}`} tone={lineTone[i]} {...slotProps("forwards", i, "C", l.C)} />
            <PitchPlayer label={nameOf(l.RW)} sub={`AD · T${i + 1}`} tone={lineTone[i]} {...slotProps("forwards", i, "RW", l.RW)} />
          </div>
        ))}
        {lines.defense.map((l, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "center", gap: 34, flexWrap: "wrap" }}>
            <PitchPlayer label={nameOf(l.LD)} sub={`DG · P${i + 1}`} tone={pairTone[i]} {...slotProps("defense", i, "LD", l.LD)} />
            <PitchPlayer label={nameOf(l.RD)} sub={`DD · P${i + 1}`} tone={pairTone[i]} {...slotProps("defense", i, "RD", l.RD)} />
          </div>
        ))}
        <div style={{ display: "flex", justifyContent: "center" }}>
          <PitchPlayer label={nameOf(lines.goalies.starter)} sub="Gardien" tone="#5C7080" {...slotProps("goalies", null, "starter", lines.goalies.starter)} />
        </div>
      </div>
      <div style={{ position: "relative", display: "flex", justifyContent: "center", alignItems: "center", gap: 6, marginTop: 10, fontSize: 11, color: "#0B1B2E" }}>
        <span>Réserviste:</span>
        <span {...(() => { const { armedTarget, ...rest } = slotProps("goalies", null, "backup", lines.goalies.backup); return rest; })()} style={{ background: "#ffffffcc", borderRadius: 4, padding: "2px 8px", fontWeight: 600, cursor: "pointer" }}>
          {nameOf(lines.goalies.backup)}
        </span>
      </div>
    </div>
  );
}
function TacticSummary({ lines }) {
  const fc = FORECHECK_OPTIONS.find((o) => o.id === lines.strategy.forecheck)?.label;
  const df = DEFENSE_OPTIONS.find((o) => o.id === lines.strategy.defense)?.label;
  const en = ENTRY_OPTIONS.find((o) => o.id === lines.strategy.entry)?.label;
  const ex = EXIT_OPTIONS.find((o) => o.id === lines.strategy.exit)?.label;
  return (
    <div style={{ display: "flex", gap: 14, flexWrap: "wrap", fontSize: 11, color: "var(--iceMuted)", marginBottom: 16, background: "var(--navy)", border: "1px solid #ffffff22", borderRadius: 4, padding: "8px 12px" }}>
      <span><strong style={{ color: "var(--ice)" }}>Forecheck:</strong> {fc}</span>
      <span><strong style={{ color: "var(--ice)" }}>Défense:</strong> {df}</span>
      <span><strong style={{ color: "var(--ice)" }}>Entrée:</strong> {en}</span>
      <span><strong style={{ color: "var(--ice)" }}>Sortie:</strong> {ex}</span>
      <span><strong style={{ color: "var(--ice)" }}>Agressivité:</strong> {lines.mentality.aggression}</span>
    </div>
  );
}
function RosterSideList({ team, benchmark, armed, onArm, onSelectPlayer }) {
  const groups = { C: [], LW: [], RW: [], LD: [], RD: [], G: [] };
  team.roster.forEach((p) => { if (groups[p.pos]) groups[p.pos].push(p); });
  Object.values(groups).forEach((arr) => arr.sort((a, b) => b.ovr - a.ovr));
  const labels = { C: "CENTRES", LW: "AILIERS GAUCHES", RW: "AILIERS DROITS", LD: "DÉFENSEURS GAUCHES", RD: "DÉFENSEURS DROITS", G: "GARDIENS" };
  return (
    <div style={{ background: "var(--navy)", border: "1px solid #ffffff22", borderRadius: 6, padding: 10, maxHeight: 460, overflow: "auto" }}>
      <div style={{ fontSize: 11, color: "var(--iceMuted)", marginBottom: 8 }}>Clique ou glisse un joueur vers une position du schéma. Clique deux joueurs du schéma pour les échanger.</div>
      {Object.keys(groups).map((pos) => groups[pos].length > 0 && (
        <div key={pos} style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 10, color: "var(--iceMuted)", marginBottom: 4, letterSpacing: 0.5 }}>{labels[pos]}</div>
          {groups[pos].map((p) => (
            <div
              key={p.id}
              draggable
              onDragStart={(e) => e.dataTransfer.setData("text/plain", encodeDrag(null, p.id))}
              onClick={() => (armed?.playerId === p.id ? onArm(null) : onArm({ playerId: p.id, origin: null }))}
              onDoubleClick={() => onSelectPlayer(p, team)}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 7px", borderRadius: 3, cursor: "grab", marginBottom: 1, background: armed?.playerId === p.id ? "var(--red)" : "transparent" }}
            >
              <span style={{ flex: 1, fontSize: 12, color: armed?.playerId === p.id ? "#fff" : "var(--ice)" }}>{NATION_FLAG[p.nationality] || ""} {p.name}</span>
              <StarRating value={starsFor(p.ovr, benchmark)} size={9} />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
function LinesEditor({ team, lines, onChange, onSwap, onChangeUnit, onAutoLines, onAutoSpecialTeams, onSelectPlayer }) {
  const [armed, setArmed] = useState(null);
  const benchmark = teamOvrBenchmark(team);
  const skaters = team.roster.filter((p) => p.pos !== "G");
  function chemistry(ids) {
    const found = ids.map((id) => team.roster.find((p) => p.id === id)).filter(Boolean);
    if (found.length === 0) return null;
    return Math.round(found.reduce((a, p) => a + p.ovr, 0) / found.length);
  }
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <h2 style={{ ...h2Style, marginBottom: 0 }}>Trios et paires</h2>
        <button onClick={onAutoLines} style={btnStyle("var(--win)")}>Meilleures lignes automatiques</button>
      </div>
      <p style={{ fontSize: 12, color: "var(--iceMuted)", marginTop: 6, marginBottom: 14 }}>Le trio 1 reçoit le plus de temps de glace; le trio 4 le moins. Double-clique un joueur pour voir sa fiche.</p>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-start", marginBottom: 26 }}>
        <div style={{ flex: "2 1 320px", minWidth: 280 }}>
          <LineupPitch team={team} lines={lines} onSelectPlayer={onSelectPlayer} onAssign={onChange} onSwap={onSwap} armed={armed} onArm={setArmed} onConsumeArmed={() => setArmed(null)} />
          <div style={{ marginTop: 12 }}>
            <TacticSummary lines={lines} />
          </div>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 11, color: "var(--iceMuted)" }}>
            {lines.forwards.map((l, i) => (<span key={i}>Trio {i + 1}: <strong style={{ color: "var(--ice)" }}>{chemistry([l.LW, l.C, l.RW]) ?? "—"}</strong></span>))}
            {lines.defense.map((l, i) => (<span key={i}>Paire {i + 1}: <strong style={{ color: "var(--ice)" }}>{chemistry([l.LD, l.RD]) ?? "—"}</strong></span>))}
          </div>
        </div>
        <div style={{ flex: "1 1 220px", minWidth: 220 }}>
          <RosterSideList team={team} benchmark={benchmark} armed={armed} onArm={setArmed} onSelectPlayer={onSelectPlayer} />
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <h2 style={{ ...h2Style, marginBottom: 0 }}>Avantage numérique (unité 1)</h2>
        <button onClick={onAutoSpecialTeams} style={btnStyle("var(--win)")}>Meilleur alignement spécial automatique</button>
      </div>
      <p style={{ fontSize: 12, color: "var(--iceMuted)", marginTop: 6, marginBottom: 10 }}>5 patineurs qui reçoivent les occasions de marquer lors des punitions adverses.</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px,1fr))", gap: 8, marginBottom: 26 }}>
        {lines.pp.map((id, i) => (<Select key={i} value={id} options={skaters} onSelect={(v) => onChangeUnit("pp", i, v)} benchmark={benchmark} />))}
      </div>
      <h2 style={h2Style}>Désavantage numérique</h2>
      <p style={{ fontSize: 12, color: "var(--iceMuted)", marginTop: -8, marginBottom: 10 }}>4 patineurs qui défendent lorsque ton équipe écope d'une punition.</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px,1fr))", gap: 8 }}>
        {lines.pk.map((id, i) => (<Select key={i} value={id} options={skaters} onSelect={(v) => onChangeUnit("pk", i, v)} benchmark={benchmark} />))}
      </div>
    </div>
  );
}
function contractLabel(contract) {
  if (!contract) return "Agent libre";
  return `${contract.years} an${contract.years > 1 ? "s" : ""} · ${contract.salary}k$${contract.noTrade ? " · NTC" : ""}`;
}
function draftLabel(player) {
  return player.draftPick ? `${player.draftPick}e rang (${player.draftYear})` : "Non repêché";
}
function TransactionsCenter({ myTeam, teams, myTeamId, staff, scoutKnowledge, onRequestScout, onTrade }) {
  const otherTeams = teams.filter((t) => t.id !== myTeam.id);
  const [partnerId, setPartnerId] = useState(otherTeams[0]?.id);
  const [myIds, setMyIds] = useState([]);
  const [theirIds, setTheirIds] = useState([]);
  const partner = teams.find((t) => t.id === partnerId) || otherTeams[0];

  function toggle(setFn, list, id) { setFn(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]); }
  function changePartner(id) { setPartnerId(id); setMyIds([]); setTheirIds([]); }
  function confirmTrade() { onTrade(partner.id, myIds, theirIds); setMyIds([]); setTheirIds([]); }

  const benchmark = teamOvrBenchmark(myTeam);
  function RosterPicker({ roster, ownerTeamId, selected, onToggle }) {
    return (
      <div style={{ maxHeight: 300, overflow: "auto", border: "1px solid #ffffff1a", borderRadius: 4 }}>
        {roster.map((p) => {
          const scoutInfo = getScoutInfo(p, ownerTeamId, myTeamId, staff, scoutKnowledge);
          return (
            <label key={p.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", fontSize: 13, borderBottom: "1px solid #ffffff11", cursor: "pointer", background: selected.includes(p.id) ? "#ffffff14" : "transparent" }}>
              <input type="checkbox" checked={selected.includes(p.id)} onChange={() => onToggle(p.id)} />
              <span style={{ flex: 1, display: "flex", alignItems: "center", gap: 8 }}>{p.name} <span style={{ color: "var(--iceMuted)" }}>({p.pos})</span>
                {scoutInfo.known ? <StarRating value={starsFor(p.ovr, benchmark)} size={11} color={scoutQualityColor(scoutInfo.quality)} /> : <button onClick={(e) => { e.preventDefault(); onRequestScout(p); }} style={{ ...btnStyle("var(--steel)"), fontSize: 10, padding: "2px 6px" }}>Dépister</button>}
              </span>
            </label>
          );
        })}
      </div>
    );
  }

  return (
    <div>
      <h2 style={h2Style}>Échanges</h2>
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 12, color: "var(--iceMuted)", marginBottom: 6 }}>Équipe partenaire</div>
        <select value={partner?.id} onChange={(e) => changePartner(e.target.value)} style={inputStyle}>
          {otherTeams.map((t) => (<option key={t.id} value={t.id}>{t.name}</option>))}
        </select>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 12, color: "var(--iceMuted)", marginBottom: 6 }}>Tu envoies ({myTeam.name})</div>
          <RosterPicker roster={myTeam.roster} ownerTeamId={myTeam.id} selected={myIds} onToggle={(id) => toggle(setMyIds, myIds, id)} />
        </div>
        <div>
          <div style={{ fontSize: 12, color: "var(--iceMuted)", marginBottom: 6 }}>Tu reçois ({partner?.name})</div>
          {partner && <RosterPicker roster={partner.roster} ownerTeamId={partner.id} selected={theirIds} onToggle={(id) => toggle(setTheirIds, theirIds, id)} />}
        </div>
      </div>
      <button onClick={confirmTrade} disabled={myIds.length === 0 && theirIds.length === 0} style={btnStyle("var(--red)")}>Conclure l'échange</button>
    </div>
  );
}
function FreeAgentsPanel({ myTeam, myTeamId, staff, scoutKnowledge, onRequestScout, freeAgents, onSign, onRefreshFreeAgents }) {
  const [fak, fad, faToggle] = useSort("ovr");
  const faAcc = (p, key) => (key === "draft" ? (p.draftPick || 9999) : p[key]);
  const sortedFreeAgents = sortRows(freeAgents, fak, fad, faAcc);
  const benchmark = teamOvrBenchmark(myTeam);
  return (
    <div>
      <h2 style={h2Style}>Agents libres</h2>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: -8, marginBottom: 12 }}>
        <p style={{ fontSize: 12, color: "var(--iceMuted)" }}>Joueurs sans contrat, disponibles pour négociation.</p>
        <button onClick={onRefreshFreeAgents} style={btnStyle("var(--steel)")}>Rafraîchir le marché</button>
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
        <thead><tr>
          <SortTh label="Joueur" sortKey="name" activeKey={fak} activeDir={fad} onSort={faToggle} />
          <SortTh label="Pos" sortKey="pos" activeKey={fak} activeDir={fad} onSort={faToggle} />
          <SortTh label="Âge" sortKey="age" activeKey={fak} activeDir={fad} onSort={faToggle} />
          <SortTh label="Cote" sortKey="ovr" activeKey={fak} activeDir={fad} onSort={faToggle} />
          <SortTh label="Repêché" sortKey="draft" activeKey={fak} activeDir={fad} onSort={faToggle} />
          <th></th>
        </tr></thead>
        <tbody>
          {sortedFreeAgents.map((p) => {
            const scoutInfo = getScoutInfo(p, null, myTeamId, staff, scoutKnowledge);
            return (
            <tr key={p.id} style={{ borderBottom: "1px solid #ffffff11" }}>
              <td style={{ padding: "7px 10px" }}>{p.name}</td>
              <td style={{ padding: "7px 10px" }}>{p.pos}</td>
              <td style={{ padding: "7px 10px" }}>{p.age}</td>
              <td style={{ padding: "7px 10px" }}>{scoutInfo.known ? <StarRating value={starsFor(p.ovr, benchmark)} size={12} color={scoutQualityColor(scoutInfo.quality)} /> : <button onClick={() => onRequestScout(p)} style={{ ...btnStyle("var(--steel)"), fontSize: 11 }}>Dépister</button>}</td>
              <td style={{ padding: "7px 10px", color: "var(--iceMuted)" }}>{scoutInfo.known ? draftLabel(p) : "?"}</td>
              <td style={{ padding: "7px 10px" }}><button onClick={() => onSign(p)} style={btnStyle("var(--win)")} disabled={!scoutInfo.known}>Offrir un contrat</button></td>
            </tr>
            );
          })}
          {sortedFreeAgents.length === 0 && <tr><td colSpan={6} style={{ padding: 12, color: "var(--iceMuted)" }}>Marché des joueurs autonomes vide.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
function ContractsPanel({ myTeam, onOfferContract }) {
  const [ck, cd, cToggle] = useSort("salary");
  const cAcc = (p, key) => {
    if (key === "salary") return p.contract?.salary || 0;
    if (key === "years") return p.contract?.years || 0;
    return p[key];
  };
  const sorted = sortRows(myTeam.roster, ck, cd, cAcc);
  const totalPayroll = myTeam.roster.reduce((a, p) => a + (p.contract?.salary || 0), 0);
  const benchmark = teamOvrBenchmark(myTeam);
  return (
    <div>
      <h2 style={h2Style}>Contrats de l'équipe</h2>
      <p style={{ fontSize: 12, color: "var(--iceMuted)", marginTop: -8, marginBottom: 6 }}>Masse salariale totale: <strong style={{ color: "var(--ice)" }}>{totalPayroll.toLocaleString()}k$/an</strong></p>
      <p style={{ fontSize: 12, color: "var(--iceMuted)", marginBottom: 14 }}>Clique "Nouveau contrat" pour renégocier avant l'échéance.</p>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
        <thead><tr>
          <SortTh label="Joueur" sortKey="name" activeKey={ck} activeDir={cd} onSort={cToggle} />
          <SortTh label="Pos" sortKey="pos" activeKey={ck} activeDir={cd} onSort={cToggle} />
          <SortTh label="Âge" sortKey="age" activeKey={ck} activeDir={cd} onSort={cToggle} />
          <SortTh label="Étoiles" sortKey="ovr" activeKey={ck} activeDir={cd} onSort={cToggle} />
          <SortTh label="Durée" sortKey="years" activeKey={ck} activeDir={cd} onSort={cToggle} />
          <SortTh label="Salaire" sortKey="salary" activeKey={ck} activeDir={cd} onSort={cToggle} />
          <th></th>
        </tr></thead>
        <tbody>
          {sorted.map((p) => (
            <tr key={p.id} style={{ borderBottom: "1px solid #ffffff11" }}>
              <td style={{ padding: "7px 10px" }}>{p.name}</td>
              <td style={{ padding: "7px 10px" }}>{p.pos}</td>
              <td style={{ padding: "7px 10px" }}>{p.age}</td>
              <td style={{ padding: "7px 10px" }}><StarRating value={starsFor(p.ovr, benchmark)} size={12} /></td>
              <td style={{ padding: "7px 10px" }}>{p.contract ? `${p.contract.years} an${p.contract.years > 1 ? "s" : ""}` : "—"}</td>
              <td style={{ padding: "7px 10px" }}>{p.contract ? `${p.contract.salary.toLocaleString()}k$${p.contract.noTrade ? " · NTC" : ""}` : "—"}</td>
              <td style={{ padding: "7px 10px" }}><button onClick={() => onOfferContract(p)} style={btnStyle("var(--win)")}>Nouveau contrat</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
function FinancesPanel({ business, teamCapacity, onSetTierPrice, onSetParkingPrice, onSetItemPrice, onUpgrade }) {
  const [expanded, setExpanded] = useState(null);
  return (
    <div>
      <h2 style={h2Style}>Finances</h2>
      <div style={{ background: "var(--navy)", border: "1px solid #ffffff22", borderRadius: 4, padding: "14px 20px", display: "inline-block", marginBottom: 24 }}>
        <div style={{ fontSize: 11, color: "var(--iceMuted)" }}>SOLDE DE CAISSE</div>
        <div style={{ fontFamily: "Oswald, sans-serif", fontWeight: 700, fontSize: 26, color: business.cash >= 0 ? "var(--win)" : "var(--loss)" }}>{business.cash.toLocaleString()} $</div>
      </div>

      <h2 style={h2Style}>Billetterie</h2>
      <p style={{ fontSize: 12, color: "var(--iceMuted)", marginTop: -8, marginBottom: 12 }}>Trois sections de l'aréna, chacune avec son propre prix et sa capacité.</p>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, marginBottom: 26 }}>
        <thead><tr>{["Section", "Capacité", "Prix"].map((h, i) => (<th key={i} style={{ textAlign: "left", padding: "6px 10px", color: "var(--iceMuted)", fontWeight: 500, fontSize: 12, borderBottom: "1px solid #ffffff22" }}>{h}</th>))}</tr></thead>
        <tbody>
          {business.ticketTiers.map((t) => (
            <tr key={t.key} style={{ borderBottom: "1px solid #ffffff11" }}>
              <td style={{ padding: "7px 10px" }}>{t.label}</td>
              <td style={{ padding: "7px 10px", color: "var(--iceMuted)" }}>{Math.round(teamCapacity * t.share).toLocaleString()} places</td>
              <td style={{ padding: "7px 10px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, maxWidth: 240 }}>
                  <input type="range" min={5} max={t.basePrice * 3} step={1} value={t.price} onChange={(e) => onSetTierPrice(t.key, Number(e.target.value))} style={{ flex: 1 }} />
                  <span style={{ minWidth: 44 }}>{t.price} $</span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 style={h2Style}>Stationnement</h2>
      <div style={{ background: "var(--navy)", border: "1px solid #ffffff22", borderRadius: 4, padding: "14px 20px", maxWidth: 300, marginBottom: 26 }}>
        <div style={{ fontSize: 11, color: "var(--iceMuted)", marginBottom: 6 }}>Capacité: ~{Math.round(teamCapacity * 0.28).toLocaleString()} places</div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <input type="range" min={0} max={40} step={1} value={business.parking.price} onChange={(e) => onSetParkingPrice(Number(e.target.value))} style={{ flex: 1 }} />
          <span style={{ fontFamily: "Oswald, sans-serif", fontWeight: 600 }}>{business.parking.price} $</span>
        </div>
      </div>

      <h2 style={h2Style}>Prix des concessions</h2>
      <p style={{ fontSize: 12, color: "var(--iceMuted)", marginTop: -8, marginBottom: 12 }}>Monter un prix augmente la marge par unité mais fait chuter le nombre vendu — et vice-versa.</p>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, marginBottom: 26 }}>
        <thead><tr>{["Article", "Prix"].map((h, i) => (<th key={i} style={{ textAlign: "left", padding: "6px 10px", color: "var(--iceMuted)", fontWeight: 500, fontSize: 12, borderBottom: "1px solid #ffffff22" }}>{h}</th>))}</tr></thead>
        <tbody>
          {business.concessionItems.map((item) => (
            <tr key={item.key} style={{ borderBottom: "1px solid #ffffff11" }}>
              <td style={{ padding: "7px 10px" }}>{item.label}</td>
              <td style={{ padding: "7px 10px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, maxWidth: 220 }}>
                  <input type="range" min={1} max={item.basePrice * 3} step={0.5} value={item.price} onChange={(e) => onSetItemPrice(item.key, Number(e.target.value))} style={{ flex: 1 }} />
                  <span style={{ minWidth: 44 }}>{item.price.toFixed(2)} $</span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 style={h2Style}>Installations</h2>
      <p style={{ fontSize: 12, color: "var(--iceMuted)", marginTop: -8, marginBottom: 14 }}>Chaque niveau augmente les ventes ou la capacité — mais aussi les frais d'entretien.</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px,1fr))", gap: 12, marginBottom: 26 }}>
        {Object.keys(business.facilities).map((key) => {
          const level = business.facilities[key];
          const cost = facilityUpgradeCost(level);
          const maxed = level >= 5;
          return (
            <div key={key} style={{ background: "var(--navy)", border: "1px solid #ffffff22", borderRadius: 4, padding: 14 }}>
              <div style={{ fontSize: 13, marginBottom: 6 }}>{FACILITY_LABELS[key]}</div>
              <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
                {[1, 2, 3, 4, 5].map((n) => (<div key={n} style={{ flex: 1, height: 6, borderRadius: 3, background: n <= level ? "var(--win)" : "#ffffff1a" }} />))}
              </div>
              <button onClick={() => onUpgrade(key)} disabled={maxed || business.cash < cost} style={{ ...btnStyle(maxed ? "var(--steel)" : "var(--red)"), width: "100%", justifyContent: "center", fontSize: 12 }}>
                {maxed ? "Niveau maximum" : `Améliorer — ${cost.toLocaleString()} $`}
              </button>
            </div>
          );
        })}
      </div>

      <h2 style={h2Style}>Bilan des matchs locaux</h2>
      <p style={{ fontSize: 12, color: "var(--iceMuted)", marginTop: -8, marginBottom: 12 }}>Seuls tes matchs à domicile (la moitié du calendrier) génèrent des revenus d'aréna. Clique un match pour le détail complet.</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {business.log.map((g, i) => (
          <div key={i}>
            <div onClick={() => setExpanded(expanded === i ? null : i)} style={{ display: "flex", alignItems: "center", gap: 12, background: "var(--navy)", border: "1px solid #ffffff22", borderRadius: 4, padding: "8px 12px", fontSize: 13, cursor: "pointer" }}>
              <span style={{ flex: 1 }}>vs {g.opponent}</span>
              <span style={{ color: "var(--iceMuted)" }}>{g.attendance.toLocaleString()} spect.</span>
              <span style={{ color: "var(--iceMuted)" }}>{g.revenue.toLocaleString()} $ revenus</span>
              <span style={{ color: g.profit >= 0 ? "var(--win)" : "var(--loss)", fontWeight: 600, minWidth: 90, textAlign: "right" }}>{g.profit >= 0 ? "+" : ""}{g.profit.toLocaleString()} $</span>
              {expanded === i ? <ChevronUp size={14} color="var(--iceMuted)" /> : <ChevronDown size={14} color="var(--iceMuted)" />}
            </div>
            {expanded === i && (
              <div style={{ background: "var(--navy2)", border: "1px solid #ffffff1a", borderTop: "none", borderRadius: "0 0 4px 4px", padding: 14, fontSize: 13 }}>
                <div style={{ fontSize: 11, color: "var(--iceMuted)", marginBottom: 6 }}>BILLETTERIE</div>
                {g.tiers.map((t) => (
                  <div key={t.key} style={{ display: "flex", justifyContent: "space-between", padding: "2px 0" }}><span>{t.label} ({t.attendance.toLocaleString()} / {t.capacity.toLocaleString()})</span><span>{t.revenue.toLocaleString()} $</span></div>
                ))}
                <div style={{ fontSize: 11, color: "var(--iceMuted)", margin: "10px 0 6px" }}>CONCESSIONS</div>
                {g.items.map((it) => (
                  <div key={it.key} style={{ display: "flex", justifyContent: "space-between", padding: "2px 0", color: "var(--iceMuted)" }}><span>{it.label} ({it.unitsSold.toLocaleString()} vendus)</span><span>{it.revenue.toLocaleString()} $</span></div>
                ))}
                <div style={{ fontSize: 11, color: "var(--iceMuted)", margin: "10px 0 6px" }}>AUTRES REVENUS</div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "2px 0" }}><span>Stationnement ({g.carsCount.toLocaleString()} / {g.parkingCapacity.toLocaleString()} véhicules)</span><span>{g.parkingRevenue.toLocaleString()} $</span></div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "2px 0", color: "var(--iceMuted)" }}><span>Boutique</span><span>{g.merchRevenue.toLocaleString()} $</span></div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontWeight: 600, borderTop: "1px solid #ffffff1a", marginTop: 4 }}><span>Total revenus</span><span>{g.revenue.toLocaleString()} $</span></div>
                <div style={{ fontSize: 11, color: "var(--iceMuted)", margin: "10px 0 6px" }}>DÉPENSES</div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "2px 0", color: "var(--iceMuted)" }}><span>Masse salariale (part du match)</span><span>{g.payroll.toLocaleString()} $</span></div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "2px 0", color: "var(--iceMuted)" }}><span>Salaires du personnel (part du match)</span><span>{g.staffPayroll.toLocaleString()} $</span></div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "2px 0", color: "var(--iceMuted)" }}><span>Entretien des installations</span><span>{g.maintenance.toLocaleString()} $</span></div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "2px 0", color: "var(--iceMuted)" }}><span>Frais fixes de l'aréna</span><span>{g.arenaBase.toLocaleString()} $</span></div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontWeight: 600, borderTop: "1px solid #ffffff1a", marginTop: 4 }}><span>Total dépenses</span><span>{g.expenses.toLocaleString()} $</span></div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0 0", fontWeight: 700, fontSize: 15, color: g.profit >= 0 ? "var(--win)" : "var(--loss)" }}><span>Profit net</span><span>{g.profit >= 0 ? "+" : ""}{g.profit.toLocaleString()} $</span></div>
              </div>
            )}
          </div>
        ))}
        {business.log.length === 0 && <div style={{ color: "var(--iceMuted)", fontSize: 13 }}>Aucun match local joué encore.</div>}
      </div>
    </div>
  );
}
function StatsTables({ leaders, standings, teamHitTotals, teamAdvancedTotals, teamsById, myTeamId, onSelectPlayer }) {
  const [lk, ld, lToggle] = useSort("pts");
  const [tk, td, tToggle] = useSort("pts");
  const [teamFilter, setTeamFilter] = useState("Toutes");
  const teamOptions = useMemo(() => ["Toutes", ...Object.values(teamsById).map((t) => t.id).sort((a, b) => teamsById[a].name.localeCompare(teamsById[b].name))], [teamsById]);
  const leaderAcc = (s, key) => {
    if (key === "name") return s.player.name;
    if (key === "team") return s.team.name;
    if (key === "gp") return s.gp;
    if (key === "g") return s.g;
    if (key === "a") return s.a;
    if (key === "pts") return s.pts;
    if (key === "hits") return s.hits;
    if (key === "pim") return s.pim;
    if (key === "shots") return s.shots;
    if (key === "plusMinus") return s.plusMinus;
    return 0;
  };
  const filteredLeaders = teamFilter === "Toutes" ? leaders : leaders.filter((s) => s.team.id === teamFilter);
  const sortedLeadersFull = sortRows(filteredLeaders, lk, ld, leaderAcc);
  const sortedLeaders = teamFilter === "Toutes" ? sortedLeadersFull.slice(0, 20) : sortedLeadersFull;
  const teamAcc = (s, key) => {
    if (key === "team") return teamsById[s.id].name;
    if (key === "diff") return s.gf - s.ga;
    if (key === "hits") return teamHitTotals[s.id] || 0;
    if (key === "corsi") return teamAdvancedTotals[s.id]?.corsiFor || 0;
    if (key === "fo") { const t = teamAdvancedTotals[s.id]; return t && t.faceoffTotal ? t.faceoffWins / t.faceoffTotal : 0; }
    return s[key];
  };
  const sortedTeams = sortRows(standings, tk, td, teamAcc);
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <h2 style={{ ...h2Style, marginBottom: 0 }}>Meneurs individuels</h2>
        <select value={teamFilter} onChange={(e) => setTeamFilter(e.target.value)} style={{ ...inputStyle, width: "auto" }}>
          {teamOptions.map((id) => (<option key={id} value={id}>{id === "Toutes" ? "Toutes les équipes (top 20)" : teamsById[id].name}</option>))}
        </select>
      </div>
      <p style={{ fontSize: 12, color: "var(--iceMuted)", marginTop: 6, marginBottom: 12 }}>{teamFilter === "Toutes" ? "Meilleurs pointeurs de la ligue." : `Tous les patineurs de ${teamsById[teamFilter].name} ayant joué.`}</p>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, marginBottom: 30 }}>
        <thead><tr>
          <SortTh label="Joueur" sortKey="name" activeKey={lk} activeDir={ld} onSort={lToggle} />
          <SortTh label="Équipe" sortKey="team" activeKey={lk} activeDir={ld} onSort={lToggle} />
          <SortTh label="PJ" sortKey="gp" activeKey={lk} activeDir={ld} onSort={lToggle} />
          <SortTh label="B" sortKey="g" activeKey={lk} activeDir={ld} onSort={lToggle} />
          <SortTh label="A" sortKey="a" activeKey={lk} activeDir={ld} onSort={lToggle} />
          <SortTh label="PTS" sortKey="pts" activeKey={lk} activeDir={ld} onSort={lToggle} />
          <SortTh label="MEC" sortKey="hits" activeKey={lk} activeDir={ld} onSort={lToggle} />
          <SortTh label="PUN" sortKey="pim" activeKey={lk} activeDir={ld} onSort={lToggle} />
          <SortTh label="Tirs" sortKey="shots" activeKey={lk} activeDir={ld} onSort={lToggle} />
          <SortTh label="+/-" sortKey="plusMinus" activeKey={lk} activeDir={ld} onSort={lToggle} />
        </tr></thead>
        <tbody>
          {sortedLeaders.map((s) => (
            <tr key={s.player.id} onClick={() => onSelectPlayer(s.player, s.team)} style={{ borderBottom: "1px solid #ffffff11", cursor: "pointer" }} onMouseEnter={(e) => (e.currentTarget.style.background = "#ffffff0a")} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
              <td style={{ padding: "7px 10px" }}>{s.player.name}</td>
              <td style={{ padding: "7px 10px", color: s.team.color }}>{s.team.name}</td>
              <td style={{ padding: "7px 10px" }}>{s.gp}</td>
              <td style={{ padding: "7px 10px" }}>{s.g}</td>
              <td style={{ padding: "7px 10px" }}>{s.a}</td>
              <td style={{ padding: "7px 10px" }}><strong>{s.pts}</strong></td>
              <td style={{ padding: "7px 10px" }}>{s.hits}</td>
              <td style={{ padding: "7px 10px" }}>{s.pim}</td>
              <td style={{ padding: "7px 10px" }}>{s.shots}</td>
              <td style={{ padding: "7px 10px", color: s.plusMinus > 0 ? "var(--win)" : s.plusMinus < 0 ? "var(--loss)" : "var(--iceMuted)" }}>{s.plusMinus > 0 ? "+" : ""}{s.plusMinus}</td>
            </tr>
          ))}
          {sortedLeaders.length === 0 && <tr><td colSpan={10} style={{ padding: 12, color: "var(--iceMuted)", fontSize: 13 }}>Aucun match joué encore.</td></tr>}
        </tbody>
      </table>

      <h2 style={h2Style}>Statistiques d'équipe</h2>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
        <thead><tr>
          <SortTh label="Équipe" sortKey="team" activeKey={tk} activeDir={td} onSort={tToggle} />
          <SortTh label="PJ" sortKey="gp" activeKey={tk} activeDir={td} onSort={tToggle} />
          <SortTh label="V" sortKey="w" activeKey={tk} activeDir={td} onSort={tToggle} />
          <SortTh label="D" sortKey="l" activeKey={tk} activeDir={td} onSort={tToggle} />
          <SortTh label="BP" sortKey="gf" activeKey={tk} activeDir={td} onSort={tToggle} />
          <SortTh label="BC" sortKey="ga" activeKey={tk} activeDir={td} onSort={tToggle} />
          <SortTh label="DIFF" sortKey="diff" activeKey={tk} activeDir={td} onSort={tToggle} />
          <SortTh label="MEC" sortKey="hits" activeKey={tk} activeDir={td} onSort={tToggle} />
          <SortTh label="Corsi" sortKey="corsi" activeKey={tk} activeDir={td} onSort={tToggle} />
          <SortTh label="MAJ%" sortKey="fo" activeKey={tk} activeDir={td} onSort={tToggle} />
          <SortTh label="PTS" sortKey="pts" activeKey={tk} activeDir={td} onSort={tToggle} />
        </tr></thead>
        <tbody>
          {sortedTeams.map((s) => (
            <tr key={s.id} style={{ borderBottom: "1px solid #ffffff11" }}>
              <td style={{ padding: "7px 10px", color: s.id === myTeamId ? teamsById[s.id].color : "var(--ice)", fontWeight: s.id === myTeamId ? 600 : 400 }}>{teamsById[s.id].name}</td>
              <td style={{ padding: "7px 10px" }}>{s.gp}</td>
              <td style={{ padding: "7px 10px" }}>{s.w}</td>
              <td style={{ padding: "7px 10px" }}>{s.l}</td>
              <td style={{ padding: "7px 10px" }}>{s.gf}</td>
              <td style={{ padding: "7px 10px" }}>{s.ga}</td>
              <td style={{ padding: "7px 10px" }}>{s.gf - s.ga}</td>
              <td style={{ padding: "7px 10px" }}>{teamHitTotals[s.id] || 0}</td>
              <td style={{ padding: "7px 10px" }}>{teamAdvancedTotals[s.id]?.corsiFor || 0}</td>
              <td style={{ padding: "7px 10px" }}>{teamAdvancedTotals[s.id]?.faceoffTotal ? `${Math.round((teamAdvancedTotals[s.id].faceoffWins / teamAdvancedTotals[s.id].faceoffTotal) * 100)}%` : "—"}</td>
              <td style={{ padding: "7px 10px" }}><strong>{s.pts}</strong></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
function StandingsTable({ standings, teamsById, myTeamId }) {
  const [sk, sd, toggle] = useSort("pts");
  const [divisionFilter, setDivisionFilter] = useState("Toutes");
  const divisions = useMemo(() => ["Toutes", ...Array.from(new Set(Object.values(teamsById).map((t) => t.division))).sort()], [teamsById]);
  const acc = (s, key) => { if (key === "team") return teamsById[s.id].name; if (key === "diff") return s.gf - s.ga; return s[key]; };
  const filtered = divisionFilter === "Toutes" ? standings : standings.filter((s) => teamsById[s.id].division === divisionFilter);
  const sorted = sortRows(filtered, sk, sd, acc);
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <h2 style={{ ...h2Style, marginBottom: 0 }}>Classement</h2>
        <select value={divisionFilter} onChange={(e) => setDivisionFilter(e.target.value)} style={{ ...inputStyle, width: "auto" }}>
          {divisions.map((d) => (<option key={d} value={d}>{d === "Toutes" ? "Toutes les divisions" : d}</option>))}
        </select>
      </div>
      <p style={{ fontSize: 12, color: "var(--iceMuted)", marginTop: 6, marginBottom: 14 }}>{divisionFilter === "Toutes" ? "Classement général de la ligue." : `Division ${divisionFilter}.`}</p>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
        <thead><tr>
          <SortTh label="Équipe" sortKey="team" activeKey={sk} activeDir={sd} onSort={toggle} />
          <SortTh label="PJ" sortKey="gp" activeKey={sk} activeDir={sd} onSort={toggle} />
          <SortTh label="V" sortKey="w" activeKey={sk} activeDir={sd} onSort={toggle} />
          <SortTh label="D" sortKey="l" activeKey={sk} activeDir={sd} onSort={toggle} />
          <SortTh label="DIFF" sortKey="diff" activeKey={sk} activeDir={sd} onSort={toggle} />
          <SortTh label="PTS" sortKey="pts" activeKey={sk} activeDir={sd} onSort={toggle} />
        </tr></thead>
        <tbody>
          {sorted.map((s) => (
            <tr key={s.id} style={{ borderBottom: "1px solid #ffffff11" }}>
              <td style={{ padding: "7px 10px", color: s.id === myTeamId ? teamsById[s.id].color : "var(--ice)", fontWeight: s.id === myTeamId ? 600 : 400 }}>{teamsById[s.id].name}</td>
              <td style={{ padding: "7px 10px" }}>{s.gp}</td>
              <td style={{ padding: "7px 10px" }}>{s.w}</td>
              <td style={{ padding: "7px 10px" }}>{s.l}</td>
              <td style={{ padding: "7px 10px" }}>{s.gf - s.ga}</td>
              <td style={{ padding: "7px 10px" }}><strong>{s.pts}</strong></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
function StaffCard({ role, hired, benchmark, onFire }) {
  return (
    <div style={{ background: "var(--navy)", border: "1px solid #ffffff22", borderRadius: 4, padding: 14 }}>
      <div style={{ fontSize: 11, color: "var(--iceMuted)", marginBottom: 6 }}>{STAFF_ROLES[role].toUpperCase()}</div>
      {hired ? (
        <>
          <div style={{ fontFamily: "Oswald, sans-serif", fontWeight: 600, fontSize: 16, marginBottom: 4 }}>{hired.name}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <StarRating value={starsFor(hired.rating, benchmark)} size={12} />
            <span style={{ background: attr20Color(attr20(hired.rating)), color: "#0B1B2E", fontWeight: 700, fontSize: 11, borderRadius: 3, padding: "1px 7px" }}>{attr20(hired.rating)}</span>
          </div>
          {hired.devSkill != null && (
            <div style={{ fontSize: 11, color: "var(--iceMuted)", marginBottom: 4 }}>Développement: <span style={{ background: attr20Color(attr20(hired.devSkill)), color: "#0B1B2E", fontWeight: 700, fontSize: 10, borderRadius: 3, padding: "1px 6px" }}>{attr20(hired.devSkill)}</span></div>
          )}
          <div style={{ fontSize: 12, color: "var(--iceMuted)", marginBottom: 10 }}>{hired.salary.toLocaleString()}k$/an</div>
          <button onClick={() => onFire(role)} style={{ ...btnStyle("var(--loss)"), width: "100%", justifyContent: "center", fontSize: 12 }}>Congédier</button>
        </>
      ) : (
        <div style={{ fontSize: 13, color: "var(--iceMuted)" }}>Poste vacant</div>
      )}
    </div>
  );
}
const CATEGORY_COLOR = { scout: "#7A4E9E", finance: "var(--win)", transaction: "var(--red)", general: "var(--steel)" };
function InboxPanel({ messages, onMarkRead }) {
  const [openId, setOpenId] = useState(null);
  function toggle(m) {
    setOpenId(openId === m.id ? null : m.id);
    if (!m.read) onMarkRead(m.id);
  }
  const unread = messages.filter((m) => !m.read).length;
  return (
    <div>
      <h2 style={h2Style}>Messagerie {unread > 0 && <span style={{ fontSize: 13, color: "var(--red)", fontWeight: 400 }}>({unread} non lu{unread > 1 ? "s" : ""})</span>}</h2>
      <p style={{ fontSize: 12, color: "var(--iceMuted)", marginTop: -8, marginBottom: 14 }}>Rapports des dépisteurs, bilans financiers et confirmations de transactions arrivent ici.</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {messages.map((m) => (
          <div key={m.id}>
            <div onClick={() => toggle(m)} style={{ display: "flex", alignItems: "center", gap: 10, background: m.read ? "var(--navy)" : "var(--navy2)", border: `1px solid ${m.read ? "#ffffff1a" : CATEGORY_COLOR[m.category] + "66"}`, borderLeft: `4px solid ${CATEGORY_COLOR[m.category] || "var(--steel)"}`, borderRadius: 4, padding: "9px 12px", fontSize: 13, cursor: "pointer" }}>
              {!m.read && <div style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--red)", flexShrink: 0 }} />}
              <span style={{ color: "var(--iceMuted)", minWidth: 150 }}>{m.from}</span>
              <span style={{ flex: 1, fontWeight: m.read ? 400 : 600 }}>{m.subject}</span>
              {openId === m.id ? <ChevronUp size={14} color="var(--iceMuted)" /> : <ChevronDown size={14} color="var(--iceMuted)" />}
            </div>
            {openId === m.id && (
              <div style={{ background: "var(--navy2)", border: "1px solid #ffffff1a", borderTop: "none", borderRadius: "0 0 4px 4px", padding: 14, fontSize: 13, whiteSpace: "pre-wrap", color: "var(--iceMuted)" }}>{m.body}</div>
            )}
          </div>
        ))}
        {messages.length === 0 && <div style={{ color: "var(--iceMuted)", fontSize: 13 }}>Boîte de réception vide pour l'instant.</div>}
      </div>
    </div>
  );
}
function DepthGroup({ title, players, lines, benchmark, showLevel, onSelect, action }) {
  const groups = { C: [], LW: [], RW: [], LD: [], RD: [], G: [] };
  players.forEach((p) => { if (groups[p.pos]) groups[p.pos].push(p); });
  Object.values(groups).forEach((arr) => arr.sort((a, b) => b.ovr - a.ovr));
  const posLabel = { C: "Centres", LW: "Ailiers gauches", RW: "Ailiers droits", LD: "Défenseurs gauches", RD: "Défenseurs droits", G: "Gardiens" };
  return (
    <div style={{ marginBottom: 24 }}>
      <h2 style={h2Style}>{title}</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px,1fr))", gap: 14 }}>
        {["C", "LW", "RW", "LD", "RD", "G"].map((pos) => (
          <div key={pos} style={{ background: "var(--navy)", border: "1px solid #ffffff22", borderRadius: 4, padding: 12 }}>
            <div style={{ fontSize: 11, color: "var(--iceMuted)", marginBottom: 8, letterSpacing: 0.5 }}>{posLabel[pos].toUpperCase()}</div>
            {groups[pos].length === 0 && <div style={{ fontSize: 12, color: "var(--iceMuted)" }}>Aucun</div>}
            {groups[pos].map((p, i) => (
              <div key={p.id} onClick={() => onSelect(p)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 0", borderBottom: i < groups[pos].length - 1 ? "1px solid #ffffff11" : "none", cursor: "pointer" }}>
                <span style={{ fontSize: 11, color: "var(--iceMuted)", width: 14 }}>{i + 1}</span>
                <span style={{ flex: 1, fontSize: 13 }}>{NATION_FLAG[p.nationality] || ""} {p.name}<span style={{ color: "var(--iceMuted)" }}> ({p.age} ans)</span></span>
                <StarRating value={starsFor(p.ovr, benchmark)} size={10} />
                {lines && <span style={{ fontSize: 10, color: "var(--iceMuted)", minWidth: 46, textAlign: "right" }}>{lineLabel(p.id, lines)}</span>}
                {action && <button onClick={(e) => { e.stopPropagation(); action.onClick(p); }} style={{ ...btnStyle(action.color), fontSize: 10, padding: "3px 6px" }}>{action.label}</button>}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
function DepthChartPanel({ team, farm, lines, onSelectPlayer, onCallUp, onSendDown }) {
  const benchmark = teamOvrBenchmark(team);
  const prospects = farm.filter((p) => p.age <= 20);
  const ahl = farm.filter((p) => p.age > 20);
  const select = (p) => onSelectPlayer(p, team);
  return (
    <div>
      <p style={{ fontSize: 12, color: "var(--iceMuted)", marginTop: -8, marginBottom: 16 }}>Vue d'ensemble de l'organisation : ton alignement LNH, ton club-école (LAH) et tes prospects issus du repêchage. Clique un nom pour voir son profil.</p>
      <DepthGroup title="LNH" players={team.roster} lines={lines} benchmark={benchmark} onSelect={select} action={{ label: "Renvoyer", color: "var(--steel)", onClick: onSendDown }} />
      <DepthGroup title="Club-école (LAH)" players={ahl} benchmark={benchmark} onSelect={select} action={{ label: "Rappeler", color: "var(--win)", onClick: onCallUp }} />
      <DepthGroup title="Prospects (repêchage)" players={prospects} benchmark={benchmark} onSelect={select} action={{ label: "Rappeler", color: "var(--win)", onClick: onCallUp }} />
    </div>
  );
}
function StaffCenter({ business, staffMarket, myTeam, month, progressionReport, onHire, onFire, onRefresh, onAdvanceMonth, onSetDelegation }) {
  const [smk, smd, smToggle] = useSort("rating");
  const smAcc = (c, key) => (key === "role" ? STAFF_ROLES[c.role] : c[key]);
  const sortedStaffMarket = sortRows(staffMarket, smk, smd, smAcc);
  const benchmark = teamOvrBenchmark(myTeam);
  return (
    <div>
      <h2 style={h2Style}>Délégation</h2>
      <p style={{ fontSize: 12, color: "var(--iceMuted)", marginTop: -8, marginBottom: 12 }}>Prends le contrôle toi-même ou délègue les décisions à ton directeur (s'il est en poste).</p>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 26 }}>
        <div style={{ background: "var(--navy)", border: "1px solid #ffffff22", borderRadius: 4, padding: 12, flex: 1, minWidth: 220 }}>
          <div style={{ fontSize: 12, marginBottom: 8 }}>Directeur des finances {business.staff.financeDirector ? `(${business.staff.financeDirector.name})` : "(poste vacant)"}</div>
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={() => onSetDelegation("finance", "manual")} style={{ ...btnStyle(business.delegation.finance === "manual" ? "var(--red)" : "var(--steel)"), fontSize: 12, flex: 1, justifyContent: "center" }}>Contrôle</button>
            <button onClick={() => onSetDelegation("finance", "delegated")} style={{ ...btnStyle(business.delegation.finance === "delegated" ? "var(--win)" : "var(--steel)"), fontSize: 12, flex: 1, justifyContent: "center" }}>Délégué</button>
          </div>
        </div>
        <div style={{ background: "var(--navy)", border: "1px solid #ffffff22", borderRadius: 4, padding: 12, flex: 1, minWidth: 220 }}>
          <div style={{ fontSize: 12, marginBottom: 8 }}>Directeur des opérations hockey {business.staff.hockeyOpsDirector ? `(${business.staff.hockeyOpsDirector.name})` : "(poste vacant)"}</div>
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={() => onSetDelegation("hockeyOps", "manual")} style={{ ...btnStyle(business.delegation.hockeyOps === "manual" ? "var(--red)" : "var(--steel)"), fontSize: 12, flex: 1, justifyContent: "center" }}>Contrôle</button>
            <button onClick={() => onSetDelegation("hockeyOps", "delegated")} style={{ ...btnStyle(business.delegation.hockeyOps === "delegated" ? "var(--win)" : "var(--steel)"), fontSize: 12, flex: 1, justifyContent: "center" }}>Délégué</button>
          </div>
        </div>
      </div>
      <p style={{ fontSize: 11, color: "var(--iceMuted)", marginTop: -18, marginBottom: 26 }}>Finances déléguées: le directeur ajuste les prix des billets et investit dans les installations après chaque match local. Opérations hockey déléguées: le directeur comble automatiquement les postes vacants (entraîneurs, adjoints, dépisteurs) à chaque avancement de mois.</p>
      <h2 style={h2Style}>Personnel en poste</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px,1fr))", gap: 12, marginBottom: 28 }}>
        {Object.keys(STAFF_ROLES).map((role) => (<StaffCard key={role} role={role} hired={business.staff[role]} benchmark={benchmark} onFire={onFire} />))}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h2 style={{ ...h2Style, marginBottom: 0 }}>Marché des candidats</h2>
        <button onClick={onRefresh} style={btnStyle("var(--steel)")}>Rafraîchir le marché</button>
      </div>
      <p style={{ fontSize: 12, color: "var(--iceMuted)", marginBottom: 12 }}>Embaucher un candidat remplace automatiquement la personne en poste pour ce rôle.</p>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, marginBottom: 30 }}>
        <thead><tr>
          <SortTh label="Nom" sortKey="name" activeKey={smk} activeDir={smd} onSort={smToggle} />
          <SortTh label="Poste" sortKey="role" activeKey={smk} activeDir={smd} onSort={smToggle} />
          <SortTh label="Cote" sortKey="rating" activeKey={smk} activeDir={smd} onSort={smToggle} />
          <SortTh label="Salaire demandé" sortKey="salary" activeKey={smk} activeDir={smd} onSort={smToggle} />
          <th></th>
        </tr></thead>
        <tbody>
          {sortedStaffMarket.map((c) => (
            <tr key={c.id} style={{ borderBottom: "1px solid #ffffff11" }}>
              <td style={{ padding: "7px 10px" }}>{c.name}</td>
              <td style={{ padding: "7px 10px" }}>{STAFF_ROLES[c.role]}</td>
              <td style={{ padding: "7px 10px" }}><div style={{ display: "flex", alignItems: "center", gap: 8 }}><StarRating value={starsFor(c.rating, benchmark)} size={12} /><span style={{ background: attr20Color(attr20(c.rating)), color: "#0B1B2E", fontWeight: 700, fontSize: 11, borderRadius: 3, padding: "1px 7px" }}>{attr20(c.rating)}</span>{c.devSkill != null && <span style={{ fontSize: 10, color: "var(--iceMuted)" }}>· dév. {attr20(c.devSkill)}</span>}</div></td>
              <td style={{ padding: "7px 10px" }}>{c.salary.toLocaleString()}k$/an</td>
              <td style={{ padding: "7px 10px" }}><button onClick={() => onHire(c)} style={btnStyle("var(--win)")}>Embaucher</button></td>
            </tr>
          ))}
          {sortedStaffMarket.length === 0 && <tr><td colSpan={5} style={{ padding: 12, color: "var(--iceMuted)" }}>Aucun candidat sur le marché.</td></tr>}
        </tbody>
      </table>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <h2 style={{ ...h2Style, marginBottom: 0 }}>Rapport mensuel de progression — Mois {month}</h2>
        <button onClick={onAdvanceMonth} style={btnStyle("var(--red)")}>Avancer au mois suivant</button>
      </div>
      <p style={{ fontSize: 12, color: "var(--iceMuted)", marginBottom: 12 }}>Les jeunes joueurs progressent plus vite vers leur potentiel; les vétérans stagnent ou déclinent. Un bon dépisteur professionnel accélère le développement.</p>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
        <thead><tr>{["Joueur", "Avant", "Après", "Δ"].map((h, i) => (<th key={i} style={{ textAlign: "left", padding: "6px 10px", color: "var(--iceMuted)", fontWeight: 500, fontSize: 12, borderBottom: "1px solid #ffffff22" }}>{h}</th>))}</tr></thead>
        <tbody>
          {progressionReport.map((r) => (
            <tr key={r.id} style={{ borderBottom: "1px solid #ffffff11" }}>
              <td style={{ padding: "7px 10px" }}>{r.name}</td>
              <td style={{ padding: "7px 10px" }}>{r.before}</td>
              <td style={{ padding: "7px 10px" }}>{r.after}</td>
              <td style={{ padding: "7px 10px", color: r.delta >= 0 ? "var(--win)" : "var(--loss)", fontWeight: 600 }}>{r.delta >= 0 ? "+" : ""}{r.delta}</td>
            </tr>
          ))}
          {progressionReport.length === 0 && <tr><td colSpan={4} style={{ padding: 12, color: "var(--iceMuted)" }}>Aucun rapport encore — avance d'un mois pour voir l'évolution de tes joueurs.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
function MentalitySlider({ label, hint, value, onChange }) {
  const tone = value >= 65 ? "var(--red)" : value <= 35 ? "var(--win)" : "#D9A404";
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 2 }}>
        <span>{label}</span>
        <span style={{ color: tone, fontWeight: 600 }}>{value}</span>
      </div>
      <input type="range" min={0} max={100} step={5} value={value} onChange={(e) => onChange(Number(e.target.value))} style={{ width: "100%" }} />
      <div style={{ fontSize: 11, color: "var(--iceMuted)" }}>{hint}</div>
    </div>
  );
}
function StrategyEditor({ team, lines, onChangeStrategy, onChangeMentality, onAutoStrategy }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <h2 style={{ ...h2Style, marginBottom: 0 }}>Système de jeu</h2>
        <button onClick={onAutoStrategy} style={btnStyle("var(--win)")}>Meilleure stratégie automatique</button>
      </div>
      <p style={{ fontSize: 12, color: "var(--iceMuted)", marginTop: 6, marginBottom: 16 }}>Inspiré des approches de coaching NHL: pression en zone offensive, système défensif, entrées et sorties de zone.</p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 26 }}>
        <div>
          <div style={{ fontSize: 12, color: "var(--iceMuted)", marginBottom: 6 }}>Forecheck (pression offensive)</div>
          <select value={lines.strategy.forecheck} onChange={(e) => onChangeStrategy("forecheck", e.target.value)} style={inputStyle}>
            {FORECHECK_OPTIONS.map((o) => (<option key={o.id} value={o.id}>{o.label}</option>))}
          </select>
        </div>
        <div>
          <div style={{ fontSize: 12, color: "var(--iceMuted)", marginBottom: 6 }}>Système défensif</div>
          <select value={lines.strategy.defense} onChange={(e) => onChangeStrategy("defense", e.target.value)} style={inputStyle}>
            {DEFENSE_OPTIONS.map((o) => (<option key={o.id} value={o.id}>{o.label}</option>))}
          </select>
        </div>
        <div>
          <div style={{ fontSize: 12, color: "var(--iceMuted)", marginBottom: 6 }}>Entrée de zone</div>
          <select value={lines.strategy.entry} onChange={(e) => onChangeStrategy("entry", e.target.value)} style={inputStyle}>
            {ENTRY_OPTIONS.map((o) => (<option key={o.id} value={o.id}>{o.label}</option>))}
          </select>
        </div>
        <div>
          <div style={{ fontSize: 12, color: "var(--iceMuted)", marginBottom: 6 }}>Sortie de zone</div>
          <select value={lines.strategy.exit} onChange={(e) => onChangeStrategy("exit", e.target.value)} style={inputStyle}>
            {EXIT_OPTIONS.map((o) => (<option key={o.id} value={o.id}>{o.label}</option>))}
          </select>
        </div>
      </div>

      <h2 style={h2Style}>Mentalité d'équipe</h2>
      <p style={{ fontSize: 12, color: "var(--iceMuted)", marginTop: -8, marginBottom: 14 }}>Curseurs fins façon Eastside Hockey Manager, à ajuster par-dessus ton système de jeu.</p>
      <MentalitySlider label="Agressivité" hint="Plus de contact et de pression, mais plus de punitions." value={lines.mentality.aggression} onChange={(v) => onChangeMentality("aggression", v)} />
      <MentalitySlider label="Pincement des défenseurs" hint="Tes défenseurs se joignent plus à l'attaque — plus offensif, mais plus de contre-attaques adverses." value={lines.mentality.pinch} onChange={(v) => onChangeMentality("pinch", v)} />
      <MentalitySlider label="Discipline" hint="Réduit le taux de punitions, surtout utile avec un style agressif." value={lines.mentality.discipline} onChange={(v) => onChangeMentality("discipline", v)} />
    </div>
  );
}
function StatLines({ title, box, team, lines, onSelectPlayer }) {
  const ids = new Set([...Object.keys(box.goalsBy), ...Object.keys(box.assistsBy), ...Object.keys(box.hitsBy), ...Object.keys(box.pimBy || {}), ...Object.keys(box.shotsBy || {}), ...Object.keys(box.toiBy || {})]);
  const rows = [...ids].map((id) => { const player = team.roster.find((p) => p.id === id); return { player, g: box.goalsBy[id] || 0, a: box.assistsBy[id] || 0, h: box.hitsBy[id] || 0, pim: (box.pimBy || {})[id] || 0, s: (box.shotsBy || {})[id] || 0, pm: (box.plusMinusBy || {})[id] || 0, toi: (box.toiBy || {})[id] }; }).filter((r) => r.player && r.player.pos !== "G").sort((x, y) => (box.toiBy?.[y.player.id] || 0) - (box.toiBy?.[x.player.id] || 0));
  return (
    <div style={{ flex: 1, minWidth: 280 }}>
      <div style={{ fontFamily: "Oswald, sans-serif", fontWeight: 600, fontSize: 14, color: team.color, marginBottom: 8 }}>{title}</div>
      {rows.length === 0 && <div style={{ fontSize: 12, color: "var(--iceMuted)" }}>Aucune statistique notable.</div>}
      <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
        <thead><tr style={{ color: "var(--iceMuted)", fontSize: 11 }}><th style={{ textAlign: "left", padding: "3px 6px" }}>Joueur</th><th style={{ padding: "3px 6px" }}>TMG</th><th style={{ padding: "3px 6px" }}>B</th><th style={{ padding: "3px 6px" }}>A</th><th style={{ padding: "3px 6px" }}>T</th><th style={{ padding: "3px 6px" }}>+/-</th><th style={{ padding: "3px 6px" }}>MEC</th><th style={{ padding: "3px 6px" }}>PUN</th></tr></thead>
        <tbody>
          {rows.map(({ player, g, a, h, pim, s, pm, toi }) => player && (
            <tr key={player.id} onClick={() => onSelectPlayer(player, team)} style={{ cursor: "pointer" }} onMouseEnter={(e) => (e.currentTarget.style.background = "#ffffff0a")} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
              <td style={{ padding: "3px 6px" }}>{player.name}</td><td style={{ padding: "3px 6px", textAlign: "center", color: "var(--iceMuted)" }}>{formatTOI(toi)}</td><td style={{ padding: "3px 6px", textAlign: "center" }}>{g}</td><td style={{ padding: "3px 6px", textAlign: "center" }}>{a}</td><td style={{ padding: "3px 6px", textAlign: "center" }}>{s}</td><td style={{ padding: "3px 6px", textAlign: "center", color: pm > 0 ? "var(--win)" : pm < 0 ? "var(--loss)" : "var(--iceMuted)" }}>{pm > 0 ? "+" : ""}{pm}</td><td style={{ padding: "3px 6px", textAlign: "center" }}>{h}</td><td style={{ padding: "3px 6px", textAlign: "center" }}>{pim}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
function CompareBar({ label, homeVal, awayVal, homeColor, awayColor, homeFormat, awayFormat }) {
  const hFmt = homeFormat || ((v) => v);
  const aFmt = awayFormat || homeFormat || ((v) => v);
  const max = Math.max(homeVal, awayVal, 1);
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 10, color: "var(--iceMuted)", letterSpacing: 0.5, marginBottom: 4, textAlign: "center" }}>{label}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ flex: 1, display: "flex", justifyContent: "flex-end" }}>
          <div style={{ width: `${(homeVal / max) * 100}%`, minWidth: 26, height: 20, background: homeColor, borderRadius: "3px 0 0 3px", display: "flex", alignItems: "center", justifyContent: "flex-end", padding: "0 6px" }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>{hFmt(homeVal)}</span>
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ width: `${(awayVal / max) * 100}%`, minWidth: 26, height: 20, background: awayColor, borderRadius: "0 3px 3px 0", display: "flex", alignItems: "center", padding: "0 6px" }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>{aFmt(awayVal)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
function MatchCompare({ game, home, away }) {
  const { box } = game;
  const pct = (v) => `${v}%`;
  const homeFo = box.home.faceoffsTotal ? Math.round((box.home.faceoffsWon / box.home.faceoffsTotal) * 100) : 0;
  const awayFo = box.away.faceoffsTotal ? Math.round((box.away.faceoffsWon / box.away.faceoffsTotal) * 100) : 0;
  const homeBlocks = Object.values(box.home.blocksBy || {}).reduce((a, v) => a + v, 0);
  const awayBlocks = Object.values(box.away.blocksBy || {}).reduce((a, v) => a + v, 0);
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--iceMuted)", marginBottom: 10 }}>
        <span style={{ color: home.color, fontWeight: 600 }}>{home.name}</span>
        <span style={{ color: away.color, fontWeight: 600 }}>{away.name}</span>
      </div>
      <CompareBar label="BUTS" homeVal={game.homeScore} awayVal={game.awayScore} homeColor={home.color} awayColor={away.color} />
      <CompareBar label="TIRS AU BUT" homeVal={box.home.shots} awayVal={box.away.shots} homeColor={home.color} awayColor={away.color} />
      <CompareBar label="CORSI (TENTATIVES)" homeVal={box.home.corsiFor} awayVal={box.away.corsiFor} homeColor={home.color} awayColor={away.color} />
      <CompareBar label="MISE EN JEU %" homeVal={homeFo} awayVal={awayFo} homeColor={home.color} awayColor={away.color} homeFormat={pct} />
      <CompareBar label="AVANTAGE NUMÉRIQUE" homeVal={box.home.ppGoals} awayVal={box.away.ppGoals} homeColor={home.color} awayColor={away.color} homeFormat={(v) => `${v}/${box.away.penalties}`} awayFormat={(v) => `${v}/${box.home.penalties}`} />
      <CompareBar label="MINUTES DE PUNITION" homeVal={Object.values(box.home.pimBy || {}).reduce((a, v) => a + v, 0)} awayVal={Object.values(box.away.pimBy || {}).reduce((a, v) => a + v, 0)} homeColor={home.color} awayColor={away.color} />
      <CompareBar label="MISES EN ÉCHEC" homeVal={Object.values(box.home.hitsBy || {}).reduce((a, v) => a + v, 0)} awayVal={Object.values(box.away.hitsBy || {}).reduce((a, v) => a + v, 0)} homeColor={home.color} awayColor={away.color} />
      <CompareBar label="TIRS BLOQUÉS" homeVal={homeBlocks} awayVal={awayBlocks} homeColor={home.color} awayColor={away.color} />
    </div>
  );
}
const LIVE_PERIOD_MS = 9000;
const LIVE_TOTAL_MS = LIVE_PERIOD_MS * 3;
function scheduleGoalTimeline(goalLog) {
  const byPeriod = { 1: [], 2: [], 3: [] };
  (goalLog || []).forEach((g) => { if (byPeriod[g.period]) byPeriod[g.period].push(g); });
  const scheduled = [];
  [1, 2, 3].forEach((p) => {
    const list = byPeriod[p];
    list.forEach((g, i) => { scheduled.push({ ...g, t: (p - 1) * LIVE_PERIOD_MS + ((i + 1) / (list.length + 1)) * LIVE_PERIOD_MS }); });
  });
  return scheduled.sort((a, b) => a.t - b.t);
}
function clockDisplay(min) { return `${String(min).padStart(2, "0")}:00`; }
function LiveSimPanel({ liveMatch, myTeamId, linesByTeam, onSelectPlayer, onNextPeriod, onFinish, onGoToLines, onGoToStrategy }) {
  const { home, away, chunk, homeScore, awayScore, accum } = liveMatch;
  const done = chunk > TOTAL_CHUNKS;
  const currentPeriod = Math.min(3, Math.ceil(chunk / CHUNKS_PER_PERIOD));
  const minuteInPeriod = ((chunk - 1) % CHUNKS_PER_PERIOD) * CHUNK_MIN;
  const clockMinute = done ? 20 : minuteInPeriod;
  const homeHits = Object.values(accum.home.hitsBy || {}).reduce((a, v) => a + v, 0);
  const awayHits = Object.values(accum.away.hitsBy || {}).reduce((a, v) => a + v, 0);
  return (
    <div style={{ background: "var(--navy2)", border: `1px solid ${done ? "var(--win)" : "#D9A404"}66`, borderRadius: 6, padding: 16, marginBottom: 22 }}>
      <div style={{ fontFamily: "Oswald, sans-serif", fontWeight: 600, fontSize: 14, marginBottom: 10, color: "#D9A404" }}>SIMULATION EN DIRECT</div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 10 }}>
        <div style={{ textAlign: "center" }}><TeamCrest team={home} size={34} /><div style={{ fontSize: 11, marginTop: 3 }}>{home.name}</div></div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontFamily: "Oswald, sans-serif", fontWeight: 700, fontSize: 28 }}>{homeScore} – {awayScore}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "center", marginTop: 2 }}>
            <span style={{ fontSize: 11, color: "var(--iceMuted)" }}>{done ? "FINAL" : `${currentPeriod}e période`}</span>
            <span style={{ fontFamily: "Oswald, sans-serif", fontWeight: 700, fontSize: 15, background: "#000", color: "#0f0", padding: "1px 8px", borderRadius: 3, letterSpacing: 1 }}>{clockDisplay(clockMinute)}</span>
          </div>
        </div>
        <div style={{ textAlign: "center" }}><TeamCrest team={away} size={34} /><div style={{ fontSize: 11, marginTop: 3 }}>{away.name}</div></div>
        <div style={{ flex: 1, minWidth: 160 }}>
          <div style={{ display: "flex", gap: 3, marginBottom: 6 }}>
            {Array.from({ length: TOTAL_CHUNKS }, (_, i) => i + 1).map((c) => (<div key={c} style={{ flex: 1, height: 5, borderRadius: 2, background: c < chunk ? "var(--win)" : c === chunk ? "#D9A404" : "#ffffff1a" }} />))}
          </div>
          <div style={{ fontSize: 11, color: "var(--iceMuted)" }}>Tirs {accum.home.shots || 0}–{accum.away.shots || 0} · MEC {homeHits}–{awayHits} · Pun. {accum.home.penalties || 0}–{accum.away.penalties || 0}</div>
        </div>
      </div>
      {!done ? (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 16 }}>
          <button onClick={onNextPeriod} style={btnStyle("var(--red)")}>Simuler 5 minutes</button>
          <button onClick={onGoToLines} style={btnStyle("var(--steel)")}>Ajuster les trios</button>
          <button onClick={onGoToStrategy} style={btnStyle("var(--steel)")}>Ajuster la stratégie</button>
          <span style={{ fontSize: 11, color: "var(--iceMuted)" }}>Tes changements s'appliquent aux 5 prochaines minutes.</span>
        </div>
      ) : (
        <button onClick={onFinish} style={{ ...btnStyle("var(--win)"), marginBottom: 16 }}>Confirmer le résultat final</button>
      )}
      <GoalSummary goalLog={accum.goalLog} home={home} away={away} />
      <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
        <StatLines title={`${home.name} (dom.)`} box={accum.home} team={home} lines={linesByTeam[home.id]} onSelectPlayer={onSelectPlayer} />
        <StatLines title={`${away.name} (visit.)`} box={accum.away} team={away} lines={linesByTeam[away.id]} onSelectPlayer={onSelectPlayer} />
      </div>
    </div>
  );
}
function LiveMatchViewer({ game, home, away, onClose }) {
  const scheduled = useMemo(() => scheduleGoalTimeline(game.box.goalLog), [game]);
  const [elapsed, setElapsed] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [revealedCount, setRevealedCount] = useState(0);
  const [flash, setFlash] = useState(null);

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => { setElapsed((prev) => Math.min(LIVE_TOTAL_MS, prev + 150 * speed)); }, 150);
    return () => clearInterval(id);
  }, [playing, speed]);

  useEffect(() => {
    let count = 0;
    scheduled.forEach((g) => { if (g.t <= elapsed) count++; });
    if (count > revealedCount) { setFlash(scheduled[count - 1]); const t = setTimeout(() => setFlash(null), 1700); }
    if (count !== revealedCount) setRevealedCount(count);
    if (elapsed >= LIVE_TOTAL_MS) setPlaying(false);
  }, [elapsed]);

  const revealed = scheduled.slice(0, revealedCount);
  const liveHomeScore = revealed.filter((g) => g.side === "home").length;
  const liveAwayScore = revealed.filter((g) => g.side === "away").length;
  const finished = elapsed >= LIVE_TOTAL_MS;
  const dHome = finished ? game.homeScore : liveHomeScore;
  const dAway = finished ? game.awayScore : liveAwayScore;
  const period = Math.min(3, Math.floor(elapsed / LIVE_PERIOD_MS) + 1);
  const puckX = 50 + 40 * Math.sin(elapsed / 900);

  function skipToEnd() { setElapsed(LIVE_TOTAL_MS); setPlaying(false); }
  function restart() { setElapsed(0); setRevealedCount(0); setFlash(null); setPlaying(true); }

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "#000000cc", zIndex: 70, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "var(--navy2)", border: "1px solid #ffffff33", borderRadius: 6, width: 520, maxWidth: "95vw", maxHeight: "92vh", overflow: "auto", padding: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ fontFamily: "Oswald, sans-serif", fontWeight: 600, fontSize: 16 }}>Match en direct</div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--iceMuted)", cursor: "pointer" }}><X size={18} /></button>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ textAlign: "center", flex: 1 }}><TeamCrest team={home} size={40} /><div style={{ fontSize: 12, marginTop: 4 }}>{home.name}</div></div>
          <div style={{ textAlign: "center", padding: "0 14px" }}>
            <div style={{ fontFamily: "Oswald, sans-serif", fontWeight: 700, fontSize: 34 }}>{dHome} – {dAway}</div>
            <div style={{ fontSize: 11, color: "var(--iceMuted)" }}>{finished ? "FINAL" : `${period}e période`}</div>
          </div>
          <div style={{ textAlign: "center", flex: 1 }}><TeamCrest team={away} size={40} /><div style={{ fontSize: 12, marginTop: 4 }}>{away.name}</div></div>
        </div>
        <div style={{ position: "relative", height: 150, background: "linear-gradient(180deg,#cfe8f5,#a9d4e8)", borderRadius: 6, overflow: "hidden", marginBottom: 12, border: "2px solid #ffffff33" }}>
          <div style={{ position: "absolute", left: "50%", top: 0, bottom: 0, width: 2, background: "#c8102e88" }} />
          <div style={{ position: "absolute", left: "12%", top: 0, bottom: 0, width: 2, background: "#1e5f8c55" }} />
          <div style={{ position: "absolute", left: "88%", top: 0, bottom: 0, width: 2, background: "#1e5f8c55" }} />
          <div style={{ position: "absolute", left: "50%", top: "50%", width: 36, height: 36, marginLeft: -18, marginTop: -18, borderRadius: "50%", border: "2px solid #c8102e66" }} />
          <div style={{ position: "absolute", left: 6, top: "50%", marginTop: -10, width: 6, height: 20, background: home.color, borderRadius: 2 }} />
          <div style={{ position: "absolute", right: 6, top: "50%", marginTop: -10, width: 6, height: 20, background: away.color, borderRadius: 2 }} />
          <div style={{ position: "absolute", left: `${puckX}%`, top: "50%", width: 10, height: 10, marginLeft: -5, marginTop: -5, borderRadius: "50%", background: "#111", boxShadow: "0 0 6px #000", transition: "left 0.15s linear" }} />
          {flash && (
            <div style={{ position: "absolute", inset: 0, background: (flash.side === "home" ? home.color : away.color) + "33", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ background: "#00000099", padding: "8px 16px", borderRadius: 6, textAlign: "center" }}>
                <div style={{ fontFamily: "Oswald, sans-serif", fontWeight: 700, fontSize: 20, color: "#fff" }}>BUT!</div>
                <div style={{ fontSize: 12, color: "#fff" }}>{(() => { const team = flash.side === "home" ? home : away; return team.roster.find((p) => p.id === flash.scorerId)?.name || "?"; })()}</div>
              </div>
            </div>
          )}
        </div>
        <div style={{ height: 5, background: "#ffffff22", borderRadius: 3, marginBottom: 14, position: "relative" }}>
          <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${(elapsed / LIVE_TOTAL_MS) * 100}%`, background: "var(--red)", borderRadius: 3 }} />
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 16, flexWrap: "wrap" }}>
          <button onClick={() => setPlaying((p) => !p)} style={btnStyle("var(--red)")}>{playing ? "Pause" : finished ? "Revoir" : "Reprendre"}</button>
          {finished && <button onClick={restart} style={btnStyle("var(--steel)")}>Recommencer</button>}
          {!finished && <button onClick={skipToEnd} style={btnStyle("var(--steel)")}>Passer à la fin</button>}
          <div style={{ display: "flex", gap: 4, marginLeft: "auto" }}>
            {[0.5, 1, 2, 4].map((s) => (<button key={s} onClick={() => setSpeed(s)} style={{ ...btnStyle(speed === s ? "var(--win)" : "var(--steel)"), fontSize: 11, padding: "5px 8px" }}>{s}x</button>))}
          </div>
        </div>
        <div style={{ fontSize: 11, color: "var(--iceMuted)", marginBottom: 6 }}>SOMMAIRE EN DIRECT</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4, maxHeight: 160, overflow: "auto" }}>
          {revealed.length === 0 && <div style={{ fontSize: 12, color: "var(--iceMuted)" }}>Aucun but pour l'instant...</div>}
          {[...revealed].reverse().map((g, i) => {
            const team = g.side === "home" ? home : away;
            const scorer = team.roster.find((p) => p.id === g.scorerId);
            const assists = g.assistIds.map((id) => team.roster.find((p) => p.id === id)?.name).filter(Boolean);
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, padding: "3px 0" }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: team.color }} />
                <span style={{ fontSize: 11, color: "var(--iceMuted)", width: 24 }}>P{g.period}</span>
                <span style={{ flex: 1 }}>{scorer?.name || "?"} {assists.length > 0 && <span style={{ color: "var(--iceMuted)" }}>({assists.join(", ")})</span>}</span>
                {g.type === "PP" && <span style={{ fontSize: 10, background: "#D9A40433", color: "#D9A404", padding: "1px 6px", borderRadius: 3 }}>AN</span>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
function GoalSummary({ goalLog, home, away }) {
  if (!goalLog || goalLog.length === 0) return <div style={{ fontSize: 12, color: "var(--iceMuted)", marginBottom: 14 }}>Aucun but.</div>;
  const periods = [1, 2, 3];
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 11, color: "var(--iceMuted)", marginBottom: 8, letterSpacing: 0.5 }}>SOMMAIRE DES BUTS</div>
      {periods.map((p) => {
        const goals = goalLog.filter((g) => g.period === p);
        if (goals.length === 0) return null;
        return (
          <div key={p} style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 11, color: "var(--iceMuted)", background: "#ffffff0a", padding: "3px 8px", borderRadius: 3, marginBottom: 6, display: "inline-block" }}>{p}RE PÉRIODE</div>
            {goals.map((g, i) => {
              const team = g.side === "home" ? home : away;
              const scorer = team.roster.find((pl) => pl.id === g.scorerId);
              const assists = g.assistIds.map((id) => team.roster.find((pl) => pl.id === id)?.name).filter(Boolean);
              return (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0", fontSize: 13 }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: team.color, flexShrink: 0 }} />
                  <span style={{ flex: 1 }}>{scorer?.name || "?"} {assists.length > 0 && <span style={{ color: "var(--iceMuted)" }}>({assists.join(", ")})</span>}</span>
                  {g.type === "PP" && <span style={{ fontSize: 10, background: "#D9A40433", color: "#D9A404", padding: "1px 6px", borderRadius: 3 }}>AN</span>}
                  <span style={{ fontSize: 11, color: "var(--iceMuted)" }}>{team.name}</span>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
function BoxscoreView({ game, teamsById, linesByTeam, onSelectPlayer }) {
  const home = teamsById[game.home], away = teamsById[game.away];
  const { box } = game;
  return (
    <div style={{ background: "var(--navy)", border: "1px solid #ffffff22", borderRadius: 4, padding: 16, marginTop: 6, marginBottom: 10 }}>
      <MatchCompare game={game} home={home} away={away} />
      <GoalSummary goalLog={box.goalLog} home={home} away={away} />
      <div style={{ display: "flex", gap: 20, flexWrap: "wrap", marginBottom: 14 }}>
        <StatLines title={`${home.name} (dom.)`} box={box.home} team={home} lines={linesByTeam[home.id]} onSelectPlayer={onSelectPlayer} />
        <StatLines title={`${away.name} (visit.)`} box={box.away} team={away} lines={linesByTeam[away.id]} onSelectPlayer={onSelectPlayer} />
      </div>
      <div style={{ display: "flex", gap: 24, fontSize: 12, color: "var(--iceMuted)", borderTop: "1px solid #ffffff1a", paddingTop: 10, flexWrap: "wrap" }}>
        <span>Gardien {home.name}: {box.homeGoalie.saves}/{box.homeGoalie.shotsAgainst} arrêts</span>
        <span>Gardien {away.name}: {box.awayGoalie.saves}/{box.awayGoalie.shotsAgainst} arrêts</span>
      </div>
    </div>
  );
}

// ---------- APP ----------
export default function HockeyGM() {
  const [initial] = useState(initLeague);
  const [teams, setTeams] = useState(initial.teams);
  const [freeAgents, setFreeAgents] = useState(initial.freeAgents);
  const [staffMarket, setStaffMarket] = useState(initial.staffMarket);
  const [scoutKnowledge, setScoutKnowledge] = useState({});
  const [farmByTeam, setFarmByTeam] = useState(initial.farmByTeam);
  const [month, setMonth] = useState(1);
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
  function selectPlayer(player, team) { setSelectedPlayer({ player, team }); }
  function openCreatePlayer() {
    setSelectedPlayer(null);
    setEditingPlayer({ isNew: true, initial: { id: `${myTeamId}-new-${Date.now()}`, name: "", pos: "C", age: 20, attrs: emptyAttrs("C", 60), potential: 60 } });
  }
  function openEditPlayer(player) { setSelectedPlayer(null); setEditingPlayer({ isNew: false, initial: player }); }
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
    const fresh = buildLines(teamsById[myTeamId].roster);
    setLinesByTeam((prev) => ({ ...prev, [myTeamId]: { ...prev[myTeamId], forwards: fresh.forwards, defense: fresh.defense, goalies: fresh.goalies } }));
  }
  function autoOptimizeSpecialTeams() {
    const fresh = buildLines(teamsById[myTeamId].roster);
    setLinesByTeam((prev) => ({ ...prev, [myTeamId]: { ...prev[myTeamId], pp: fresh.pp, pk: fresh.pk } }));
  }
  function autoOptimizeStrategy() {
    const team = teamsById[myTeamId];
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
    addMessage({ from: "Directeur général adjoint", subject: `Échange conclu avec ${theirTeamName}`, category: "transaction", body });
  }
  function openOffer(player, isRenewal = false) {
    setSelectedPlayer(null);
    setOfferTarget({ player, isRenewal });
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
      addMessage({ from: "Agent du joueur", subject: `${player.name} a accepté l'offre`, category: "transaction", body: `${offerSummary}\n\n${player.name} a signé.` });
    } else {
      addMessage({ from: "Agent du joueur", subject: `${player.name} a refusé l'offre`, category: "transaction", body: `${offerSummary}\n\nL'agent estime la valeur du joueur plus proche de ${result.expSalary.toLocaleString()}k$/an sur ${result.expYears} an${result.expYears > 1 ? "s" : ""}. Reviens avec une meilleure offre.` });
    }
    setOfferTarget(null);
  }
  function refreshFreeAgents() {
    setFreeAgents(buildFreeAgentPoolRT(16, business.staff.scoutAmateur?.rating));
  }
  function requestScouting(player) {
    const useAmateur = player.age <= 20;
    const scout = useAmateur ? business.staff.scoutAmateur : business.staff.scoutPro;
    const quality = scout ? scout.rating : 40;
    const scoutName = scout ? scout.name : "Personnel interne (aucun dépisteur dédié)";
    setScoutKnowledge((prev) => ({ ...prev, [player.id]: { known: true, month, scoutName, quality } }));
    addMessage({ from: scoutName, subject: `Rapport de dépistage: ${player.name}`, category: "scout", body: `Cote et attributs de ${player.name} maintenant connus (qualité d'évaluation: ${attr20(quality)}/20).` });
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
    addMessage({ from: "Directeur du club-école", subject: `Rappel: ${player.name}`, category: "transaction", body: `${player.name} (${player.pos}, cote ${player.ovr}) est rappelé du club-école vers l'équipe.` });
  }
  function sendDownPlayer(player) {
    setTeams((prev) => prev.map((t) => (t.id !== myTeamId ? t : { ...t, roster: t.roster.filter((p) => p.id !== player.id) })));
    setLinesByTeam((prev) => ({ ...prev, [myTeamId]: cleanLinesOfPlayer(prev[myTeamId], player.id) }));
    setFarmByTeam((prev) => ({ ...prev, [myTeamId]: [...(prev[myTeamId] || []), { ...player, level: "LAH" }] }));
    addMessage({ from: "Directeur du club-école", subject: `Rétrogradé: ${player.name}`, category: "transaction", body: `${player.name} est renvoyé au club-école.` });
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
    addMessage({ from: coachName, subject: `Rapport de développement — Mois ${month}`, category: "scout", body });

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

  const myTeam = teamsById[myTeamId];
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
      {selectedPlayer && <PlayerModal player={selectedPlayer.player} team={selectedPlayer.team} lines={linesByTeam[selectedPlayer.team.id]} editable={selectedPlayer.team.id === myTeamId} seasonStats={seasonStats} staff={business.staff} myTeamId={myTeamId} scoutKnowledge={scoutKnowledge} onRequestScout={requestScouting} onClose={() => setSelectedPlayer(null)} onEdit={openEditPlayer} onOfferContract={(p) => openOffer(p, true)} />}
      {offerTarget && <ContractOfferModal player={offerTarget.player} isRenewal={offerTarget.isRenewal} team={myTeam} onClose={() => setOfferTarget(null)} onSubmit={submitOffer} />}
      {watchingGame && <LiveMatchViewer game={watchingGame} home={teamsById[watchingGame.home]} away={teamsById[watchingGame.away]} onClose={() => setWatchingGame(null)} />}
      {editingPlayer && <PlayerEditorModal initial={editingPlayer.initial} isNew={editingPlayer.isNew} team={myTeam} onSave={savePlayer} onClose={() => setEditingPlayer(null)} />}
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
        <div style={{ marginTop: "auto", padding: "0 8px", fontSize: 11, color: "var(--iceMuted)" }}>Rang: <span style={{ color: "var(--ice)" }}>{myRank}e</span> · {myStanding?.pts ?? 0} pts</div>
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

        {tab === "depth" && <DepthChartPanel team={myTeam} farm={farmByTeam[myTeamId] || []} lines={myLines} onSelectPlayer={selectPlayer} onCallUp={callUpPlayer} onSendDown={sendDownPlayer} />}

        {tab === "strategy" && <StrategyEditor team={myTeam} lines={myLines} onChangeStrategy={updateStrategy} onChangeMentality={updateMentality} onAutoStrategy={autoOptimizeStrategy} />}

        {tab === "transactions" && <TransactionsCenter myTeam={myTeam} teams={teams} myTeamId={myTeamId} staff={business.staff} scoutKnowledge={scoutKnowledge} onRequestScout={requestScouting} onTrade={executeTrade} />}

        {tab === "freeagents" && <FreeAgentsPanel myTeam={myTeam} myTeamId={myTeamId} staff={business.staff} scoutKnowledge={scoutKnowledge} onRequestScout={requestScouting} freeAgents={freeAgents} onSign={(p) => openOffer(p, false)} onRefreshFreeAgents={refreshFreeAgents} />}

        {tab === "contracts" && <ContractsPanel myTeam={myTeam} onOfferContract={(p) => openOffer(p, true)} />}

        {tab === "staff" && <StaffCenter business={business} staffMarket={staffMarket} myTeam={myTeam} month={month} progressionReport={progressionReport} onHire={hireStaff} onFire={fireStaff} onRefresh={refreshStaffMarket} onAdvanceMonth={advanceMonth} onSetDelegation={setDelegation} />}

        {tab === "inbox" && <InboxPanel messages={messages} onMarkRead={markRead} />}

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
