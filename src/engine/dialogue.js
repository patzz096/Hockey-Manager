// Banques de phrases variées pour la messagerie (App.jsx addMessage) : évite que le même
// message générique revienne mot pour mot chaque fois (blessure, rappel du club-école,
// dépistage, personnel, demande d'échange...) — même principe que tradePitchLine/agentLine
// (engine/trades.js, engine/contracts.js), ici pour les messages qui n'ont pas déjà leur banque
// dédiée. Chaque fonction choisit une phrase au hasard (rng par défaut Math.random, puisque ces
// messages ne font pas partie de la simulation déterministe — voir CLAUDE.md).
function pick(list, rng = Math.random) { return list[Math.floor(rng() * list.length)]; }

const INJURY_LINES = [
  "On vient de l'examiner, voici le topo :",
  "Je sors tout juste de l'évaluation médicale :",
  "Mauvaise nouvelle du côté du personnel soignant :",
  "L'équipe médicale m'a remis son rapport :",
];
export function injuryLine(rng) { return pick(INJURY_LINES, rng); }

const RETURN_LINES = [
  "Bonne nouvelle, le feu vert médical est donné.",
  "Il vient de passer ses derniers tests — tout est beau.",
  "Le personnel soignant l'a officiellement réintégré.",
  "Il est prêt à rechausser les patins.",
];
export function returnLine(rng) { return pick(RETURN_LINES, rng); }

const RECALL_LINES = [
  "On en a besoin tout de suite dans l'alignement.",
  "Décision prise ce matin : il monte avec le grand club.",
  "Le personnel hockey le réclame en haut.",
  "Rappelé — direction l'alignement.",
];
export function recallLine(rng) { return pick(RECALL_LINES, rng); }

const DEMOTE_LINES = [
  "On a besoin de la place dans l'alignement pour l'instant.",
  "Décision d'alignement, rien de plus — il garde du temps de jeu en le renvoyant.",
  "Il redescend se refaire un rythme de jeu.",
  "On le renvoie se développer un peu plus.",
];
export function demoteLine(rng) { return pick(DEMOTE_LINES, rng); }

const WAIVERS_LINES = [
  "Pas le choix, il doit passer par le ballottage cette fois.",
  "Les règles nous obligent à l'exposer aux 30 autres équipes avant de le renvoyer.",
  "Il n'est plus exempté — direction le ballottage pour 24 heures.",
];
export function waiversLine(rng) { return pick(WAIVERS_LINES, rng); }

const SCOUT_CANCEL_LINES = [
  "Désolé, la cible n'est plus disponible — mission annulée.",
  "On a dû l'annuler, le joueur n'est plus sur le marché.",
  "Mission caduque : il a signé ailleurs (ou n'est plus agent libre) avant qu'on puisse conclure.",
];
export function scoutCancelLine(rng) { return pick(SCOUT_CANCEL_LINES, rng); }

const SCOUT_REPORT_INTRO_LINES = [
  "Je reviens tout juste de la route, voici ce que j'ai vu :",
  "Rapport complet ci-dessous, j'ai pu bien l'évaluer cette fois.",
  "Quelques matchs à l'œil cette semaine — mes observations :",
  "Voilà ce que ça donne après l'avoir suivi de près :",
];
export function scoutReportIntroLine(rng) { return pick(SCOUT_REPORT_INTRO_LINES, rng); }

const STAFF_ACCEPT_LINES = [
  "Marché conclu, j'ai hâte de commencer.",
  "C'est oui — on signe.",
  "Ça me va, je me joins à l'organisation.",
  "Entendu, je suis prêt à embarquer.",
];
export function staffAcceptLine(rng) { return pick(STAFF_ACCEPT_LINES, rng); }

const STAFF_REJECT_LINES = [
  "Désolé, ce n'est pas suffisant pour moi.",
  "J'ai d'autres options plus intéressantes en ce moment.",
  "Ça ne correspond pas à ce que je cherche, désolé.",
  "Je vais devoir décliner, mais rien de personnel.",
];
export function staffRejectLine(rng) { return pick(STAFF_REJECT_LINES, rng); }

// Ton du joueur qui demande l'échange — varie avec sa raison principale (voir App.jsx
// tradeRequested) sans dupliquer la logique d'évaluation déjà faite ailleurs.
const TRADE_REQUEST_LINES = [
  "Honnêtement, je ne me vois plus ici.",
  "J'ai besoin d'un nouveau départ ailleurs.",
  "Ça fait un moment que j'y pense — c'est le temps pour moi de partir.",
  "Je préfère être franc avec toi : je veux être échangé.",
];
export function tradeRequestLine(rng) { return pick(TRADE_REQUEST_LINES, rng); }

const DEV_REPORT_INTRO_LINES = [
  "Voici mon topo après cette période de développement :",
  "Je viens de terminer mon évaluation du groupe :",
  "Quelques mouvements à signaler du côté du développement :",
];
export function devReportIntroLine(rng) { return pick(DEV_REPORT_INTRO_LINES, rng); }
