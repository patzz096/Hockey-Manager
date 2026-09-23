import { seededRandom, poisson } from "./random";

// ---------------------------------------------------------------------------------------
// Ligues mineures, juniors et européennes : les espoirs et les joueurs du club-école y jouent.
// Pas de calendrier match par match : une simulation rapide (« quick sim ») produit la ligne
// de statistiques de la saison selon l'habileté du joueur face au niveau de sa ligue.
// Les résultats sont déterministes (graine = joueur + saison) et progressifs : la ligne grandit
// avec l'avancement du calendrier, match après match, sans jamais changer le passé.
// ref : habileté moyenne d'un joueur de la ligue (échelle des cotes du jeu).
// ---------------------------------------------------------------------------------------

export const MINOR_LEAGUES = {
  AHL: { short: "LAH", name: "Ligue américaine de hockey", region: "pro", ref: 55, gp: 72 },
  QMJHL: { short: "LHJMQ", name: "Ligue de hockey junior Maritimes Québec", region: "quebec", ref: 44, gp: 68 },
  OHL: { short: "OHL", name: "Ligue de hockey de l'Ontario", region: "ontario", ref: 45, gp: 68 },
  WHL: { short: "WHL", name: "Ligue de hockey de l'Ouest", region: "west", ref: 45, gp: 68 },
  NCAA: { short: "NCAA", name: "NCAA, division I", region: "usa", ref: 47, gp: 36 },
  USHL: { short: "USHL", name: "United States Hockey League", region: "usa", ref: 42, gp: 62 },
  SHL: { short: "SHL", name: "Swedish Hockey League", region: "sweden", ref: 53, gp: 52 },
  J20: { short: "J20", name: "J20 Nationell (Suède)", region: "sweden", ref: 41, gp: 42 },
  LIIGA: { short: "Liiga", name: "Liiga (Finlande)", region: "finland", ref: 51, gp: 60 },
  U20FI: { short: "U20", name: "U20 SM-sarja (Finlande)", region: "finland", ref: 41, gp: 44 },
  KHL: { short: "KHL", name: "Kontinental Hockey League", region: "russia", ref: 55, gp: 68 },
  MHL: { short: "MHL", name: "Ligue junior de Russie (MHL)", region: "russia", ref: 42, gp: 60 },
  CZE: { short: "Extraliga", name: "Extraliga tchèque", region: "central", ref: 50, gp: 52 },
  NL: { short: "NL", name: "National League (Suisse)", region: "central", ref: 51, gp: 52 },
  DEL: { short: "DEL", name: "Deutsche Eishockey Liga", region: "central", ref: 49, gp: 52 },
};

const CLUBS = {
  QMJHL: ["Remparts de Québec", "Voltigeurs de Drummondville", "Tigres de Victoriaville", "Wildcats de Moncton", "Mooseheads de Halifax", "Saguenéens de Chicoutimi", "Olympiques de Gatineau", "Huskies de Rouyn-Noranda", "Phoenix de Sherbrooke", "Cataractes de Shawinigan"],
  OHL: ["Knights de London", "Generals d'Oshawa", "Spirit de Saginaw", "Petes de Peterborough", "Rangers de Kitchener", "Otters d'Érié", "67's d'Ottawa", "Bulldogs de Brantford", "Frontenacs de Kingston", "Sting de Sarnia"],
  WHL: ["Oil Kings d'Edmonton", "Hitmen de Calgary", "Giants de Vancouver", "Winterhawks de Portland", "Blades de Saskatoon", "Pats de Regina", "Rockets de Kelowna", "Thunderbirds de Seattle", "Wheat Kings de Brandon", "Warriors de Moose Jaw"],
  NCAA: ["Boston University", "Université du Michigan", "Université du Minnesota", "Université de Denver", "North Dakota", "Boston College", "Université du Wisconsin", "Michigan State"],
  USHL: ["Black Hawks de Waterloo", "Musketeers de Sioux City", "Steel de Chicago", "Gamblers de Green Bay", "Fighting Saints de Dubuque", "Programme national (NTDP)"],
  SHL: ["Frölunda HC", "Färjestad BK", "Skellefteå AIK", "Luleå HF", "Djurgårdens IF", "HV71"],
  J20: ["Frölunda J20", "Färjestad J20", "Skellefteå J20", "Luleå J20", "Djurgården J20", "HV71 J20"],
  LIIGA: ["Tappara", "Kärpät", "HIFK", "TPS", "Ilves", "Lukko"],
  U20FI: ["Tappara U20", "Kärpät U20", "HIFK U20", "TPS U20", "Ilves U20", "Lukko U20"],
  KHL: ["CSKA Moscou", "SKA Saint-Pétersbourg", "Ak Bars Kazan", "Metallourg Magnitogorsk", "Dynamo Moscou", "Avangard Omsk"],
  MHL: ["Krasnaïa Armia (CSKA)", "SKA-1946", "Irbis Kazan", "Stalnye Lissy", "MHK Dynamo", "Omskie Iastreby"],
  CZE: ["Sparta Prague", "HC Pardubice", "Oceláři Třinec", "Kometa Brno", "HC Plzeň", "Mountfield HK"],
  NL: ["ZSC Lions", "HC Davos", "Genève-Servette", "Lausanne HC", "EV Zug", "SC Berne"],
  DEL: ["Eisbären Berlin", "Adler Mannheim", "Red Bull Munich", "Kölner Haie", "Grizzlys Wolfsburg", "Straubing Tigers"],
};

// Zones de dépistage (à la FM) : chaque zone regroupe des ligues ; « pro » couvre la LNH et la LAH.
export const SCOUT_REGIONS = [
  { id: "quebec", label: "Québec et Maritimes", leagues: ["QMJHL"] },
  { id: "ontario", label: "Ontario", leagues: ["OHL"] },
  { id: "west", label: "Ouest canadien et Nord-Ouest américain", leagues: ["WHL"] },
  { id: "usa", label: "États-Unis (NCAA, USHL)", leagues: ["NCAA", "USHL"] },
  { id: "sweden", label: "Suède", leagues: ["SHL", "J20"] },
  { id: "finland", label: "Finlande", leagues: ["LIIGA", "U20FI"] },
  { id: "russia", label: "Russie", leagues: ["KHL", "MHL"] },
  { id: "central", label: "Europe centrale (Tchéquie, Suisse, Allemagne)", leagues: ["CZE", "NL", "DEL"] },
  { id: "pro", label: "Professionnels (LNH, LAH, agents libres)", leagues: ["AHL", "NHL"] },
];
export const regionOfLeague = (leagueId) => (leagueId === "NHL" ? "pro" : MINOR_LEAGUES[leagueId]?.region || null);

function hash(s) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return (h % 233279) + 1; }
const pick = (arr, rng) => arr[Math.floor(rng() * arr.length)];

// Ligue d'un espoir selon sa nationalité, son âge et son niveau (les meilleurs jeunes Européens
// jouent déjà chez les adultes, les Canadiens dans la LCH, les Américains surtout en NCAA/USHL).
export function assignJuniorLeague(player, rng = seededRandom(hash(player.id))) {
  const r = rng();
  const strong = player.ovr >= 50;
  let league;
  switch (player.nationality) {
    case "CA": league = r < 0.36 ? "OHL" : r < 0.66 ? "QMJHL" : r < 0.94 ? "WHL" : "NCAA"; break;
    case "US": league = r < 0.45 ? "NCAA" : r < 0.8 ? "USHL" : "OHL"; break;
    case "SE": league = strong && r < 0.7 ? "SHL" : "J20"; break;
    case "FI": league = strong && r < 0.7 ? "LIIGA" : "U20FI"; break;
    case "RU": league = strong && r < 0.5 ? "KHL" : "MHL"; break;
    case "CZ": case "SK": league = r < 0.75 ? "CZE" : "QMJHL"; break;
    case "CH": league = "NL"; break;
    case "DE": league = r < 0.8 ? "DEL" : "OHL"; break;
    default: league = "OHL";
  }
  return { league, club: pick(CLUBS[league], rng) };
}

// Ligue actuelle d'un joueur hors LNH : la sienne, sinon la LAH pour le club-école.
export function leagueOf(player, teamName) {
  if (player.league) return { league: player.league, club: player.club || MINOR_LEAGUES[player.league]?.short };
  if (player.level === "LAH") return { league: "AHL", club: teamName ? `Club-école de ${teamName}` : "Club-école (LAH)" };
  return null;
}

// Un espoir qui atteint 21 ans quitte le junior pour la LAH (règle de la LCH : 20 ans et moins).
export function promoteFromJunior(player) {
  const junior = ["QMJHL", "OHL", "WHL", "USHL", "J20", "U20FI", "MHL"];
  if (player.level === "LAH" && junior.includes(player.league) && player.age > 20) return { ...player, league: undefined, club: undefined };
  return player;
}

// Avancement de la saison des ligues mineures (0 à 1) : du 7 octobre à la fin mars environ.
export function minorSeasonFraction(day, seasonStart) {
  return Math.max(0, Math.min(1, (day - seasonStart) / 175));
}

const cache = new Map();
// Ligne de statistiques de la saison `year`, jouée à `fraction` : patineurs (PJ, B, A, PTS, PUN,
// +/-) ou gardiens (PJ, V, D, MOY, %ARR, BL).
export function minorSeasonStats(player, leagueId, year, fraction = 1) {
  const lg = MINOR_LEAGUES[leagueId];
  if (!lg) return null;
  const rng = seededRandom(hash(`${player.id}|${year}|${leagueId}`));
  const fullGp = Math.round(lg.gp * (0.75 + rng() * 0.25));
  const gp = Math.floor(fullGp * fraction);
  const key = `${player.id}|${year}|${leagueId}|${gp}|${player.ovr}`;
  if (cache.has(key)) return cache.get(key);
  const edge = player.ovr - lg.ref;
  let line;
  if (player.pos === "G") {
    const starts = Math.round(gp * Math.max(0.3, Math.min(0.85, 0.55 + edge * 0.03)));
    const sv = Math.max(0.86, Math.min(0.935, 0.897 + edge * 0.0025));
    let ga = 0, sa = 0, w = 0, so = 0;
    for (let i = 0; i < starts; i++) {
      const shots = 24 + Math.floor(rng() * 12);
      let g = 0; for (let s = 0; s < shots; s++) if (rng() > sv) g++;
      sa += shots; ga += g; if (g === 0) so++;
      if (rng() < 0.5 + edge * 0.015 - (g - 2.7) * 0.12) w++;
    }
    line = { league: leagueId, gp: starts, w, l: starts - w, gaa: starts ? ga / starts : 0, svPct: sa ? 1 - ga / sa : 0, so };
  } else {
    const isD = player.pos === "LD" || player.pos === "RD";
    // L'avantage sur la ligue est plafonné : un junior dominant reste sous ~1,8 point par match.
    const rate = (isD ? 0.3 : 0.58) * Math.exp(Math.max(-15, Math.min(10, edge)) / 9);
    const goalShare = isD ? 0.25 : 0.42;
    let g = 0, a = 0, pim = 0, pm = 0;
    const pimRate = 0.25 + ((player.attrs.aggressiveness ?? 50) / 100) * 0.6;
    for (let i = 0; i < gp; i++) {
      const pts = poisson(Math.min(3, rate), rng);
      for (let k = 0; k < pts; k++) { if (rng() < goalShare) g++; else a++; }
      pim += poisson(pimRate, rng) * 2;
      pm += Math.round((rng() - 0.5) * 2.2 + edge * 0.02);
    }
    line = { league: leagueId, gp, g, a, pts: g + a, pim, pm };
  }
  cache.set(key, line);
  return line;
}
