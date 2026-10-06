// Agents libres réels non signés (UFA 2026, classés par points de la dernière saison connue —
// source PuckPedia), approximatif comme le reste des alignements écrits de mémoire (voir
// rosters/centrale.js, rosters/pacifique.js). Sans contrat par définition (engine/players.js
// buildRealFreeAgents) ; un joueur apparaissant aussi dans un alignement d'équipe reflète juste
// l'incertitude sur sa situation réelle au moment de l'écriture — rien ne les empêche de coexister
// côté jeu, et tu peux republier ce fichier si ta base évolue.
export const REAL_FREE_AGENTS = [
  { name: "Marcus Johansson", pos: "C", age: 35, nationality: "SE", attrs: { offensiveRead: 74, passing: 76, shotAccuracy: 70, speed: 70 } },
  { name: "Vladimir Tarasenko", pos: "RW", age: 34, nationality: "RU", attrs: { shotAccuracy: 82, shotRange: 80, offensiveRead: 74, speed: 62 } },
  { name: "Michael Bunting", pos: "LW", age: 29, nationality: "CA", attrs: { shotAccuracy: 72, hitting: 66, aggressiveness: 70, offensiveRead: 68 } },
  { name: "James van Riemsdyk", pos: "LW", age: 36, nationality: "US", attrs: { shotAccuracy: 76, gettingOpen: 74, strength: 70, speed: 56 } },
  { name: "Evander Kane", pos: "LW", age: 34, nationality: "CA", attrs: { strength: 82, hitting: 72, shotAccuracy: 72, speed: 70 } },
  { name: "Jonathan Toews", pos: "C", age: 37, nationality: "CA", attrs: { faceoffs: 72, defensiveRead: 72, offensiveRead: 68, leadership: 80, professionalism: 82 } },
  { name: "David Perron", pos: "LW", age: 37, nationality: "CA", attrs: { offensiveRead: 72, passing: 72, shotAccuracy: 68, professionalism: 76 } },
  { name: "Reilly Smith", pos: "RW", age: 34, nationality: "CA", attrs: { offensiveRead: 70, shotAccuracy: 70, speed: 66, defensiveRead: 62 } },
  { name: "Jonathan Drouin", pos: "LW", age: 30, nationality: "CA", attrs: { passing: 76, offensiveRead: 70, puckhandling: 72 } },
  { name: "Philipp Kurashev", pos: "C", age: 26, nationality: "CH", attrs: { offensiveRead: 66, passing: 66, speed: 66 } },
  { name: "Adam Henrique", pos: "C", age: 35, nationality: "CA", attrs: { faceoffs: 64, offensiveRead: 62, professionalism: 78 } },
  { name: "Tanner Pearson", pos: "LW", age: 33, nationality: "CA", attrs: { shotAccuracy: 64, speed: 64, checking: 58 } },
  { name: "Jeff Skinner", pos: "C", age: 33, nationality: "CA", attrs: { shotAccuracy: 78, speed: 78, offensiveRead: 62, defensiveRead: 44 } },
  { name: "Gustav Nyquist", pos: "C", age: 36, nationality: "SE", attrs: { offensiveRead: 66, passing: 66, professionalism: 76 } },
  { name: "Luke Kunin", pos: "C", age: 27, nationality: "US", attrs: { hitting: 66, checking: 64, shotAccuracy: 58 } },
  { name: "Pavol Regenda", pos: "LW", age: 24, nationality: "SK", attrs: { speed: 72, shotAccuracy: 60, strength: 66 } },
  { name: "Rodrigo Abols", pos: "C", age: 29, nationality: "LV", attrs: { strength: 68, faceoffs: 56, offensiveRead: 58 } },
  { name: "Brandon Saad", pos: "LW", age: 33, nationality: "CA", attrs: { speed: 66, shotAccuracy: 60, strength: 68 } },
  { name: "Curtis Lazar", pos: "C", age: 31, nationality: "CA", attrs: { checking: 62, hitting: 60, faceoffs: 56 } },
  { name: "David Kämpf", pos: "C", age: 31, nationality: "CZ", attrs: { faceoffs: 78, defensiveRead: 76, positioning: 72, shotAccuracy: 40 } },
  { name: "Robby Fabbri", pos: "C", age: 29, nationality: "CA", attrs: { speed: 66, offensiveRead: 58, shotAccuracy: 56 } },
  { name: "Tomas Nosek", pos: "LW", age: 33, nationality: "CZ", attrs: { checking: 64, hitting: 60, defensiveRead: 58 } },
  { name: "Ryan Reaves", pos: "RW", age: 39, nationality: "CA", attrs: { fighting: 85, hitting: 78, strength: 80, aggressiveness: 80, shotAccuracy: 35 } },
  { name: "Patrik Laine", pos: "LW", age: 28, nationality: "FI", attrs: { shotAccuracy: 86, shotRange: 88, offensiveRead: 68, checking: 32, defensiveRead: 40 } },
  { name: "Evgenii Dadonov", pos: "RW", age: 36, nationality: "RU", attrs: { shotAccuracy: 64, offensiveRead: 60, speed: 58 } },

  { name: "John Klingberg", pos: "RD", age: 33, nationality: "SE", attrs: { offensiveRead: 76, passing: 76, shotAccuracy: 68, positioning: 56, defensiveRead: 54 } },
  { name: "Jeff Petry", pos: "RD", age: 38, nationality: "CA", attrs: { offensiveRead: 62, positioning: 62, passing: 62 } },
  { name: "Nick Leddy", pos: "LD", age: 34, nationality: "US", attrs: { speed: 72, offensiveRead: 60, positioning: 58 } },
  { name: "Adam Boqvist", pos: "RD", age: 25, nationality: "SE", attrs: { offensiveRead: 62, speed: 70, positioning: 50 } },
  { name: "Lassi Thomson", pos: "RD", age: 25, nationality: "FI", attrs: { shotAccuracy: 60, offensiveRead: 56, positioning: 52 } },
  { name: "Yegor Zamula", pos: "LD", age: 25, nationality: "BY", attrs: { strength: 66, positioning: 54, speed: 60 } },
  { name: "Matt Dumba", pos: "RD", age: 31, nationality: "CA", attrs: { shotAccuracy: 64, hitting: 64, strength: 70 } },
  { name: "Brendan Smith", pos: "LD", age: 36, nationality: "CA", attrs: { hitting: 62, positioning: 58, strength: 68 } },
  { name: "Travis Hamonic", pos: "RD", age: 35, nationality: "CA", attrs: { positioning: 64, defensiveRead: 62, hitting: 58 } },
  { name: "Colin Miller", pos: "RD", age: 33, nationality: "CA", attrs: { shotAccuracy: 58, offensiveRead: 54, positioning: 52 } },
  { name: "Jake Bean", pos: "LD", age: 27, nationality: "CA", attrs: { offensiveRead: 62, passing: 62, speed: 64 } },
  { name: "Derek Forbort", pos: "LD", age: 34, nationality: "US", attrs: { positioning: 60, strength: 70, defensiveRead: 58 } },
  { name: "Kevin Gravel", pos: "LD", age: 33, nationality: "US", attrs: { positioning: 54, strength: 64 } },
  { name: "Jacob Moverare", pos: "LD", age: 27, nationality: "SE", attrs: { positioning: 54, speed: 58 } },

  { name: "Matt Murray", pos: "G", age: 32, nationality: "CA", attrs: { reflexes: 78, positioning: 78, reboundControl: 74 } },
  { name: "Connor Ingram", pos: "G", age: 28, nationality: "CA", attrs: { reflexes: 72, positioning: 72, reboundControl: 68 } },
  { name: "James Reimer", pos: "G", age: 38, nationality: "CA", attrs: { reflexes: 66, positioning: 66, professionalism: 76 } },
  { name: "Petr Mrazek", pos: "G", age: 34, nationality: "CZ", attrs: { reflexes: 60, positioning: 60 } },
];
