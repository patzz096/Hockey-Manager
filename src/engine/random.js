export function seededRandom(seed) { let s = seed; return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; }; }

export function poisson(lambda, rng) { const L = Math.exp(-lambda); let k = 0, p = 1; do { k++; p *= rng(); } while (p > L); return k - 1; }

export function weightedPick(items, weights, rng) {
  const total = weights.reduce((a, b) => a + b, 0);
  if (total <= 0) return items[Math.floor(rng() * items.length)];
  let r = rng() * total;
  for (let i = 0; i < items.length; i++) { r -= weights[i]; if (r <= 0) return items[i]; }
  return items[items.length - 1];
}

export function randAttr(rng, base) { return Math.min(99, Math.max(20, Math.round(base + rng() * 40 - 20))); }
