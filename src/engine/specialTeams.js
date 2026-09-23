// ---------------------------------------------------------------------------------------
// Unités spéciales : avantage numérique (AN, 5 patineurs) et désavantage numérique (DN, 4).
// Chaque équipe aligne deux unités de chaque type ; l'unité 1 joue la majeure partie du temps.
// Un système (1-3-1, parapluie, boîte, losange…) définit des postes (s1..s5 / s1..s4), chacun
// avec son profil d'attributs. L'adéquation d'une unité (-1..+1) est la moyenne de ses postes ;
// elle module les effets du système :
//   AN : vol (tirs), q (qualité des chances), shA (risque de but en désavantage contre)
//   DN : volA (tirs accordés), qA (qualité accordée), sh (chances de marquer en infériorité)
// Coordonnées des postes : x de 0 (bande gauche) à 100 (bande droite), y de 0 (ligne bleue)
// à 100 (ligne des buts) ; le filet est vers y = 88.
// ---------------------------------------------------------------------------------------

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const isD = (p) => p.pos === "LD" || p.pos === "RD";

export const SPECIAL_KINDS = {
  pp: { label: "Avantage numérique", short: "AN", size: 5, shares: [0.62, 0.38] },
  pk: { label: "Désavantage numérique", short: "DN", size: 4, shares: [0.55, 0.45] },
};
export const SLOT_KEYS = { pp: ["s1", "s2", "s3", "s4", "s5"], pk: ["s1", "s2", "s3", "s4"] };

const W = {
  qb: { passing: 3, offensiveRead: 3, puckhandling: 2, shotRange: 1 },
  oneTimer: { shotRange: 3, shotAccuracy: 2, gettingOpen: 1, passing: 1 },
  distributor: { passing: 3, puckhandling: 2, offensiveRead: 2, shotAccuracy: 1 },
  bumper: { gettingOpen: 2, shotAccuracy: 2, puckhandling: 1, offensiveRead: 1, agility: 1 },
  netFront: { screening: 3, strength: 2, balance: 1, bravery: 1, shotAccuracy: 1 },
  cannon: { shotRange: 3, shotAccuracy: 2, passing: 1 },
  flank: { passing: 2, shotRange: 2, puckhandling: 1, offensiveRead: 1 },
  rebound: { gettingOpen: 2, shotAccuracy: 2, strength: 1, puckhandling: 1 },
  cycle: { puckhandling: 3, passing: 2, agility: 1, balance: 1 },
  backdoor: { gettingOpen: 3, shotAccuracy: 2, offensiveRead: 1 },
  // Désavantage numérique
  pkF: { positioning: 3, defensiveRead: 2, stickchecking: 2, shotBlocking: 1 },
  pkD: { positioning: 2, shotBlocking: 3, strength: 1, defensiveRead: 1 },
  chaser: { speed: 2, stickchecking: 2, defensiveRead: 2, stamina: 1 },
  pkWing: { positioning: 2, stickchecking: 2, checking: 1, defensiveRead: 1 },
  weakSide: { positioning: 2, defensiveRead: 2, shotBlocking: 1, agility: 1 },
  crease: { strength: 3, checking: 2, shotBlocking: 2, bravery: 1 },
  blocker: { shotBlocking: 3, positioning: 2, bravery: 1 },
  presser: { speed: 3, stickchecking: 2, stamina: 1, aggressiveness: 1 },
  pressD: { agility: 2, stickchecking: 2, speed: 1, positioning: 1 },
};

// ref : note de poste moyenne de la ligue pour ce système (adéquation nulle) ; les joueurs
// d'unités spéciales sont l'élite de l'effectif, d'où une référence plus haute qu'à forces égales.
// pos : "D" (défenseur conseillé), "F" (attaquant conseillé) ou absent.
// shoot / pass : part des tirs et des passes décisives du poste.
export const SPECIAL_SYSTEMS = {
  pp: [
    { id: "oneThreeOne", ref: 70, label: "1-3-1", desc: "Un quart-arrière à la pointe, deux tireurs aux demi-murs, un joueur d'enclave et un écran devant le filet. Le système dominant de la LNH : il crée des tirs sur réception de grande qualité.",
      good: "Un défenseur passeur à la pointe, un franc-tireur au tir sur réception, un joueur d'enclave habile et un gros corps devant le filet.", bad: "Des passes imprécises : la rondelle perdue au centre file en échappée.",
      slots: [
        { key: "s1", label: "Quart-arrière (pointe)", short: "QA", x: 50, y: 10, pos: "D", w: W.qb, shoot: 0.7, pass: 1.5 },
        { key: "s2", label: "Tireur sur réception (demi-mur)", short: "TIR", x: 14, y: 46, w: W.oneTimer, shoot: 1.5, pass: 0.8 },
        { key: "s3", label: "Distributeur (demi-mur opposé)", short: "DIS", x: 86, y: 46, w: W.distributor, shoot: 0.9, pass: 1.4 },
        { key: "s4", label: "Joueur d'enclave (« bumper »)", short: "ENC", x: 50, y: 50, w: W.bumper, shoot: 1.1, pass: 1 },
        { key: "s5", label: "Devant du filet", short: "FIL", x: 50, y: 80, pos: "F", w: W.netFront, shoot: 0.8, pass: 0.7 },
      ],
      fx: (f) => ({ vol: 1 + 0.05 * f, q: 1.04 + 0.06 * f, shA: 1.08 }) },
    { id: "umbrella", ref: 69, label: "Parapluie", desc: "Trois joueurs en haut de zone font circuler la rondelle pour libérer un canon de la pointe ; deux joueurs créent l'écran et récupèrent les rebonds.",
      good: "Des défenseurs au tir puissant et des attaquants robustes pour masquer le gardien.", bad: "Des tireurs faibles de loin : beaucoup de tirs, peu de danger.",
      slots: [
        { key: "s1", label: "Canonnier (pointe centrale)", short: "CAN", x: 50, y: 10, pos: "D", w: W.cannon, shoot: 1.5, pass: 0.9 },
        { key: "s2", label: "Flanc gauche", short: "FLG", x: 18, y: 22, w: W.flank, shoot: 1, pass: 1.2 },
        { key: "s3", label: "Flanc droit", short: "FLD", x: 82, y: 22, w: W.flank, shoot: 1, pass: 1.2 },
        { key: "s4", label: "Écran devant le filet", short: "ÉCR", x: 46, y: 80, pos: "F", w: W.netFront, shoot: 0.7, pass: 0.7 },
        { key: "s5", label: "Rebonds (bas de l'enclave)", short: "REB", x: 62, y: 70, pos: "F", w: W.rebound, shoot: 1, pass: 0.8 },
      ],
      fx: (f) => ({ vol: 1.08 + 0.04 * f, q: 0.95 + 0.04 * f, shA: 0.95 }) },
    { id: "overload", ref: 70, label: "Surcharge côté fort", desc: "Quatre joueurs se regroupent d'un côté pour créer un surnombre en cycle ; le cinquième attend à la porte arrière.",
      good: "Des attaquants habiles en cycle le long de la bande et un marqueur opportuniste du côté faible.", bad: "Des joueurs lents à lire le jeu : le côté fort s'encombre.",
      slots: [
        { key: "s1", label: "Pointe", short: "PTE", x: 34, y: 12, pos: "D", w: W.flank, shoot: 0.9, pass: 1.2 },
        { key: "s2", label: "Coin / ligne des buts", short: "COI", x: 16, y: 80, w: W.cycle, shoot: 0.6, pass: 1.5 },
        { key: "s3", label: "Haut du cercle", short: "CER", x: 22, y: 42, w: W.oneTimer, shoot: 1.3, pass: 0.9 },
        { key: "s4", label: "Porte arrière", short: "PAR", x: 74, y: 70, w: W.backdoor, shoot: 1.3, pass: 0.8 },
        { key: "s5", label: "Devant du filet", short: "FIL", x: 46, y: 82, pos: "F", w: W.netFront, shoot: 0.8, pass: 0.8 },
      ],
      fx: (f) => ({ vol: 1 + 0.03 * f, q: 1.03 + 0.06 * f, shA: 1 }) },
    { id: "shootFirst", ref: 68.5, label: "2-1-2 : tir et trafic", desc: "Deux pointes lancent tout ce qu'elles peuvent vers deux joueurs postés devant le gardien pour les déviations et les rebonds.",
      good: "Deux bons tireurs de loin et deux attaquants costauds devant le filet.", bad: "Des joueurs légers en bas de zone : les écrans ne tiennent pas.",
      slots: [
        { key: "s1", label: "Pointe gauche", short: "PTG", x: 30, y: 12, pos: "D", w: W.cannon, shoot: 1.3, pass: 1 },
        { key: "s2", label: "Pointe droite", short: "PTD", x: 70, y: 12, w: W.cannon, shoot: 1.3, pass: 1 },
        { key: "s3", label: "Haut de l'enclave", short: "ENC", x: 50, y: 44, w: W.bumper, shoot: 1, pass: 1.1 },
        { key: "s4", label: "Écran gauche", short: "ÉCR", x: 40, y: 82, pos: "F", w: W.netFront, shoot: 0.7, pass: 0.7 },
        { key: "s5", label: "Écran droit / rebonds", short: "REB", x: 60, y: 84, pos: "F", w: W.rebound, shoot: 0.9, pass: 0.7 },
      ],
      fx: (f) => ({ vol: 1.1 + 0.04 * f, q: 0.93 + 0.04 * f, shA: 0.92 }) },
  ],
  pk: [
    { id: "box", ref: 65.5, label: "Boîte", desc: "Quatre joueurs en carré protègent l'enclave et poussent l'adversaire à tirer de l'extérieur.",
      good: "Des joueurs disciplinés, bien positionnés, qui bloquent les tirs.", bad: "Des joueurs lents à fermer les lignes de tir : le 1-3-1 adverse trouve la zone du tir sur réception.",
      slots: [
        { key: "s1", label: "Attaquant haut gauche", short: "AHG", x: 34, y: 42, pos: "F", w: W.pkF, shoot: 1, pass: 1 },
        { key: "s2", label: "Attaquant haut droit", short: "AHD", x: 66, y: 42, pos: "F", w: W.pkF, shoot: 1, pass: 1 },
        { key: "s3", label: "Défenseur bas gauche", short: "DBG", x: 36, y: 72, pos: "D", w: W.pkD, shoot: 0.5, pass: 0.8 },
        { key: "s4", label: "Défenseur bas droit", short: "DBD", x: 64, y: 72, pos: "D", w: W.pkD, shoot: 0.5, pass: 0.8 },
      ],
      fx: (f) => ({ volA: 1.02, qA: 0.94 - 0.07 * f, sh: 0.8 }) },
    { id: "diamond", ref: 68, label: "Losange", desc: "Un attaquant en pointe haute, deux joueurs sur les côtés, un défenseur devant le filet : bon contre la circulation à la pointe.",
      good: "Un attaquant rapide en pointe haute et un défenseur fort devant le filet.", bad: "Un défenseur de filet frêle : les écrans adverses restent en place.",
      slots: [
        { key: "s1", label: "Pointe haute", short: "PHT", x: 50, y: 30, pos: "F", w: W.chaser, shoot: 1.2, pass: 1 },
        { key: "s2", label: "Côté fort", short: "CFT", x: 24, y: 56, pos: "F", w: W.pkWing, shoot: 1, pass: 1 },
        { key: "s3", label: "Côté faible", short: "CFB", x: 76, y: 56, pos: "D", w: W.weakSide, shoot: 0.6, pass: 0.9 },
        { key: "s4", label: "Devant du filet", short: "FIL", x: 50, y: 78, pos: "D", w: W.crease, shoot: 0.4, pass: 0.7 },
      ],
      fx: (f) => ({ volA: 0.97 - 0.04 * f, qA: 1 - 0.04 * f, sh: 1 }) },
    { id: "wedge", ref: 68, label: "Triangle + 1", desc: "Trois joueurs forment un triangle serré devant le filet ; le quatrième chasse la rondelle en haut de zone.",
      good: "Des bloqueurs de tirs courageux et un attaquant infatigable pour chasser.", bad: "Un chasseur lent : la pointe adverse lance à volonté.",
      slots: [
        { key: "s1", label: "Chasseur", short: "CHA", x: 50, y: 26, pos: "F", w: W.presser, shoot: 1.3, pass: 1 },
        { key: "s2", label: "Triangle gauche", short: "TRG", x: 30, y: 62, pos: "F", w: W.blocker, shoot: 0.8, pass: 1 },
        { key: "s3", label: "Triangle droit", short: "TRD", x: 70, y: 62, pos: "D", w: W.blocker, shoot: 0.5, pass: 0.8 },
        { key: "s4", label: "Défenseur devant le filet", short: "FIL", x: 50, y: 80, pos: "D", w: W.crease, shoot: 0.4, pass: 0.7 },
      ],
      fx: (f) => ({ volA: 1.05, qA: 0.91 - 0.06 * f, sh: 0.7 }) },
    { id: "pressure", ref: 67, label: "Pression agressive", desc: "Les quatre joueurs attaquent le porteur pour forcer l'erreur : plus de dégagements et de buts en infériorité, mais des trous si la pression est contournée.",
      good: "Des joueurs rapides, endurants, habiles avec le bâton.", bad: "Des joueurs lents : chaque passe franchit la pression et crée une chance de qualité.",
      slots: [
        { key: "s1", label: "Presseur gauche", short: "PRG", x: 38, y: 30, pos: "F", w: W.presser, shoot: 1.2, pass: 1 },
        { key: "s2", label: "Presseur droit", short: "PRD", x: 62, y: 30, pos: "F", w: W.presser, shoot: 1.2, pass: 1 },
        { key: "s3", label: "Défenseur mobile gauche", short: "DMG", x: 34, y: 62, pos: "D", w: W.pressD, shoot: 0.6, pass: 0.9 },
        { key: "s4", label: "Défenseur mobile droit", short: "DMD", x: 66, y: 62, pos: "D", w: W.pressD, shoot: 0.6, pass: 0.9 },
      ],
      fx: (f) => ({ volA: 0.94 - 0.04 * f, qA: 1.08 - 0.04 * f, sh: 1.5 + 0.3 * f }) },
  ],
};

export const DEFAULT_SPECIAL = { pp: "oneThreeOne", pk: "box" };

export function specialSystem(kind, id) {
  const list = SPECIAL_SYSTEMS[kind];
  return list.find((s) => s.id === id) || list.find((s) => s.id === DEFAULT_SPECIAL[kind]);
}

function weighted(p, weights) {
  let s = 0, w = 0;
  Object.entries(weights).forEach(([k, x]) => { s += (p.attrs[k] ?? 60) * x; w += x; });
  return w ? s / w : 60;
}

// Valeur d'un joueur à un poste (échelle des attributs) ; hors position, il perd 6 points.
export function slotScore(player, slot) {
  if (!player || player.pos === "G") return 30;
  const off = slot.pos === "D" ? !isD(player) : slot.pos === "F" ? isD(player) : false;
  return weighted(player, slot.w) - (off ? 6 : 0);
}
export function slotFit(player, slot, ref = 66) { return player ? clamp((slotScore(player, slot) - ref) / 6, -1, 1) : -1; }

// Unités au format courant : [{ s1: id, ... }, { ... }]. Accepte l'ancien format (un tableau d'ids).
export function specialUnits(lines, kind) {
  const raw = lines?.[kind];
  const keys = SLOT_KEYS[kind];
  const toUnit = (ids) => Object.fromEntries(keys.map((k, i) => [k, ids[i]]));
  if (!Array.isArray(raw) || raw.length === 0) return [toUnit([]), toUnit([])];
  if (typeof raw[0] !== "object" || raw[0] === null) return [toUnit(raw), toUnit([])];
  return [raw[0] || toUnit([]), raw[1] || toUnit([])];
}
export function specialSystems(lines) {
  return { pp: specialSystem("pp", lines?.special?.pp).id, pk: specialSystem("pk", lines?.special?.pk).id };
}
// Numéro de l'unité (1 ou 2) d'un joueur, 0 s'il n'en fait pas partie.
export function specialUnitOf(lines, kind, playerId) {
  const units = specialUnits(lines, kind);
  const i = units.findIndex((u) => Object.values(u).includes(playerId));
  return i + 1;
}

// Adéquation d'une unité au système (-1..+1).
export function unitFit(unit, roster, kind, systemId) {
  const sys = specialSystem(kind, systemId);
  const byId = (id) => roster.find((p) => p.id === id);
  return sys.slots.reduce((a, s) => a + slotFit(byId(unit[s.key]), s, sys.ref), 0) / sys.slots.length;
}
export function systemEffects(kind, systemId, fit) {
  const base = kind === "pp" ? { vol: 1, q: 1, shA: 1 } : { volA: 1, qA: 1, sh: 1 };
  return { ...base, ...specialSystem(kind, systemId).fx(fit) };
}
// Valeur nette d'un système (choix automatique).
export function systemValue(kind, e) {
  return kind === "pp" ? Math.log(e.vol * e.q) - (e.shA - 1) * 0.08 : -Math.log(e.volA * e.qA) + (e.sh - 1) * 0.08;
}

// Remplit deux unités pour un système : l'unité 1 prend les meilleures paires joueur-poste.
export function autoUnits(roster, kind, systemId, keep = [[], []]) {
  const sys = specialSystem(kind, systemId);
  const used = new Set(keep.flat().map(([, id]) => id));
  return [0, 1].map((u) => {
    const unit = {};
    (keep[u] || []).forEach(([k, id]) => { unit[k] = id; });
    const open = sys.slots.filter((s) => !unit[s.key]);
    while (open.length) {
      let best = null;
      roster.forEach((p) => {
        if (p.pos === "G" || used.has(p.id)) return;
        open.forEach((s) => { const v = slotScore(p, s); if (!best || v > best.v) best = { v, p, s }; });
      });
      if (!best) break;
      unit[best.s.key] = best.p.id; used.add(best.p.id);
      open.splice(open.indexOf(best.s), 1);
    }
    return unit;
  });
}

// Système le plus rentable, avec les unités qu'il produirait.
export function bestSpecial(roster, kind) {
  let best = null;
  SPECIAL_SYSTEMS[kind].forEach((sys) => {
    const units = autoUnits(roster, kind, sys.id);
    const fits = units.map((u) => unitFit(u, roster, kind, sys.id));
    const fit = fits.reduce((a, f, i) => a + f * SPECIAL_KINDS[kind].shares[i], 0);
    const v = systemValue(kind, systemEffects(kind, sys.id, fit));
    if (!best || v > best.v) best = { v, id: sys.id, units };
  });
  return best;
}

// Après blessures ou départs : garde les joueurs présents et comble les postes vides.
export function repairUnits(lines, roster, kind) {
  const units = specialUnits(lines, kind);
  const has = (id) => id && roster.some((p) => p.id === id);
  const keep = units.map((u) => Object.entries(u).filter(([, id]) => has(id)));
  return autoUnits(roster, kind, specialSystems(lines)[kind], keep);
}

// Unités prêtes pour la simulation : joueurs, poste, part du temps et effets du système.
// Mis en cache tant que l'effectif et les trios ne changent pas (appelé à chaque segment de match).
const simCache = new WeakMap();
export function unitsForSim(team, lines, kind) {
  if (!lines) return computeUnitsForSim(team, lines, kind);
  const byRoster = simCache.get(lines) || new WeakMap();
  const entry = byRoster.get(team.roster) || {};
  if (!entry[kind]) { entry[kind] = computeUnitsForSim(team, lines, kind); byRoster.set(team.roster, entry); simCache.set(lines, byRoster); }
  return entry[kind];
}
function computeUnitsForSim(team, lines, kind) {
  const sys = specialSystem(kind, specialSystems(lines)[kind]);
  const byId = new Map(team.roster.map((p) => [p.id, p]));
  return specialUnits(lines, kind).map((u, i) => {
    const members = sys.slots.map((s) => ({ p: byId.get(u[s.key]), slot: s })).filter((m) => m.p);
    const fit = members.length ? unitFit(u, team.roster, kind, sys.id) : -1;
    return { share: SPECIAL_KINDS[kind].shares[i], members, fit, fx: systemEffects(kind, sys.id, fit) };
  }).filter((u) => u.members.length);
}
