// ---------------------------------------------------------------------------------------
// Rôles demandés aux joueurs (guide « Archétypes de joueurs et importance par position »).
// Attaquants : fabricant de jeu, franc-tireur, attaquant de puissance, deux sens, énergie.
// Défenseurs : offensif, défensif (au foyer), deux sens. Gardiens : papillon / hybride.
//
// Chaque rôle a des attributs clés (pondérés) : l'adéquation d'un joueur (-1..+1) dit s'il a le
// profil. Le rôle change sa façon de jouer dans la simulation (qui tire, qui passe, qui frappe,
// qui bloque, apport offensif / défensif) ; un joueur bien adapté en tire tout le profit, un
// joueur mal adapté joue moins bien que dans son rôle naturel.
// ---------------------------------------------------------------------------------------
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
export const ROLE_FIT_REF = 62;
export const ROLE_FIT_SPAN = 7;

export const ROLES = {
  playmaker: {
    group: "F", label: "Fabricant de jeu", en: "Playmaker", importance: "Cruciale",
    desc: "Le cerveau de l'attaque : sa vision et sa précision de passe créent des occasions pour ses coéquipiers.",
    keys: { passing: 3, offensiveRead: 3, puckhandling: 2, agility: 1, balance: 1 },
    keyText: ["Lucidité offensive", "Précision de passe", "Contrôle de la rondelle", "Patinage (agilité, équilibre)"],
    priority: "Top 6 / avantage numérique", topLines: 2, pp: true,
    examples: "Mitch Marner, Leon Draisaitl, Nikita Kucherov",
    mods: { shoot: 0.8, pass: 1.6, hit: 0.9, block: 0.9, attack: 1.04, defense: 0.98 },
  },
  sniper: {
    group: "F", label: "Franc-tireur", en: "Sniper", importance: "Élevée",
    desc: "Spécialiste de la finition : il se démarque dans les zones payantes et décoche un tir mortel.",
    keys: { shotAccuracy: 3, shotRange: 2, gettingOpen: 2, offensiveRead: 2 },
    keyText: ["Précision et puissance du tir", "Lucidité offensive", "Démarquage (dégainement rapide)"],
    priority: "Top 6 / finition", topLines: 2, pp: true,
    examples: "Alex Ovechkin, Auston Matthews, David Pastrnak",
    mods: { shoot: 1.55, pass: 0.8, hit: 0.85, block: 0.8, attack: 1.04, defense: 0.96, finish: 1.03 },
  },
  powerForward: {
    group: "F", label: "Attaquant de puissance", en: "Power forward", importance: "Très élevée",
    desc: "Imposant et habile : il gagne les batailles le long des rampes, s'installe devant le filet et crée de l'espace.",
    keys: { strength: 3, hitting: 2, checking: 1, balance: 2, puckhandling: 1, screening: 1, shotAccuracy: 1 },
    keyText: ["Force / jeu physique", "Protection de la rondelle et équilibre", "Mises en échec", "Tir du poignet et déviations"],
    priority: "Top 6 ou top 9 / créateur d'espace", topLines: 3,
    examples: "Mikko Rantanen, Matthew Tkachuk, Brady Tkachuk",
    mods: { shoot: 1.15, pass: 1.0, hit: 1.4, block: 1.0, attack: 1.02, defense: 1.0 },
  },
  twoWay: {
    group: "F", label: "Attaquant deux sens", en: "Two-way forward", importance: "Fondamentale",
    desc: "Le plus polyvalent : aussi fiable en défense qu'en attaque, souvent sur les unités spéciales et contre les meilleurs trios.",
    keys: { defensiveRead: 3, offensiveRead: 2, stickchecking: 2, faceoffs: 1, stamina: 1, professionalism: 1 },
    keyText: ["Lucidité défensive et offensive", "Bâton défensif (interceptions)", "Mises en jeu (centres)", "Endurance et discipline"],
    priority: "Tous les trios / désavantage numérique", topLines: 4, pk: true,
    examples: "Aleksander Barkov, Anze Kopitar, Sidney Crosby",
    mods: { shoot: 0.95, pass: 1.05, hit: 1.0, block: 1.15, attack: 1.0, defense: 1.04, faceoff: 5 },
  },
  grinder: {
    group: "F", label: "Attaquant d'énergie", en: "Grinder / bottom 6", importance: "Moyenne à élevée",
    desc: "Travailleur acharné des 3e et 4e trios : échec avant physique, il use la défense adverse et provoque des revirements.",
    keys: { aggressiveness: 2, checking: 2, hitting: 2, acceleration: 1, speed: 1, shotBlocking: 1, stickchecking: 1 },
    keyText: ["Agressivité et mises en échec", "Accélération et vitesse", "Blocage de tirs et bâton défensif"],
    priority: "3e-4e trio / désavantage numérique", bottomLines: true, pk: true,
    examples: "Garnet Hathaway, Brandon Tanev, Nicolas Deslauriers",
    mods: { shoot: 0.7, pass: 0.85, hit: 1.7, block: 1.25, attack: 0.97, defense: 1.03 },
  },
  offensiveD: {
    group: "D", label: "Défenseur offensif", en: "Offensive defenseman", importance: "Très élevée",
    desc: "Un 4e attaquant : il orchestre la relance, appuie l'attaque et dirige le jeu à la ligne bleue (quart-arrière en avantage numérique).",
    keys: { offensiveRead: 3, agility: 2, speed: 2, passing: 2, puckhandling: 2, shotRange: 1 },
    keyText: ["Lucidité offensive et vision", "Patinage (agilité, vitesse)", "Passe et contrôle de la rondelle", "Tir de la pointe"],
    priority: "Duo 1-2 / quart-arrière en AN", topLines: 2, pp: true,
    examples: "Cale Makar, Quinn Hughes, Adam Fox",
    mods: { shoot: 1.45, pass: 1.35, hit: 0.85, block: 0.85, attack: 1.04, defense: 0.96 },
  },
  stayHome: {
    group: "D", label: "Défenseur défensif", en: "Stay-at-home", importance: "Élevée",
    desc: "Le protecteur de l'enclave : sécurité, jeu physique, blocage de tirs et neutralisation des meilleurs attaquants.",
    keys: { defensiveRead: 3, strength: 2, hitting: 2, shotBlocking: 3, positioning: 2 },
    keyText: ["Lucidité défensive", "Blocage de tirs et dégagement du filet", "Physique / force"],
    priority: "Duo d'arrêt / désavantage numérique", pk: true,
    examples: "Jaccob Slavin, Jonas Brodin, Adam Larsson",
    mods: { shoot: 0.6, pass: 0.8, hit: 1.35, block: 1.45, attack: 0.96, defense: 1.05 },
  },
  twoWayD: {
    group: "D", label: "Défenseur deux sens", en: "Two-way defenseman", importance: "Capitale",
    desc: "Le plus complet : relance, unités spéciales, contrôle de l'écart — il joue 22 à 25 minutes dans toutes les situations.",
    keys: { offensiveRead: 2, defensiveRead: 2, agility: 2, acceleration: 1, stickchecking: 2, passing: 1, shotAccuracy: 1 },
    keyText: ["Lucidité offensive et défensive", "Patinage (arrière, transitions)", "Interceptions et bâton défensif", "Tir et passe"],
    priority: "Minutes élevées / toutes situations", topLines: 2,
    examples: "Victor Hedman, Miro Heiskanen, Roman Josi",
    mods: { shoot: 1.0, pass: 1.1, hit: 1.0, block: 1.1, attack: 1.02, defense: 1.02 },
  },
  butterfly: {
    group: "G", label: "Papillon / hybride", en: "Butterfly / hybrid", importance: "Style moderne prédominant",
    desc: "Il tombe sur les genoux pour couvrir le bas du filet en étendant les jambières, avec sa taille et ses réflexes.",
    keys: { positioning: 3, reboundControl: 2, lateralMovement: 2, flexibility: 2, temperament: 1 },
    keyText: ["Positionnement et lucidité", "Vitesse du bas du corps / rebonds", "Flexibilité et calme"],
    priority: "Gardien no 1",
    examples: "Andrei Vasilevskiy, Igor Shesterkin, Connor Hellebuyck",
    mods: {},
  },
};

export const ROLE_GROUPS = {
  F: ["playmaker", "sniper", "powerForward", "twoWay", "grinder"],
  D: ["offensiveD", "stayHome", "twoWayD"],
  G: ["butterfly"],
};
export function roleGroupOf(player) {
  return player.pos === "G" ? "G" : player.pos === "LD" || player.pos === "RD" ? "D" : "F";
}

function weighted(player, keys) {
  let s = 0, w = 0;
  Object.entries(keys).forEach(([k, x]) => { s += (player.attrs[k] ?? 60) * x; w += x; });
  return s / w;
}
// Note de profil (échelle des attributs) et adéquation (-1..+1).
export function roleScore(player, roleId) { return weighted(player, ROLES[roleId].keys); }
export function roleFit(player, roleId) { return clamp((roleScore(player, roleId) - ROLE_FIT_REF) / ROLE_FIT_SPAN, -1, 1); }

// Archétype naturel : le rôle du groupe pour lequel le joueur se démarque le plus de lui-même.
// (On compare à sa moyenne pour qu'un joueur fort partout ne soit pas « bon en tout ».)
const naturalCache = new WeakMap();
export function naturalRole(player) {
  if (player.attrs && naturalCache.has(player.attrs)) return naturalCache.get(player.attrs);
  const id = computeNaturalRole(player);
  if (player.attrs) naturalCache.set(player.attrs, id);
  return id;
}
function computeNaturalRole(player) {
  const group = ROLE_GROUPS[roleGroupOf(player)];
  const base = Object.values(player.attrs).reduce((a, b) => a + b, 0) / Object.keys(player.attrs).length;
  return group.map((id) => ({ id, v: roleScore(player, id) - base })).sort((a, b) => b.v - a.v)[0].id;
}

// Rôle demandé au joueur (choisi dans l'onglet Rôles), sinon son rôle naturel.
export function roleOf(lines, player) {
  const chosen = lines?.roles?.[player.id];
  return chosen && ROLES[chosen]?.group === roleGroupOf(player) ? chosen : naturalRole(player);
}

// Effets du rôle pour la simulation. Un joueur adapté joue le rôle à fond ; un joueur mal
// adapté le joue à moitié et perd en efficacité (la moitié de l'écart est appliquée en négatif).
export function roleMods(lines, player) {
  const id = roleOf(lines, player);
  const r = ROLES[id];
  const fit = roleFit(player, id);
  const intensity = fit >= 0 ? 1 : 1 + fit * 0.5; // 1 → 0,5
  const lerp = (m) => 1 + ((m ?? 1) - 1) * intensity;
  const quality = 1 + 0.02 * fit; // bien adapté : meilleur ; mal adapté : moins bon
  return {
    role: id, fit,
    shoot: lerp(r.mods.shoot), pass: lerp(r.mods.pass), hit: lerp(r.mods.hit), block: lerp(r.mods.block),
    // Apport offensif / défensif : léger penchant selon le rôle (quart de l'écart) plus l'effet de
    // l'adéquation ; gardé faible pour que la ligue reste calibrée (les rôles naturels penchent
    // vers l'attaque : il y a plus de francs-tireurs que de défenseurs défensifs).
    attack: (1 + (lerp(r.mods.attack) - 1) * 0.25) * quality, defense: (1 + (lerp(r.mods.defense) - 1) * 0.25) * quality, finish: 1 + (lerp(r.mods.finish) - 1) * 0.5,
    faceoff: (r.mods.faceoff || 0) * Math.max(0, fit),
  };
}

// Avertissements tactiques pour un rôle selon l'utilisation du joueur (trio, unités spéciales).
export function roleWarnings(roleId, info, onPP, onPK) {
  const r = ROLES[roleId], out = [];
  if (!info || info.idx < 0) return out;
  const unit = info.idx + 1;
  if (r.bottomLines && unit <= 2 && info.type === "F") out.push(`Rôle prévu pour les 3e-4e trios : sur le trio ${unit}, il prive tes meilleurs joueurs de minutes offensives.`);
  if (r.topLines && unit > r.topLines && info.type !== "G") out.push(`Priorité tactique : ${r.priority}. Sur ${info.type === "D" ? "la paire" : "le trio"} ${unit}, son rôle est sous-utilisé.`);
  if (r.pp && !onPP && unit <= 2) out.push("Profil d'avantage numérique : pense à l'inscrire sur ton unité d'AN.");
  if (r.pk && onPP && !onPK && roleId === "grinder") out.push("Profil de désavantage numérique plutôt que d'avantage numérique.");
  return out;
}

// Rôles naturels pour tout l'alignement.
export function naturalRoles(roster) {
  return Object.fromEntries(roster.filter((p) => p.pos !== "G").map((p) => [p.id, naturalRole(p)]));
}
