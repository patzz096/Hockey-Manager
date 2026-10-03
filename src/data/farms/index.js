import { BOS_FARM_DATA, BUF_FARM_DATA } from "./atlantique";
import { CAR_FARM_DATA, CBJ_FARM_DATA } from "./metropolitaine";
import { CGY_FARM_DATA } from "./pacifique";

// Clubs-écoles réels (LAH) par équipe — alimente engine/league.js initLeague (buildRealFarmRoster)
// à la place du club-école généré par défaut. Les équipes absentes d'ici gardent un club-école
// généré (voir engine/players.js buildFarmRoster) jusqu'à ce qu'on ajoute leur alignement réel.
export const REAL_FARMS = {
  BOS: BOS_FARM_DATA,
  BUF: BUF_FARM_DATA,
  CAR: CAR_FARM_DATA,
  CBJ: CBJ_FARM_DATA,
  CGY: CGY_FARM_DATA,
};
