import { formatDay } from "../engine/calendar";
import { teamOvrBenchmark, starsFor } from "../engine/attributes";
import { getScoutInfo, perceivedRatings } from "../engine/scouting";
import { draftLabel } from "../ui/format";
import { h2Style, scoutQualityColor } from "../ui/theme";
import { useSort, sortRows } from "../ui/useSort";
import { SortTh, StarRating, PlayerLink } from "./common";

export function FreeAgentsPanel({ myTeam, myTeamId, staff, scoutKnowledge, pendingScouts, onSelectPlayer, freeAgents, txWindow = { open: true } }) {
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
      <p style={{ fontSize: 12, color: txWindow.open ? "var(--iceMuted)" : "var(--loss)", marginTop: -8, marginBottom: 12 }}>{txWindow.open ? "Joueurs sans contrat. Clique un joueur pour le dépister ou lui offrir un contrat depuis son profil." : txWindow.reason}</p>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
        <thead><tr>
          <SortTh label="Joueur" sortKey="name" activeKey={fak} activeDir={fad} onSort={faToggle} />
          <SortTh label="Pos" sortKey="pos" activeKey={fak} activeDir={fad} onSort={faToggle} />
          <SortTh label="Âge" sortKey="age" activeKey={fak} activeDir={fad} onSort={faToggle} />
          <SortTh label="Cote" sortKey="ovr" activeKey={fak} activeDir={fad} onSort={faToggle} />
          <SortTh label="Repêché" sortKey="draft" activeKey={fak} activeDir={fad} onSort={faToggle} />
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
              <td style={{ padding: "7px 10px" }}>{scoutInfo.known ? <StarRating value={starsFor(perceivedRatings(p, scoutInfo).ovr, benchmark)} size={12} color={scoutQualityColor(scoutInfo.quality)} /> : pending ? <span style={{ fontSize: 11, color: "var(--gold)" }}>Dépistage · {formatDay(pending.dueDay)}</span> : <span style={{ fontSize: 11, color: "var(--iceMuted)" }}>Non dépisté</span>}</td>
              <td style={{ padding: "7px 10px", color: "var(--iceMuted)" }}>{scoutInfo.known ? draftLabel(p) : "?"}</td>
            </tr>
            );
          })}
          {sortedFreeAgents.length === 0 && <tr><td colSpan={5} style={{ padding: 12, color: "var(--iceMuted)" }}>Marché des joueurs autonomes vide.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
