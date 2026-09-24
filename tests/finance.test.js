// Volet finances étendu : marchandise itemisée, contrat de diffusion, notes d'expérience client
// et d'engagement des partisans (engine/finance.js).
import { describe, it, expect } from "vitest";
import {
  DEFAULT_FACILITIES, DEFAULT_TICKET_TIERS, DEFAULT_CONCESSION_ITEMS, DEFAULT_PARKING, DEFAULT_MERCH_ITEMS,
  DEFAULT_ENGAGEMENT, computeGameFinance, customerExperienceScore, engagementDelta, applyEngagementDelta,
  tvDealValue, negotiateTvDeal, TV_DEAL_TERM,
} from "../src/engine/finance";

const team = { capacity: 18000, roster: [{ id: "p1", contract: { salary: 3000 } }, { id: "p2", contract: { salary: 900 } }] };
const baseBusiness = () => ({
  ticketTiers: DEFAULT_TICKET_TIERS.map((t) => ({ ...t })),
  concessionItems: DEFAULT_CONCESSION_ITEMS.map((i) => ({ ...i })),
  merchItems: DEFAULT_MERCH_ITEMS.map((i) => ({ ...i })),
  parking: { ...DEFAULT_PARKING },
  facilities: { ...DEFAULT_FACILITIES },
  fanEngagement: DEFAULT_ENGAGEMENT,
  tvDeal: { value: 1_800_000, years: TV_DEAL_TERM, signedYear: 2026 },
  staff: {},
});

describe("marchandise et contrat de diffusion dans le bilan d'un match", () => {
  it("détaille les ventes de marchandise par article et un total cohérent", () => {
    const fin = computeGameFinance(team, baseBusiness(), 0.5);
    expect(fin.merch).toHaveLength(DEFAULT_MERCH_ITEMS.length);
    expect(fin.merch.reduce((a, i) => a + i.revenue, 0)).toBe(fin.merchRevenue);
    fin.merch.forEach((i) => expect(i.unitsSold).toBeGreaterThanOrEqual(0));
  });
  it("plus l'engagement des partisans est élevé, plus la marchandise se vend", () => {
    const low = computeGameFinance(team, { ...baseBusiness(), fanEngagement: 10 }, 0.5);
    const high = computeGameFinance(team, { ...baseBusiness(), fanEngagement: 95 }, 0.5);
    expect(high.merchRevenue).toBeGreaterThan(low.merchRevenue);
  });
  it("verse une part du contrat de diffusion à chaque match local, rien sans contrat", () => {
    const withDeal = computeGameFinance(team, baseBusiness(), 0.5);
    expect(withDeal.tvRevenue).toBeGreaterThan(0);
    const noDeal = computeGameFinance(team, { ...baseBusiness(), tvDeal: null }, 0.5);
    expect(noDeal.tvRevenue).toBe(0);
    expect(withDeal.revenue).toBe(withDeal.ticketRevenue + withDeal.concessionsRevenue + withDeal.parkingRevenue + withDeal.merchRevenue + withDeal.tvRevenue);
  });
  it("un directeur des communications coté améliore un peu l'affluence", () => {
    const without = computeGameFinance(team, baseBusiness(), 0.5);
    const withDirector = computeGameFinance(team, { ...baseBusiness(), staff: { broadcastDirector: { rating: 90 } } }, 0.5);
    expect(withDirector.attendance).toBeGreaterThanOrEqual(without.attendance);
  });
});

describe("note d'expérience client", () => {
  it("est neutre-haute à prix de base et se dégrade quand les prix montent", () => {
    const base = customerExperienceScore(baseBusiness(), 0.5);
    const expensive = customerExperienceScore({ ...baseBusiness(), ticketTiers: baseBusiness().ticketTiers.map((t) => ({ ...t, price: t.basePrice * 2.5 })) }, 0.5);
    expect(base).toBeGreaterThan(expensive);
    expect(base).toBeGreaterThanOrEqual(0);
    expect(base).toBeLessThanOrEqual(100);
  });
  it("de meilleures installations et plus de victoires améliorent l'expérience", () => {
    const poorFacilities = customerExperienceScore({ ...baseBusiness(), facilities: { concessions: 1, boutique: 1, parking: 1, marketing: 1 } }, 0.3);
    const goodFacilities = customerExperienceScore({ ...baseBusiness(), facilities: { concessions: 5, boutique: 5, parking: 5, marketing: 5 } }, 0.8);
    expect(goodFacilities).toBeGreaterThan(poorFacilities);
  });
});

describe("engagement des partisans", () => {
  it("monte avec une bonne affluence et des victoires, descend sinon", () => {
    expect(engagementDelta(0.9, 0.7)).toBeGreaterThan(0);
    expect(engagementDelta(0.2, 0.2)).toBeLessThan(0);
  });
  it("un bon directeur des communications et un bon marketing accélèrent la progression", () => {
    const base = engagementDelta(0.7, 0.6, 1, null);
    const promoted = engagementDelta(0.7, 0.6, 5, 90);
    expect(promoted).toBeGreaterThan(base);
  });
  it("applyEngagementDelta reste borné entre 0 et 100", () => {
    expect(applyEngagementDelta(98, 1, 1, 5, 99)).toBeLessThanOrEqual(100);
    expect(applyEngagementDelta(2, 0, 0, 1, 20)).toBeGreaterThanOrEqual(0);
  });
});

describe("contrat de diffusion télé", () => {
  it("vaut plus pour une équipe populaire et gagnante", () => {
    expect(tvDealValue(90, 0.8)).toBeGreaterThan(tvDealValue(30, 0.3));
  });
  it("un bon directeur des communications négocie un meilleur contrat", () => {
    expect(tvDealValue(50, 0.5, 95)).toBeGreaterThan(tvDealValue(50, 0.5, 25));
  });
  it("négocie un contrat de la durée standard", () => {
    const deal = negotiateTvDeal(60, 0.55, 2030, 60);
    expect(deal.years).toBe(TV_DEAL_TERM);
    expect(deal.signedYear).toBe(2030);
    expect(deal.value).toBeGreaterThan(0);
  });
});
