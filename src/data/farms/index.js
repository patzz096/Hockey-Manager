import { BOS_FARM_DATA } from "./atlantique";

// Clubs-écoles réels (LAH) par équipe — alimente engine/league.js initLeague (buildRealFarmRoster)
// à la place du club-école généré par défaut. Les équipes absentes d'ici gardent un club-école
// généré (voir engine/players.js buildFarmRoster) jusqu'à ce qu'on ajoute leur alignement réel.
export const REAL_FARMS = {
  BOS: BOS_FARM_DATA,
};
