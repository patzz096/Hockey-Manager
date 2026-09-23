import { FIRST_NAMES, LAST_NAMES } from "../data/names";
import { OFFENSIVE, DEFENSIVE, MENTAL, PHYSICAL, GOALIE_TECH, GOALIE_PHYSICAL, computeOvr } from "./attributes";
import { pickNationality } from "./players";
import { randAttr, seededRandom } from "./random";
import { assignJuniorLeague } from "./minorLeagues";

export const DRAFT_ROUNDS = 7;
export const ENTRY_CONTRACT = { years: 3, salary: 950 };
const POSITIONS = ["C", "C", "LW", "RW", "LD", "RD", "C", "LW", "RW", "LD", "RD", "G"];

// Cuvée du repêchage : 18-19 ans, habileté actuelle faible, potentiel très variable.
// Les meilleurs espoirs sont rares (distribution en « queue »).
export function generateDraftClass(year, count) {
  const rng = seededRandom(1000 + year * 7);
  const list = [];
  for (let i = 0; i < count; i++) {
    const pos = POSITIONS[i % POSITIONS.length];
    const talent = Math.pow(rng(), 2.2); // 0 = ordinaire, 1 = exceptionnel
    const base = 44 + talent * 12;
    const keys = pos === "G" ? [...GOALIE_TECH, ...MENTAL, ...GOALIE_PHYSICAL] : [...OFFENSIVE, ...DEFENSIVE, ...MENTAL, ...PHYSICAL];
    const attrs = {};
    keys.forEach((k) => { attrs[k] = Math.max(25, Math.min(80, randAttr(rng, base) - 4)); });
    const ovr = computeOvr(pos, attrs);
    // Plafond calé sur l'échelle du jeu : une vedette actuelle de la LNH est vers 70-72.
    const potential = Math.min(82, Math.round(ovr + 10 + talent * 16 + rng() * 4));
    const fn = FIRST_NAMES[Math.floor(rng() * FIRST_NAMES.length)], ln = LAST_NAMES[Math.floor(rng() * LAST_NAMES.length)];
    const p = { id: `DRAFT-${year}-${i}`, name: `${fn} ${ln}`, pos, age: rng() < 0.75 ? 18 : 19, attrs, ovr, potential, nationality: pickNationality(rng), contract: null, draftProspect: true, draftPick: null, draftYear: null };
    // Ligue et club junior : graine propre au joueur, la cuvée reste identique.
    list.push({ ...p, ...assignJuniorLeague(p) });
  }
  return list;
}

// Taille de la cuvée : 7 rondes × 32 choix + 32 joueurs non repêchés.
export const DRAFT_CLASS_SIZE = DRAFT_ROUNDS * 32 + 32;
// Cuvée à venir, connue toute la saison (dépistage, liste de repêchage) ; identique au bassin
// que createDraft générera le jour du repêchage.
const classCache = new Map();
export function upcomingDraftClass(year) {
  if (!classCache.has(year)) classCache.set(year, generateDraftClass(year, DRAFT_CLASS_SIZE));
  return classCache.get(year);
}

export function createDraft(year, order) {
  const picks = [];
  for (let r = 0; r < DRAFT_ROUNDS; r++) order.forEach((teamId, i) => picks.push({ overall: r * order.length + i + 1, round: r + 1, teamId, playerId: null }));
  return { year, picks, pool: picks.length + 32 === DRAFT_CLASS_SIZE ? upcomingDraftClass(year) : generateDraftClass(year, picks.length + 32), current: 0 };
}

// Choix d'une équipe contrôlée par l'ordinateur : meilleur potentiel perçu (avec une part
// d'incertitude propre à chaque équipe), en tenant compte de l'habileté actuelle.
export function aiPick(draft, teamId) {
  const rng = seededRandom(draft.current * 31 + teamId.charCodeAt(0) * 7 + teamId.charCodeAt(2));
  const available = draft.pool.filter((p) => !draft.picks.some((k) => k.playerId === p.id));
  let best = null, bestScore = -Infinity;
  available.forEach((p) => {
    const score = p.potential * 0.8 + p.ovr * 0.2 + (rng() - 0.5) * 8;
    if (score > bestScore) { bestScore = score; best = p; }
  });
  return best;
}

// Enregistre le choix courant ; renvoie { draft, player } (le joueur signe un contrat d'entrée).
export function makePick(draft, playerId) {
  const pick = draft.picks[draft.current];
  const p = draft.pool.find((x) => x.id === playerId);
  if (!pick || !p) return { draft, player: null };
  const picks = draft.picks.map((k, i) => (i === draft.current ? { ...k, playerId } : k));
  const player = { ...p, draftProspect: false, draftPick: pick.overall, draftYear: draft.year + 1, contract: { ...ENTRY_CONTRACT }, signedAge: p.age, signedYear: draft.year + 1, level: "LAH", id: `${p.id}-${pick.teamId}` };
  return { draft: { ...draft, picks, current: draft.current + 1 }, player, pick };
}

export function draftDone(draft) { return !draft || draft.current >= draft.picks.length; }
