import { FIRST_NAMES, LAST_NAMES, NATIONALITY_POOL } from "../data/names";
import { OFFENSIVE, DEFENSIVE, MENTAL, PHYSICAL, GOALIE_TECH, GOALIE_PHYSICAL, computeOvr, potentialCeiling } from "./attributes";
import { CURRENT_YEAR, randomContract } from "./contracts";
import { randAttr } from "./random";

// 4C + 8W (4 slots for LW, 4 for RW) + 6D (3 pairs) + 2G (starter/backup)
export const ROSTER_POSITIONS = ["C","C","C","C","LW","LW","LW","LW","RW","RW","RW","RW","LD","LD","LD","RD","RD","RD","G","G"];

export function buildRealRoster(data, teamIndex, rng) {
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

export function buildNamedRoster(data, teamIndex, rng) {
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

export function pickNationality(rng) {
  const total = NATIONALITY_POOL.reduce((a, n) => a + n.weight, 0);
  let r = rng() * total;
  for (const n of NATIONALITY_POOL) { r -= n.weight; if (r <= 0) return n.code; }
  return "CA";
}

export function buildRoster(teamIndex, rng) {
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

export function buildFreeAgentPool(rng, count = 16) {
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

export function buildFarmRoster(teamIndex, rng, count = 10) {
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

export function assignDraftInfo(players, rng) {
  const ranked = [...players].map((p) => ({ p, key: p.ovr + rng() * 18 })).sort((a, b) => b.key - a.key);
  const draftableCount = Math.round(players.length * 0.78);
  ranked.forEach(({ p }, i) => {
    if (i < draftableCount) { p.draftPick = i + 1; p.draftYear = Math.max(2016, Math.min(CURRENT_YEAR, CURRENT_YEAR - Math.max(0, p.age - 18))); }
    else { p.draftPick = null; p.draftYear = null; }
  });
}

export function buildFreeAgentPoolRT(count = 16, scoutRating = 50) {
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
