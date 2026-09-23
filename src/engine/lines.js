import { OFFENSIVE, DEFENSIVE, avg } from "./attributes";
import { DEFAULT_STRATEGY, DEFAULT_MENTALITY } from "./strategy";

export const FORWARD_BONUS = [1.2, 1.05, 0.92, 0.8];

export const DEFENSE_BONUS = [1.1, 1.0, 0.92];

export function buildLines(roster) {
  const C = roster.filter((p) => p.pos === "C").sort((a, b) => b.ovr - a.ovr);
  const LW = roster.filter((p) => p.pos === "LW").sort((a, b) => b.ovr - a.ovr);
  const RW = roster.filter((p) => p.pos === "RW").sort((a, b) => b.ovr - a.ovr);
  const LD = roster.filter((p) => p.pos === "LD").sort((a, b) => b.ovr - a.ovr);
  const RD = roster.filter((p) => p.pos === "RD").sort((a, b) => b.ovr - a.ovr);
  const G = roster.filter((p) => p.pos === "G").sort((a, b) => b.ovr - a.ovr);
  const skaters = roster.filter((p) => p.pos !== "G");
  const forwards = [0, 1, 2, 3].map((i) => ({ LW: LW[i]?.id, C: C[i]?.id, RW: RW[i]?.id }));
  const defense = [0, 1, 2].map((i) => ({ LD: LD[i]?.id, RD: RD[i]?.id }));
  const goalies = { starter: G[0]?.id, backup: G[1]?.id };
  const pp = [...skaters].sort((a, b) => avg(b.attrs, OFFENSIVE) - avg(a.attrs, OFFENSIVE)).slice(0, 5).map((p) => p.id);
  const pk = [...skaters].sort((a, b) => avg(b.attrs, DEFENSIVE) - avg(a.attrs, DEFENSIVE)).slice(0, 4).map((p) => p.id);
  // roles : rôles demandés (id du joueur → rôle) ; vide = rôle naturel de chaque joueur.
  return { forwards, defense, goalies, pp, pk, roles: {}, strategy: { ...DEFAULT_STRATEGY }, mentality: { ...DEFAULT_MENTALITY } };
}

export function lineInfo(playerId, lines) {
  for (let i = 0; i < lines.forwards.length; i++) { const l = lines.forwards[i]; if (l.LW === playerId || l.C === playerId || l.RW === playerId) return { type: "F", idx: i, bonus: FORWARD_BONUS[i] }; }
  for (let i = 0; i < lines.defense.length; i++) { const l = lines.defense[i]; if (l.LD === playerId || l.RD === playerId) return { type: "D", idx: i, bonus: DEFENSE_BONUS[i] }; }
  if (lines.goalies.starter === playerId) return { type: "G", idx: 0, bonus: 1 };
  if (lines.goalies.backup === playerId) return { type: "G", idx: 1, bonus: 0.25 };
  return { type: "?", idx: -1, bonus: 0.7 };
}

export function lineLabel(playerId, lines) {
  const info = lineInfo(playerId, lines);
  let label = info.type === "F" ? `Trio ${info.idx + 1}` : info.type === "D" ? `Paire ${info.idx + 1}` : info.type === "G" ? (info.idx === 0 ? "Partant" : "Réserviste") : "—";
  const tags = [];
  if (lines.pp && lines.pp.includes(playerId)) tags.push("AN1");
  if (lines.pk && lines.pk.includes(playerId)) tags.push("DN1");
  return tags.length ? `${label} · ${tags.join("/")}` : label;
}
