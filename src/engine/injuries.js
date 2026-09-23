// Blessures et liste des blessés à long terme (LTIR).
//  - Après chaque match, chaque équipe peut perdre un joueur (≈ 1 blessure par 6 matchs).
//  - Durée : surtout des blessures « au jour le jour », parfois plusieurs semaines ou mois.
//  - Un joueur blessé ne joue pas : il est remplacé dans les trios par le meilleur disponible.
//  - LTIR (règle LNH) : un joueur qui sera absent au moins 24 jours et 10 matchs peut y être
//    placé ; il libère une place dans l'alignement et son salaire devient un allègement qui
//    permet de dépasser le plafond pendant son absence.
export const INJURY_RATE = 0.16;
export const LTIR_MIN_DAYS = 24;
const TYPES = ["Haut du corps", "Bas du corps", "Commotion cérébrale", "Genou", "Épaule", "Cheville", "Main", "Dos", "Aine"];

// Durée en jours : 55 % au jour le jour, 28 % 1-3 semaines, 12 % 3-8 semaines, 5 % 2-5 mois.
export function injuryDuration(rng) {
  const r = rng();
  if (r < 0.55) return 1 + Math.floor(rng() * 6);
  if (r < 0.83) return 7 + Math.floor(rng() * 15);
  if (r < 0.95) return 22 + Math.floor(rng() * 35);
  return 60 + Math.floor(rng() * 90);
}

// Tire les blessures d'un match joué le jour `day`. Les joueurs physiques et les gros temps de
// glace sont un peu plus exposés. Renvoie { [playerId]: blessure }.
export function injuriesFromGame(game, teamsById, day, rng) {
  const out = {};
  [["home", game.home], ["away", game.away]].forEach(([side, teamId]) => {
    if (rng() >= INJURY_RATE) return;
    const toi = game.box?.[side]?.toiBy || {};
    const skaters = teamsById[teamId].roster.filter((p) => p.pos !== "G" && (toi[p.id] || 0) > 0);
    const pool = skaters.length ? skaters : teamsById[teamId].roster.filter((p) => p.pos !== "G");
    if (!pool.length) return;
    const weights = pool.map((p) => (toi[p.id] || 10) * (0.7 + (p.attrs.hitting + p.attrs.bravery) / 330));
    let r = rng() * weights.reduce((a, b) => a + b, 0), pick = pool[0];
    for (let i = 0; i < pool.length; i++) { r -= weights[i]; if (r <= 0) { pick = pool[i]; break; } }
    const days = injuryDuration(rng);
    out[pick.id] = { playerId: pick.id, teamId, type: TYPES[Math.floor(rng() * TYPES.length)], since: day, until: day + days, ltir: false };
  });
  return out;
}

export function isInjured(injuries, playerId, day) { const i = injuries[playerId]; return !!i && i.until > day; }
export function activeInjuries(injuries, day) {
  return Object.fromEntries(Object.entries(injuries).filter(([, i]) => i.until > day));
}
export function ltirEligible(injury, day) { return !!injury && injury.until - day >= LTIR_MIN_DAYS; }

export function injuryLabel(injury, day) {
  const left = injury.until - day;
  return `${injury.type} — ${left <= 6 ? "au jour le jour" : left < 21 ? `${Math.ceil(left / 7)} sem.` : `${Math.round(left / 30) || 1} mois`}`;
}

// Équipe telle qu'elle se présente au match : sans les blessés, trios complétés par les
// meilleurs joueurs disponibles à la même position (sinon n'importe quel patineur).
export function dressTeam(team, lines, injuries, day) {
  const hurt = (id) => isInjured(injuries, id, day);
  if (!team.roster.some((p) => hurt(p.id))) return { team, lines };
  const roster = team.roster.filter((p) => !hurt(p.id));
  const used = new Set();
  const inRoster = (id) => id && roster.some((p) => p.id === id);
  const keep = (id) => { if (inRoster(id)) { used.add(id); return id; } return null; };
  const forwards = lines.forwards.map((l) => ({ LW: keep(l.LW), C: keep(l.C), RW: keep(l.RW) }));
  const defense = lines.defense.map((l) => ({ LD: keep(l.LD), RD: keep(l.RD) }));
  const goalies = { starter: keep(lines.goalies.starter), backup: keep(lines.goalies.backup) };
  const best = (positions) => {
    const pool = roster.filter((p) => !used.has(p.id)).sort((a, b) => b.ovr - a.ovr);
    const p = pool.find((x) => positions.includes(x.pos)) || pool.find((x) => x.pos !== "G" && !positions.includes("G")) || null;
    if (p) used.add(p.id);
    return p?.id;
  };
  const posFor = { LW: ["LW", "RW"], C: ["C"], RW: ["RW", "LW"], LD: ["LD", "RD"], RD: ["RD", "LD"] };
  forwards.forEach((l) => ["C", "LW", "RW"].forEach((k) => { if (!l[k]) l[k] = best(posFor[k]); }));
  defense.forEach((l) => ["LD", "RD"].forEach((k) => { if (!l[k]) l[k] = best(posFor[k]); }));
  if (!goalies.starter) goalies.starter = best(["G"]);
  if (!goalies.backup) goalies.backup = best(["G"]);
  const unit = (ids, n) => { const kept = (ids || []).filter((id) => inRoster(id)); const extra = roster.filter((p) => p.pos !== "G" && !kept.includes(p.id)).sort((a, b) => b.ovr - a.ovr).map((p) => p.id); return [...kept, ...extra].slice(0, n); };
  return { team: { ...team, roster }, lines: { ...lines, forwards, defense, goalies, pp: unit(lines.pp, 5), pk: unit(lines.pk, 4) } };
}
