import { bestSpecial, specialUnitOf } from "./specialTeams";
import { DEFAULT_STRATEGY, DEFAULT_MENTALITY } from "./strategy";

export const FORWARD_BONUS = [1.2, 1.05, 0.92, 0.8];

export const DEFENSE_BONUS = [1.1, 1.0, 0.92];

// Mise en direct : quand `lines.shift = { forwardIdx, defenseIdx }` est présent, le trio et la
// paire choisis pour cette mise au jeu concentrent presque tout le poids (tirs, mises en échec,
// cotes d'équipe pondérées) ; les autres restent sur le banc, avec un poids résiduel minime.
// Somme = celle de FORWARD_BONUS / DEFENSE_BONUS, pour que l'échelle des cotes ne change pas.
const SHIFT_ON = { F: FORWARD_BONUS.reduce((a, b) => a + b, 0) - 0.15, D: DEFENSE_BONUS.reduce((a, b) => a + b, 0) - 0.1 };
const SHIFT_OFF = { F: 0.05, D: 0.05 };

export function buildLines(roster) {
  const C = roster.filter((p) => p.pos === "C").sort((a, b) => b.ovr - a.ovr);
  const LW = roster.filter((p) => p.pos === "LW").sort((a, b) => b.ovr - a.ovr);
  const RW = roster.filter((p) => p.pos === "RW").sort((a, b) => b.ovr - a.ovr);
  const LD = roster.filter((p) => p.pos === "LD").sort((a, b) => b.ovr - a.ovr);
  const RD = roster.filter((p) => p.pos === "RD").sort((a, b) => b.ovr - a.ovr);
  const G = roster.filter((p) => p.pos === "G").sort((a, b) => b.ovr - a.ovr);
  const forwards = [0, 1, 2, 3].map((i) => ({ LW: LW[i]?.id, C: C[i]?.id, RW: RW[i]?.id }));
  const defense = [0, 1, 2].map((i) => ({ LD: LD[i]?.id, RD: RD[i]?.id }));
  const goalies = { starter: G[0]?.id, backup: G[1]?.id };
  // Unités spéciales : le système le plus rentable pour l'effectif, deux unités chacune.
  const pp = bestSpecial(roster, "pp"), pk = bestSpecial(roster, "pk");
  // roles : rôles demandés (id du joueur → rôle) ; vide = rôle naturel de chaque joueur.
  // cohesion : rodage du système de jeu (engine/training.js) ; 100 = pleinement rodé (la
  // valeur par défaut pour les 31 autres équipes, jamais suivie que pour la tienne).
  return { forwards, defense, goalies, pp: pp.units, pk: pk.units, special: { pp: pp.id, pk: pk.id }, roles: {}, strategy: { ...DEFAULT_STRATEGY }, mentality: { ...DEFAULT_MENTALITY }, cohesion: 100 };
}

export function lineInfo(playerId, lines) {
  const shift = lines.shift;
  for (let i = 0; i < lines.forwards.length; i++) {
    const l = lines.forwards[i];
    if (l.LW === playerId || l.C === playerId || l.RW === playerId) return { type: "F", idx: i, bonus: shift ? (i === shift.forwardIdx ? SHIFT_ON.F : SHIFT_OFF.F) : FORWARD_BONUS[i] };
  }
  for (let i = 0; i < lines.defense.length; i++) {
    const l = lines.defense[i];
    if (l.LD === playerId || l.RD === playerId) return { type: "D", idx: i, bonus: shift ? (i === shift.defenseIdx ? SHIFT_ON.D : SHIFT_OFF.D) : DEFENSE_BONUS[i] };
  }
  if (lines.goalies.starter === playerId) return { type: "G", idx: 0, bonus: 1 };
  if (lines.goalies.backup === playerId) return { type: "G", idx: 1, bonus: 0.25 };
  return { type: "?", idx: -1, bonus: 0.7 };
}

export function lineLabel(playerId, lines) {
  const info = lineInfo(playerId, lines);
  let label = info.type === "F" ? `Trio ${info.idx + 1}` : info.type === "D" ? `Paire ${info.idx + 1}` : info.type === "G" ? (info.idx === 0 ? "Partant" : "Réserviste") : "—";
  const tags = [];
  const pp = specialUnitOf(lines, "pp", playerId), pk = specialUnitOf(lines, "pk", playerId);
  if (pp) tags.push(`AN${pp}`);
  if (pk) tags.push(`DN${pk}`);
  return tags.length ? `${label} · ${tags.join("/")}` : label;
}
