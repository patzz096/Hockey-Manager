export const CURRENT_YEAR = 2026;

export function randomContract(rng) { return { years: Math.max(1, Math.round(1 + rng() * 6)), salary: Math.round(300 + rng() * 7500) }; }

export function randomContractRT() { return { years: Math.max(1, Math.round(1 + Math.random() * 6)), salary: Math.round(300 + Math.random() * 7500) }; }

export function expectedSalary(player) {
  const qualityRef = Math.max(player.ovr, player.ovr * 0.7 + player.potential * 0.3);
  return Math.round(250 + Math.pow(qualityRef / 99, 2.6) * 9500);
}

export function expectedYears(player) {
  if (player.age < 23 && player.potential - player.ovr > 8) return 4;
  if (player.age >= 30) return 1;
  if (player.age >= 27) return 2;
  return 3;
}

export function evaluateOffer(player, offer) {
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
