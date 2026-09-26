import { teamOvrBenchmark, starsFor } from "../engine/attributes";
import { lineLabel } from "../engine/lines";
import { getScoutInfo } from "../engine/scouting";
import { BASE_CONDITION, conditionColor, conditionLabel } from "../engine/training";
import { contractLabel } from "../ui/format";
import { scoutQualityColor } from "../ui/theme";
import { useSort, sortRows } from "../ui/useSort";
import { SortTh, StarRating, PlayerFace, InjuryBadge } from "./common";

export function RosterTable({ roster, lines, staff, myTeamId, teamId, scoutKnowledge, onSelect, onContextMenu, injuries = {}, day = 0 }) {
  const [sortKey, sortDir, toggleSort] = useSort("ovr");
  const benchmark = teamOvrBenchmark({ roster });
  const accessor = (p, key) => {
    if (key === "number") return p.number ?? -1;
    if (key === "name") return p.name;
    if (key === "pos") return p.pos;
    if (key === "age") return p.age;
    if (key === "line") return lineLabel(p.id, lines);
    if (key === "ovr") return p.ovr;
    if (key === "potential") return p.potential;
    if (key === "condition") return p.condition ?? BASE_CONDITION;
    if (key === "salary") return p.contract?.salary || 0;
    return 0;
  };
  const sorted = sortRows(roster, sortKey, sortDir, accessor);
  return (
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
      <thead><tr>
        <SortTh label="#" sortKey="number" activeKey={sortKey} activeDir={sortDir} onSort={toggleSort} />
        <SortTh label="Joueur" sortKey="name" activeKey={sortKey} activeDir={sortDir} onSort={toggleSort} />
        <SortTh label="Pos" sortKey="pos" activeKey={sortKey} activeDir={sortDir} onSort={toggleSort} />
        <SortTh label="Âge" sortKey="age" activeKey={sortKey} activeDir={sortDir} onSort={toggleSort} />
        <SortTh label="Trio/Paire" sortKey="line" activeKey={sortKey} activeDir={sortDir} onSort={toggleSort} />
        <SortTh label="Cote actuelle" sortKey="ovr" activeKey={sortKey} activeDir={sortDir} onSort={toggleSort} />
        <SortTh label="Potentiel" sortKey="potential" activeKey={sortKey} activeDir={sortDir} onSort={toggleSort} />
        <SortTh label="Forme" sortKey="condition" activeKey={sortKey} activeDir={sortDir} onSort={toggleSort} />
        <SortTh label="Contrat" sortKey="salary" activeKey={sortKey} activeDir={sortDir} onSort={toggleSort} />
        <th></th>
      </tr></thead>
      <tbody>
        {sorted.map((p) => {
          const scoutInfo = getScoutInfo(p, teamId, myTeamId, staff, scoutKnowledge);
          const qColor = scoutQualityColor(scoutInfo.quality);
          const cond = p.condition ?? BASE_CONDITION;
          return (
          <tr key={p.id} onClick={() => onSelect(p)} onContextMenu={onContextMenu ? (e) => { e.preventDefault(); onContextMenu(e, p); } : undefined} style={{ borderBottom: "1px solid #ffffff11", cursor: "pointer" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#ffffff0a")} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
            <td style={{ padding: "7px 10px", color: "var(--iceMuted)" }}>{p.number ?? "—"}</td>
            <td style={{ padding: "5px 10px" }}><span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><PlayerFace player={p} size={26} />{p.name}{lines?.captain === p.id && <span title="Capitaine" style={{ fontSize: 10, fontWeight: 700, color: "var(--gold)", border: "1px solid var(--gold)", borderRadius: 3, padding: "0 4px" }}>C</span>}{(lines?.alternates || []).includes(p.id) && <span title="Adjoint" style={{ fontSize: 10, fontWeight: 700, color: "var(--iceMuted)", border: "1px solid var(--iceMuted)", borderRadius: 3, padding: "0 4px" }}>A</span>}<InjuryBadge injury={injuries[p.id]} day={day} /></span></td>
            <td style={{ padding: "7px 10px" }}>{p.pos}</td>
            <td style={{ padding: "7px 10px" }}>{p.age}</td>
            <td style={{ padding: "7px 10px", color: "var(--iceMuted)" }}>{lineLabel(p.id, lines)}</td>
            <td style={{ padding: "7px 10px" }}><StarRating value={starsFor(p.ovr, benchmark)} size={12} color={qColor} /></td>
            <td style={{ padding: "7px 10px" }}><StarRating value={starsFor(p.potential, benchmark)} size={12} color={qColor === "var(--gold)" ? "#7A9EDB" : "var(--iceMuted)"} /></td>
            <td style={{ padding: "7px 10px" }}><span title={conditionLabel(cond)} style={{ fontSize: 12, fontWeight: 600, color: conditionColor(cond) }}>{cond}</span></td>
            <td style={{ padding: "7px 10px", color: "var(--iceMuted)", fontSize: 12 }}>{contractLabel(p.contract)}</td>
            <td style={{ padding: "7px 10px", color: "var(--iceMuted)", fontSize: 12 }}>Profil ›</td>
          </tr>
          );
        })}
      </tbody>
    </table>
  );
}
