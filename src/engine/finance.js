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

export function facilityUpgradeCost(level) { return 4000 + level * 3500; }

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

export function computeGameFinance(team, business, winPct) {
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
