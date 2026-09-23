import { MTL_ROSTER_DATA, TOR_ROSTER_DATA, BOS_ROSTER_DATA, BUF_ROSTER_DATA, DET_ROSTER_DATA, FLA_ROSTER_DATA, OTT_ROSTER_DATA, TBL_ROSTER_DATA } from "./atlantique";
import NHL_IMPORT from "./nhl-import.json";
import { CAR_ROSTER_DATA, NYR_ROSTER_DATA, NYI_ROSTER_DATA, NJD_ROSTER_DATA, PHI_ROSTER_DATA, PIT_ROSTER_DATA, WSH_ROSTER_DATA, CBJ_ROSTER_DATA } from "./metropolitaine";

// Alignements faits à la main (avec contrats connus).
const HANDMADE_ROSTERS = {
  MTL: MTL_ROSTER_DATA, TOR: TOR_ROSTER_DATA, BOS: BOS_ROSTER_DATA, BUF: BUF_ROSTER_DATA,
  DET: DET_ROSTER_DATA, FLA: FLA_ROSTER_DATA, OTT: OTT_ROSTER_DATA, TBL: TBL_ROSTER_DATA,
  CAR: CAR_ROSTER_DATA, NYR: NYR_ROSTER_DATA, NYI: NYI_ROSTER_DATA, NJD: NJD_ROSTER_DATA,
  PHI: PHI_ROSTER_DATA, PIT: PIT_ROSTER_DATA, WSH: WSH_ROSTER_DATA, CBJ: CBJ_ROSTER_DATA,
};

// Alignements réels par identifiant d'équipe : faits à la main + import de l'API LNH
// (scripts/import-nhl-rosters.mjs). Les équipes absentes ont un alignement généré.
export const REAL_ROSTERS = NHL_IMPORT.replaceHandmade
  ? { ...HANDMADE_ROSTERS, ...NHL_IMPORT.teams }
  : { ...NHL_IMPORT.teams, ...HANDMADE_ROSTERS };
