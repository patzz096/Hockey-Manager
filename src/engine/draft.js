import { FIRST_NAMES, LAST_NAMES } from "../data/names";
import { OFFENSIVE, DEFENSIVE, MENTAL, PHYSICAL, GOALIE_TECH, GOALIE_PHYSICAL, computeOvr } from "./attributes";
import { pickNationality } from "./players";
import { randAttr, seededRandom } from "./random";
import { assignJuniorLeague } from "./minorLeagues";
import { entryLevelContract } from "./contracts";
import { DRAFT_2027_PROSPECTS } from "../data/draft2027";

export const DRAFT_ROUNDS = 7;
// Contrat d'entrée : voir entryLevelContract (durée selon l'âge, salaire selon le rang).
const POSITIONS = ["C", "C", "LW", "RW", "LD", "RD", "C", "LW", "RW", "LD", "RD", "G"];

// Année moteur (= saison de départ, voir calendar.js FIRST_SEASON) dont la cuvée tombe sur le
// repêchage réel 2027 (draftYear = year + 1) : seule cuvée alimentée par de vrais espoirs classés
// (src/data/draft2027.js) plutôt que générée entièrement au hasard — voir buildProspect ci-dessous.
const REAL_DRAFT_ENGINE_YEAR = 2026;

// Position principale d'un espoir réel : certaines entrées listent plusieurs postes ("C/LW") ou
// restent génériques ("D", "F") faute de détail dans le classement source — désambiguïsé ici par
// alternance déterministe (même rang → même choix d'une partie à l'autre).
function primaryPos(raw, rng) {
  if (raw === "D") return rng() < 0.5 ? "LD" : "RD";
  if (raw === "F") return ["C", "LW", "RW"][Math.floor(rng() * 3)];
  return raw.split("/")[0];
}

// Un espoir (généré ou réel) à partir d'un « talent » 0 (ordinaire) à 1 (exceptionnel) : mêmes
// formules pour les deux, seuls le nom/poste/nationalité diffèrent selon la source.
function buildProspect(id, pos, nationality, age, talent, rng) {
  const base = 44 + talent * 12;
  const keys = pos === "G" ? [...GOALIE_TECH, ...MENTAL, ...GOALIE_PHYSICAL] : [...OFFENSIVE, ...DEFENSIVE, ...MENTAL, ...PHYSICAL];
  const attrs = {};
  keys.forEach((k) => { attrs[k] = Math.max(25, Math.min(80, randAttr(rng, base) - 4)); });
  const ovr = computeOvr(pos, attrs);
  // Plafond calé sur l'échelle du jeu : une vedette actuelle de la LNH est vers 70-72.
  const potential = Math.min(82, Math.round(ovr + 10 + talent * 16 + rng() * 4));
  const p = { id, pos, age, attrs, ovr, potential, nationality, contract: null, draftProspect: true, draftPick: null, draftYear: null };
  return { ...p, ...assignJuniorLeague(p) };
}

// Cuvée du repêchage : 18-19 ans, habileté actuelle faible, potentiel très variable.
// Les meilleurs espoirs sont rares (distribution en « queue »).
export function generateDraftClass(year, count) {
  const rng = seededRandom(1000 + year * 7);
  const list = [];
  const real = year === REAL_DRAFT_ENGINE_YEAR ? DRAFT_2027_PROSPECTS : [];
  for (let i = 0; i < count; i++) {
    if (i < real.length) {
      const r = real[i];
      // Rang 1 → talent ~1 (exceptionnel), dernier rang classé → talent faible mais toujours
      // au-dessus du plancher des espoirs purement générés plus loin dans la cuvée.
      const talent = Math.max(0.15, 1 - (r.rank - 1) / (real.length * 1.3));
      const p = buildProspect(`DRAFT-${year}-${i}`, primaryPos(r.pos, rng), r.nationality, rng() < 0.75 ? 18 : 19, talent, rng);
      list.push({ ...p, name: r.name });
      continue;
    }
    const pos = POSITIONS[i % POSITIONS.length];
    const talent = Math.pow(rng(), 2.2); // 0 = ordinaire, 1 = exceptionnel
    const fn = FIRST_NAMES[Math.floor(rng() * FIRST_NAMES.length)], ln = LAST_NAMES[Math.floor(rng() * LAST_NAMES.length)];
    const p = buildProspect(`DRAFT-${year}-${i}`, pos, pickNationality(rng), rng() < 0.75 ? 18 : 19, talent, rng);
    list.push({ ...p, name: `${fn} ${ln}` });
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

// Clé d'un choix pour le suivi des échanges (ronde + équipe d'origine, avant tout échange).
export function pickKey(round, origTeamId) { return `${round}-${origTeamId}`; }

// `pickTrades` : { [pickKey]: équipe qui détient actuellement ce choix } — construit au fil des
// échanges de la saison (voir App.jsx), vide par défaut (aucun choix échangé).
export function createDraft(year, order, pickTrades = {}) {
  const picks = [];
  for (let r = 0; r < DRAFT_ROUNDS; r++) {
    order.forEach((origTeamId, i) => {
      const key = pickKey(r + 1, origTeamId);
      const teamId = pickTrades[key] || origTeamId;
      picks.push({ overall: r * order.length + i + 1, round: r + 1, teamId, origTeamId, playerId: null });
    });
  }
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
  const player = { ...p, draftProspect: false, draftPick: pick.overall, draftYear: draft.year + 1, contract: entryLevelContract(pick.overall, p.age, draft.year + 1), signedAge: p.age, signedYear: draft.year + 1, level: "LAH", id: `${p.id}-${pick.teamId}` };
  return { draft: { ...draft, picks, current: draft.current + 1 }, player, pick };
}

export function draftDone(draft) { return !draft || draft.current >= draft.picks.length; }

// Choix de repêchage (ronde + équipe d'origine) actuellement détenus par `teamId`, en tenant
// compte des échanges déjà conclus (`pickTrades`) — utilisé avant même que le repêchage existe
// (createDraft), pour l'onglet Transactions et l'évaluation IA d'un échange.
export function ownedPicks(teamId, teamIds, pickTrades = {}) {
  const list = [];
  for (let r = 1; r <= DRAFT_ROUNDS; r++) {
    teamIds.forEach((origTeamId) => {
      const key = pickKey(r, origTeamId);
      if ((pickTrades[key] || origTeamId) === teamId) list.push({ round: r, origTeamId, key });
    });
  }
  return list.sort((a, b) => a.round - b.round);
}
