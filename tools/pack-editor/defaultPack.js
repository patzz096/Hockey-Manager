// Base par défaut du jeu, au format pack (sans images), pour démarrer l'éditeur.
import { initLeague } from "../../src/engine/league";
import { buildPack } from "../../src/custom/pack";
import { NATION_NAME } from "../../src/data/names";
import { ATTR_LABELS, SKATER_CATEGORIES, GOALIE_CATEGORIES } from "../../src/engine/attributes";
import { capFor } from "../../src/engine/cap";
import { minSalaryFor, maxSalaryFor, CURRENT_YEAR } from "../../src/engine/contracts";

export async function editorData() {
  const lg = initLeague();
  const pack = await buildPack(lg.teams, {}, { name: "Base du jeu Hockey GM", author: "Hockey GM" });
  const cats = (list) => list.map((c) => ({ label: c.label, attrs: c.attrs }));
  return {
    pack,
    nations: NATION_NAME,
    attrLabels: ATTR_LABELS,
    skaterCats: cats(SKATER_CATEGORIES),
    goalieCats: cats(GOALIE_CATEGORIES),
    rules: { cap: capFor(CURRENT_YEAR) / 1000, min: minSalaryFor(CURRENT_YEAR) / 1000, max: maxSalaryFor(CURRENT_YEAR) / 1000, season: `${CURRENT_YEAR}-${String(CURRENT_YEAR + 1).slice(2)}` },
  };
}
