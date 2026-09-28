import { h2Style } from "../ui/theme";
import { useSort, sortRows } from "../ui/useSort";
import { SortTh, PlayerLink, TeamCrest } from "./common";

const ratingColor = (v) => (v == null ? "var(--iceMuted)" : v >= 7 ? "var(--win)" : v >= 5.5 ? "var(--gold)" : v >= 4 ? "var(--iceMuted)" : "var(--loss)");
const fmt = (v) => (v == null ? "—" : v.toFixed(1));

// Cotes de performance sur 10 des matchs préparatoires (présaison) : utile pour juger l'effectif
// avant que la saison régulière ne compte pour vrai — voir engine/stats.js ratingsOf.
export function PreseasonRatings({ ratings, onSelectPlayer }) {
  const [sortKey, sortDir, toggleSort] = useSort("overall");
  const accessor = (r, key) => {
    if (key === "name") return r.player.name;
    if (key === "team") return r.team.name;
    if (key === "gp") return r.gp;
    if (key === "off") return r.off ?? -1;
    if (key === "def") return r.def ?? -1;
    if (key === "overall") return r.overall;
    return 0;
  };
  const sorted = sortRows(ratings, sortKey, sortDir, accessor);
  return (
    <div>
      <h2 style={h2Style}>Cotes de la présaison</h2>
      <p style={{ fontSize: 12, color: "var(--iceMuted)", marginTop: -8, marginBottom: 14 }}>
        Rendement sur 10 dans les matchs préparatoires, avant que la saison régulière ne commence à compter pour vrai. 5/10 = rendement moyen. Les gardiens sont notés sur leur fiche de décisions seulement (aucun suivi des arrêts par joueur).
      </p>
      {ratings.length === 0 ? (
        <p style={{ fontSize: 13, color: "var(--iceMuted)" }}>Aucun match préparatoire joué pour l'instant.</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead><tr>
            <SortTh label="Joueur" sortKey="name" activeKey={sortKey} activeDir={sortDir} onSort={toggleSort} />
            <SortTh label="Équipe" sortKey="team" activeKey={sortKey} activeDir={sortDir} onSort={toggleSort} />
            <SortTh label="PJ" sortKey="gp" activeKey={sortKey} activeDir={sortDir} onSort={toggleSort} />
            <SortTh label="Off." sortKey="off" activeKey={sortKey} activeDir={sortDir} onSort={toggleSort} />
            <SortTh label="Déf." sortKey="def" activeKey={sortKey} activeDir={sortDir} onSort={toggleSort} />
            <SortTh label="Général" sortKey="overall" activeKey={sortKey} activeDir={sortDir} onSort={toggleSort} />
          </tr></thead>
          <tbody>
            {sorted.map((r) => (
              <tr key={r.player.id} style={{ borderBottom: "1px solid #ffffff11" }}>
                <td style={{ padding: "6px 10px" }}><PlayerLink player={r.player} team={r.team} onSelect={onSelectPlayer} /></td>
                <td style={{ padding: "6px 10px" }}><span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><TeamCrest team={r.team} size={18} />{r.team.name}</span></td>
                <td style={{ padding: "6px 10px" }}>{r.gp}</td>
                <td style={{ padding: "6px 10px", color: ratingColor(r.off), fontWeight: 600 }}>{fmt(r.off)}</td>
                <td style={{ padding: "6px 10px", color: ratingColor(r.def), fontWeight: 600 }}>{fmt(r.def)}</td>
                <td style={{ padding: "6px 10px", color: ratingColor(r.overall), fontWeight: 700 }}>{fmt(r.overall)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
