import { BOS_FARM_DATA, BUF_FARM_DATA, DET_FARM_DATA, FLA_FARM_DATA, MTL_FARM_DATA, OTT_FARM_DATA } from "./atlantique";
import { CAR_FARM_DATA, CBJ_FARM_DATA, NJD_FARM_DATA, NYI_FARM_DATA, NYR_FARM_DATA, PHI_FARM_DATA, PIT_FARM_DATA } from "./metropolitaine";
import { CGY_FARM_DATA, EDM_FARM_DATA, LAK_FARM_DATA, SEA_FARM_DATA, SJS_FARM_DATA } from "./pacifique";
import { CHI_FARM_DATA, COL_FARM_DATA, DAL_FARM_DATA, MIN_FARM_DATA, NSH_FARM_DATA } from "./centrale";

// Clubs-écoles réels (LAH) par équipe — alimente engine/league.js initLeague (buildRealFarmRoster)
// à la place du club-école généré par défaut. Les équipes absentes d'ici gardent un club-école
// généré (voir engine/players.js buildFarmRoster) jusqu'à ce qu'on ajoute leur alignement réel.
export const REAL_FARMS = {
  BOS: BOS_FARM_DATA,
  BUF: BUF_FARM_DATA,
  DET: DET_FARM_DATA,
  FLA: FLA_FARM_DATA,
  MTL: MTL_FARM_DATA,
  OTT: OTT_FARM_DATA,
  CAR: CAR_FARM_DATA,
  CBJ: CBJ_FARM_DATA,
  NJD: NJD_FARM_DATA,
  NYI: NYI_FARM_DATA,
  NYR: NYR_FARM_DATA,
  PHI: PHI_FARM_DATA,
  PIT: PIT_FARM_DATA,
  CGY: CGY_FARM_DATA,
  EDM: EDM_FARM_DATA,
  LAK: LAK_FARM_DATA,
  SEA: SEA_FARM_DATA,
  SJS: SJS_FARM_DATA,
  CHI: CHI_FARM_DATA,
  COL: COL_FARM_DATA,
  DAL: DAL_FARM_DATA,
  MIN: MIN_FARM_DATA,
  NSH: NSH_FARM_DATA,
};
