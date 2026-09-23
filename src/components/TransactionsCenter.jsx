import { formatDay } from "../engine/calendar";
import { useState } from "react";
import { teamOvrBenchmark, starsFor } from "../engine/attributes";
import { getScoutInfo, perceivedRatings } from "../engine/scouting";
import { h2Style, btnStyle, inputStyle, scoutQualityColor } from "../ui/theme";
import { StarRating, PlayerLink } from "./common";

export function TransactionsCenter({ myTeam, teams, myTeamId, staff, scoutKnowledge, pendingScouts, onRequestScout, onSelectPlayer, onTrade, txWindow = { open: true } }) {
  const otherTeams = teams.filter((t) => t.id !== myTeam.id);
  const [partnerId, setPartnerId] = useState(otherTeams[0]?.id);
  const [myIds, setMyIds] = useState([]);
  const [theirIds, setTheirIds] = useState([]);
  const partner = teams.find((t) => t.id === partnerId) || otherTeams[0];

  function toggle(setFn, list, id) { setFn(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]); }
  function changePartner(id) { setPartnerId(id); setMyIds([]); setTheirIds([]); }
  function confirmTrade() { onTrade(partner.id, myIds, theirIds); setMyIds([]); setTheirIds([]); }

  const benchmark = teamOvrBenchmark(myTeam);
  function RosterPicker({ team, selected, onToggle }) {
    const roster = team.roster, ownerTeamId = team.id;
    return (
      <div style={{ maxHeight: 300, overflow: "auto", border: "1px solid #ffffff1a", borderRadius: 4 }}>
        {roster.map((p) => {
          const scoutInfo = getScoutInfo(p, ownerTeamId, myTeamId, staff, scoutKnowledge);
          const pending = pendingScouts.find((m) => m.playerId === p.id);
          const shown = perceivedRatings(p, ownerTeamId === myTeamId ? null : scoutInfo);
          return (
            <label key={p.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", fontSize: 13, borderBottom: "1px solid #ffffff11", cursor: "pointer", background: selected.includes(p.id) ? "#ffffff14" : "transparent" }}>
              <input type="checkbox" checked={selected.includes(p.id)} onChange={() => onToggle(p.id)} />
              <span style={{ flex: 1, display: "flex", alignItems: "center", gap: 8 }}><PlayerLink player={p} team={team} onSelect={onSelectPlayer} /> <span style={{ color: "var(--iceMuted)" }}>({p.pos})</span>
                {scoutInfo.known ? <StarRating value={starsFor(shown.ovr, benchmark)} size={11} color={scoutQualityColor(scoutInfo.quality)} /> : pending ? <span style={{ fontSize: 11, color: "#D9A404" }}>Dépistage · {formatDay(pending.dueDay)}</span> : <button onClick={(e) => { e.preventDefault(); onRequestScout(p); }} style={{ ...btnStyle("var(--steel)"), fontSize: 10, padding: "2px 6px" }}>Dépister</button>}
              </span>
            </label>
          );
        })}
      </div>
    );
  }

  return (
    <div>
      <h2 style={h2Style}>Échanges</h2>
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 12, color: "var(--iceMuted)", marginBottom: 6 }}>Équipe partenaire</div>
        <select value={partner?.id} onChange={(e) => changePartner(e.target.value)} style={inputStyle}>
          {otherTeams.map((t) => (<option key={t.id} value={t.id}>{t.name}</option>))}
        </select>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 12, color: "var(--iceMuted)", marginBottom: 6 }}>Tu envoies ({myTeam.name})</div>
          <RosterPicker team={myTeam} selected={myIds} onToggle={(id) => toggle(setMyIds, myIds, id)} />
        </div>
        <div>
          <div style={{ fontSize: 12, color: "var(--iceMuted)", marginBottom: 6 }}>Tu reçois ({partner?.name})</div>
          {partner && <RosterPicker team={partner} selected={theirIds} onToggle={(id) => toggle(setTheirIds, theirIds, id)} />}
        </div>
      </div>
      {!txWindow.open && <div style={{ fontSize: 13, color: "var(--loss)", marginBottom: 8 }}>{txWindow.reason}</div>}
      <button onClick={confirmTrade} disabled={!txWindow.open || (myIds.length === 0 && theirIds.length === 0)} style={{ ...btnStyle("var(--red)"), opacity: txWindow.open ? 1 : 0.5 }}>Conclure l'échange</button>
    </div>
  );
}
