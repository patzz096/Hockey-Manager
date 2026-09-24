export const ARENA_CAPACITY = 5000;

export const DEFAULT_FACILITIES = { concessions: 1, boutique: 1, parking: 1, marketing: 1 };

export const FACILITY_LABELS = { concessions: "Concessions (cuisine)", boutique: "Boutique / marchandise", parking: "Stationnement (capacité)", marketing: "Marketing / publicité" };

export const DEFAULT_TICKET_TIERS = [
  { key: "general", label: "Général", price: 28, basePrice: 28, share: 0.75 },
  { key: "passerelle", label: "Passerelle (mezzanine)", price: 45, basePrice: 45, share: 0.15 },
  { key: "loge", label: "Loges privées", price: 85, basePrice: 85, share: 0.10 },
];

export const DEFAULT_CONCESSION_ITEMS = [
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

export const DEFAULT_PARKING = { price: 12, basePrice: 12, rate: 0.35 };

// Marchandise (boutique) : chandails, casquettes... vendus les soirs de match, comme les
// concessions (même mécanique de prix/élasticité), en plus du multiplicateur du niveau de la
// boutique et de la note d'engagement des partisans (plus les partisans sont engagés, plus ils achètent).
export const DEFAULT_MERCH_ITEMS = [
  { key: "jersey", label: "Chandail", price: 180, basePrice: 180, avgPerFan: 0.035 },
  { key: "casquette", label: "Casquette", price: 32, basePrice: 32, avgPerFan: 0.07 },
  { key: "tshirt", label: "T-shirt", price: 38, basePrice: 38, avgPerFan: 0.06 },
  { key: "souvenir", label: "Mini-bâton / rondelle souvenir", price: 15, basePrice: 15, avgPerFan: 0.05 },
];

export function facilityUpgradeCost(level) { return 4000 + level * 3500; }

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// ------------------------------- Notes (expérience client / engagement des partisans) -------------------------------
// Expérience client (0-100) : instantanée, calculée directement des prix et des installations —
// pas d'historique à suivre. Des prix raisonnables (proches du prix de base) et de bonnes
// installations font une bonne expérience ; les gonfler la dégrade vite.
export function customerExperienceScore(business, winPct = 0.5) {
  const priceFairness = (items) => {
    if (!items.length) return 1;
    const ratios = items.map((i) => i.price / i.basePrice);
    const avg = ratios.reduce((a, r) => a + r, 0) / ratios.length;
    return clamp(1.6 - avg * 0.8, 0, 1); // 1 au prix de base, chute si les prix montent
  };
  const ticketScore = priceFairness(business.ticketTiers);
  const concessionScore = priceFairness(business.concessionItems);
  const merchScore = priceFairness(business.merchItems || DEFAULT_MERCH_ITEMS);
  const facilityScore = Object.values(business.facilities).reduce((a, l) => a + l, 0) / (Object.keys(business.facilities).length * 5);
  const winScore = clamp(0.3 + winPct * 0.7, 0, 1);
  const score = (ticketScore * 0.3 + concessionScore * 0.2 + merchScore * 0.15 + facilityScore * 0.2 + winScore * 0.15) * 100;
  return Math.round(clamp(score, 0, 100));
}
export function experienceLabel(score) { return score >= 80 ? "Excellente" : score >= 60 ? "Bonne" : score >= 40 ? "Moyenne" : score >= 20 ? "Décevante" : "Mauvaise"; }
export function experienceColor(score) { return score >= 80 ? "var(--win)" : score >= 60 ? "#7FD6A0" : score >= 40 ? "var(--gold)" : score >= 20 ? "#F59A4A" : "var(--loss)"; }

// Engagement des partisans (0-100, se déplace lentement d'un mois à l'autre, voir App.jsx
// monthlyTick) : monte avec une bonne affluence, les victoires et l'investissement marketing
// (installations + directeur des communications), descend sinon. Détermine la demande de
// marchandise et le prochain contrat de diffusion (voir tvDealValue).
export const DEFAULT_ENGAGEMENT = 50;
export function engagementDelta(utilization, winPct, marketingLevel = 1, broadcastRating = null) {
  const attendanceEffect = (clamp(utilization, 0, 1) - 0.6) * 12;
  const perfEffect = (clamp(winPct, 0, 1) - 0.5) * 10;
  const promoEffect = (marketingLevel - 1) * 1.2 + (broadcastRating == null ? 0 : ((clamp(broadcastRating, 20, 99) - 50) / 50) * 2.5);
  return attendanceEffect + perfEffect + promoEffect;
}
export function applyEngagementDelta(engagement, utilization, winPct, marketingLevel = 1, broadcastRating = null) {
  return Math.round(clamp((engagement ?? DEFAULT_ENGAGEMENT) + engagementDelta(utilization, winPct, marketingLevel, broadcastRating), 0, 100));
}
export function engagementLabel(score) { return score >= 80 ? "Ferveur" : score >= 60 ? "Engagés" : score >= 40 ? "Tièdes" : score >= 20 ? "Distants" : "Désintéressés"; }
export function engagementColor(score) { return score >= 80 ? "var(--win)" : score >= 60 ? "#7FD6A0" : score >= 40 ? "var(--gold)" : score >= 20 ? "#F59A4A" : "var(--loss)"; }

// ------------------------------- Contrat de diffusion télé -------------------------------
// Revenu fixe par saison (payé par match local, comme le reste), renégocié tous les
// TV_DEAL_TERM ans (voir App.jsx startNewSeason) selon l'engagement des partisans et le dossier
// de l'équipe — une équipe populaire et gagnante décroche un bien meilleur contrat.
export const TV_DEAL_BASE = 1_800_000;
export const TV_DEAL_TERM = 4;
export function tvDealValue(engagement, winPct, broadcastRating = null) {
  const engagementMult = 0.5 + clamp(engagement, 0, 100) / 100; // 0.5..1.5
  const perfMult = 0.7 + clamp(winPct, 0, 1) * 0.6; // 0.7..1.3
  const negoMult = broadcastRating == null ? 1 : 1 + ((clamp(broadcastRating, 20, 99) - 50) / 50) * 0.15; // ±15 %
  return Math.round((TV_DEAL_BASE * engagementMult * perfMult * negoMult) / 1000) * 1000;
}
export function negotiateTvDeal(engagement, winPct, signedYear, broadcastRating = null) {
  return { value: tvDealValue(engagement, winPct, broadcastRating), years: TV_DEAL_TERM, signedYear };
}

export function autoTuneFinances(biz, lastFin) {
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

export function priceElasticity(price, basePrice) { return Math.max(0.4, Math.min(1.4, 1.3 - (price / basePrice - 1) * 0.6)); }

// extraPayroll : salaires versés hors alignement (rachats, salaires retenus), en k$ par saison.
export function computeGameFinance(team, business, winPct, extraPayroll = 0) {
  const broadcastRating = business.staff?.broadcastDirector?.rating;
  const broadcastBoost = broadcastRating == null ? 0 : ((clamp(broadcastRating, 20, 99) - 50) / 50) * 0.02;
  const marketingBoost = business.facilities.marketing * 0.03 + broadcastBoost;
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

  // Marchandise : même mécanique que les concessions, avec le niveau de la boutique et
  // l'engagement des partisans (plus engagés, plus ils achètent) en multiplicateurs.
  const merchLevelMult = 1 + (business.facilities.boutique - 1) * 0.15;
  const engagementMult = 0.55 + clamp(business.fanEngagement ?? DEFAULT_ENGAGEMENT, 0, 100) / 100 * 0.9; // 0.55..1.45
  const merch = (business.merchItems || DEFAULT_MERCH_ITEMS).map((item) => {
    const elastic = priceElasticity(item.price, item.basePrice);
    const unitsSold = Math.max(0, Math.round(attendance * item.avgPerFan * elastic * merchLevelMult * engagementMult));
    const revenue = Math.round(unitsSold * item.price);
    return { key: item.key, label: item.label, price: item.price, unitsSold, revenue };
  });
  const merchRevenue = merch.reduce((a, i) => a + i.revenue, 0);

  // Contrat de diffusion : revenu fixe par saison, versé au prorata de chaque match local
  // (voir TV_DEAL_TERM/negotiateTvDeal — renégocié en saison morte selon l'engagement et le dossier).
  const tvRevenue = Math.round((business.tvDeal?.value || 0) / 56);

  const revenue = ticketRevenue + concessionsRevenue + parkingRevenue + merchRevenue + tvRevenue;
  const payroll = Math.round(((team.roster.reduce((a, p) => a + (p.contract?.salary || 0), 0) + extraPayroll) * 1000) / 56);
  // Personnel, plus les dépisteurs engagés en renfort (onglet Dépistage).
  const staffPayroll = Math.round(([...Object.values(business.staff || {}), ...(business.scoutTeam || [])].reduce((a, s) => a + (s?.salary || 0), 0) * 1000) / 56);
  const maintenance = Object.values(business.facilities).reduce((a, l) => a + l * 250, 0);
  const arenaBase = 3500;
  const expenses = payroll + staffPayroll + maintenance + arenaBase;
  const profit = revenue - expenses;
  return { attendance, tiers, ticketRevenue, items, concessionsRevenue, carsCount, parkingCapacity, parkingRevenue, merch, merchRevenue, tvRevenue, revenue, payroll, staffPayroll, maintenance, arenaBase, expenses, profit };
}
