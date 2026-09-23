import { useState } from "react";
import { teamOvrBenchmark, starsFor } from "../engine/attributes";
import { getScoutInfo } from "../engine/scouting";
import { h2Style, btnStyle, inputStyle, scoutQualityColor } from "../ui/theme";
import { StarRating } from "./common";

export function TransactionsCenter({ myTeam, teams, myTeamId, staff, scoutKnowledge, onRequestScout, onTrade }) {
  const otherTeams = teams.filter((t) => t.id !== myTeam.id);
  const [partnerId, setPartnerId] = useState(otherTeams[0]?.id);
  const [myIds, setMyIds] = useState([]);
  const [theirIds, setTheirIds] = useState([]);
  const partner = teams.find((t) => t.id === partnerId) || otherTeams[0];

  function toggle(setFn, list, id) { setFn(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]); }
  function changePartner(id) { setPartnerId(id); setMyIds([]); setTheirIds([]); }
  function confirmTrade() { onTrade(partner.id, myIds, theirIds); setMyIds([]); setTheirIds([]); }

  const benchmark = teamOvrBenchmark(myTeam);
  function RosterPicker({ roster, ownerTeamId, selected, onToggle }) {
    return (
      <div style={{ maxHeight: 300, overflow: "auto", border: "1px solid #ffffff1a", borderRadius: 4 }}>
        {roster.map((p) => {
          const scoutInfo = getScoutInfo(p, ownerTeamId, myTeamId, staff, scoutKnowledge);
          return (
            <label key={p.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", fontSize: 13, borderBottom: "1px solid #ffffff11", cursor: "pointer", background: selected.includes(p.id) ? "#ffffff14" : "transparent" }}>
              <input type="checkbox" checked={selected.includes(p.id)} onChange={() => onToggle(p.id)} />
              <span style={{ flex: 1, display: "flex", alignItems: "center", gap: 8 }}>{p.name} <span style={{ color: "var(--iceMuted)" }}>({p.pos})</span>
                {scoutInfo.known ? <StarRating value={starsFor(p.ovr, benchmark)} size={11} color={scoutQualityColor(scoutInfo.quality)} /> : <button onClick={(e) => { e.preventDefault(); onRequestScout(p); }} style={{ ...btnStyle("var(--steel)"), fontSize: 10, padding: "2px 6px" }}>Dépister</button>}
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
          <RosterPicker roster={myTeam.roster} ownerTeamId={myTeam.id} selected={myIds} onToggle={(id) => toggle(setMyIds, myIds, id)} />
        </div>
        <div>
          <div style={{ fontSize: 12, color: "var(--iceMuted)", marginBottom: 6 }}>Tu reçois ({partner?.name})</div>
          {partner && <RosterPicker roster={partner.roster} ownerTeamId={partner.id} selected={theirIds} onToggle={(id) => toggle(setTheirIds, theirIds, id)} />}
        </div>
      </div>
      <button onClick={confirmTrade} disabled={myIds.length === 0 && theirIds.length === 0} style={btnStyle("var(--red)")}>Conclure l'échange</button>
    </div>
  );
}
