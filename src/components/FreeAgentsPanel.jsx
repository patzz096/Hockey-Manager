import { teamOvrBenchmark, starsFor } from "../engine/attributes";
import { getScoutInfo, perceivedRatings } from "../engine/scouting";
import { draftLabel } from "../ui/format";
import { h2Style, btnStyle, scoutQualityColor } from "../ui/theme";
import { useSort, sortRows } from "../ui/useSort";
import { SortTh, StarRating, PlayerLink } from "./common";

export function FreeAgentsPanel({ myTeam, myTeamId, staff, scoutKnowledge, pendingScouts, onRequestScout, onSelectPlayer, freeAgents, onSign, onRefreshFreeAgents }) {
  const [fak, fad, faToggle] = useSort("ovr");
  const faAcc = (p, key) => {
    if (key === "draft") return p.draftPick || 9999;
    if (key === "ovr") { const info = getScoutInfo(p, null, myTeamId, staff, scoutKnowledge); return info.known ? perceivedRatings(p, info).ovr : -1; }
    return p[key];
  };
  const sortedFreeAgents = sortRows(freeAgents, fak, fad, faAcc);
  const benchmark = teamOvrBenchmark(myTeam);
  return (
    <div>
      <h2 style={h2Style}>Agents libres</h2>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: -8, marginBottom: 12 }}>
        <p style={{ fontSize: 12, color: "var(--iceMuted)" }}>Joueurs sans contrat, disponibles pour négociation.</p>
        <button onClick={onRefreshFreeAgents} style={btnStyle("var(--steel)")}>Rafraîchir le marché</button>
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
        <thead><tr>
          <SortTh label="Joueur" sortKey="name" activeKey={fak} activeDir={fad} onSort={faToggle} />
          <SortTh label="Pos" sortKey="pos" activeKey={fak} activeDir={fad} onSort={faToggle} />
          <SortTh label="Âge" sortKey="age" activeKey={fak} activeDir={fad} onSort={faToggle} />
          <SortTh label="Cote" sortKey="ovr" activeKey={fak} activeDir={fad} onSort={faToggle} />
          <SortTh label="Repêché" sortKey="draft" activeKey={fak} activeDir={fad} onSort={faToggle} />
          <th></th>
        </tr></thead>
        <tbody>
          {sortedFreeAgents.map((p) => {
            const scoutInfo = getScoutInfo(p, null, myTeamId, staff, scoutKnowledge);
            const pending = pendingScouts.find((m) => m.playerId === p.id);
            return (
            <tr key={p.id} style={{ borderBottom: "1px solid #ffffff11" }}>
              <td style={{ padding: "7px 10px" }}><PlayerLink player={p} onSelect={onSelectPlayer} /></td>
              <td style={{ padding: "7px 10px" }}>{p.pos}</td>
              <td style={{ padding: "7px 10px" }}>{p.age}</td>
              <td style={{ padding: "7px 10px" }}>{scoutInfo.known ? <StarRating value={starsFor(perceivedRatings(p, scoutInfo).ovr, benchmark)} size={12} color={scoutQualityColor(scoutInfo.quality)} /> : pending ? <span style={{ fontSize: 11, color: "#D9A404" }}>Dépistage · jour {pending.dueDay}</span> : <button onClick={() => onRequestScout(p)} style={{ ...btnStyle("var(--steel)"), fontSize: 11 }}>Dépister</button>}</td>
              <td style={{ padding: "7px 10px", color: "var(--iceMuted)" }}>{scoutInfo.known ? draftLabel(p) : "?"}</td>
              <td style={{ padding: "7px 10px" }}><button onClick={() => onSign(p)} style={btnStyle("var(--win)")} disabled={!scoutInfo.known}>Offrir un contrat</button></td>
            </tr>
            );
          })}
          {sortedFreeAgents.length === 0 && <tr><td colSpan={6} style={{ padding: 12, color: "var(--iceMuted)" }}>Marché des joueurs autonomes vide.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
