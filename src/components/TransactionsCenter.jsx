import { formatDay } from "../engine/calendar";
import { useState } from "react";
import { teamOvrBenchmark, starsFor } from "../engine/attributes";
import { getScoutInfo, perceivedRatings } from "../engine/scouting";
import { gmSpread } from "../engine/contracts";
import { h2Style, btnStyle, inputStyle, scoutQualityColor } from "../ui/theme";
import { StarRating, PlayerLink } from "./common";
import { money } from "../ui/format";

// Valeur d'échange approximative d'un joueur pour l'évaluation du DG : cote actuelle, avec un
// supplément pour le potentiel des jeunes joueurs (un espoir vaut plus que sa seule cote actuelle).
function tradeValue(ovr, potential, age) {
  const upside = age <= 24 ? Math.max(0, (potential ?? ovr) - ovr) * 0.4 : 0;
  return ovr + upside;
}

export function TransactionsCenter({ myTeam, teams, myTeamId, staff, scoutKnowledge, pendingScouts, onRequestScout, onSelectPlayer, onTrade, txWindow = { open: true }, gmRating = null }) {
  const otherTeams = teams.filter((t) => t.id !== myTeam.id);
  const [partnerId, setPartnerId] = useState(otherTeams[0]?.id);
  const [myIds, setMyIds] = useState([]);
  const [theirIds, setTheirIds] = useState([]);
  const partner = teams.find((t) => t.id === partnerId) || otherTeams[0];

  function toggle(setFn, list, id) { setFn(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]); }
  function changePartner(id) { setPartnerId(id); setMyIds([]); setTheirIds([]); }
  const [retention, setRetention] = useState({});
  function confirmTrade() { onTrade(partner.id, myIds, theirIds, retention); setMyIds([]); setTheirIds([]); setRetention({}); }

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
                {scoutInfo.known ? <StarRating value={starsFor(shown.ovr, benchmark)} size={11} color={scoutQualityColor(scoutInfo.quality)} /> : pending ? <span style={{ fontSize: 11, color: "var(--gold)" }}>Dépistage · {formatDay(pending.dueDay)}</span> : <button onClick={(e) => { e.preventDefault(); onRequestScout(p); }} style={{ ...btnStyle("var(--steel)"), fontSize: 10, padding: "2px 6px" }}>Dépister</button>}
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
      {myIds.length > 0 && (
        <div style={{ background: "var(--navy2)", border: "1px solid #ffffff1a", borderRadius: 6, padding: 10, marginBottom: 12 }}>
          <div style={{ fontSize: 12, color: "var(--iceMuted)", marginBottom: 6 }}>Rétention de salaire (optionnelle) : tu gardes une part du salaire jusqu'à la fin du contrat (cap mort), l'autre équipe reçoit le joueur moins cher. Maximum 50 %, 3 contrats retenus à la fois.</div>
          {myTeam.roster.filter((p) => myIds.includes(p.id)).map((p) => (
            <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, padding: "3px 0" }}>
              <span style={{ flex: 1 }}>{p.name} <span style={{ color: "var(--iceMuted)" }}>({money(p.contract?.salary || 0)} × {p.contract?.years ?? "?"} an{(p.contract?.years ?? 1) > 1 ? "s" : ""})</span></span>
              <select aria-label={`Rétention ${p.name}`} value={retention[p.id] || 0} onChange={(e) => setRetention({ ...retention, [p.id]: Number(e.target.value) })} style={{ ...inputStyle, width: "auto" }}>
                {[0, 0.25, 0.5].map((r) => <option key={r} value={r}>{r === 0 ? "Aucune" : `${r * 100} % retenu (${money(Math.round((p.contract?.salary || 0) * r))})`}</option>)}
              </select>
            </div>
          ))}
        </div>
      )}
      {(myIds.length > 0 || theirIds.length > 0) && partner && (() => {
        const sideValue = (team, ids) => team.roster.filter((p) => ids.includes(p.id)).reduce((a, p) => {
          const scoutInfo = team.id === myTeamId ? null : getScoutInfo(p, team.id, myTeamId, staff, scoutKnowledge);
          const shown = perceivedRatings(p, scoutInfo);
          return a + tradeValue(shown.ovr, shown.potential, p.age);
        }, 0);
        const mine = sideValue(myTeam, myIds), theirs = sideValue(partner, theirIds);
        const spread = gmSpread(gmRating);
        const diff = theirs - mine;
        const lean = Math.abs(diff) <= Math.max(mine, theirs) * spread ? "équilibré" : diff > 0 ? "favorable" : "défavorable";
        const leanColor = lean === "équilibré" ? "var(--gold)" : lean === "favorable" ? "var(--win)" : "var(--loss)";
        return (
          <div style={{ background: "var(--navy2)", border: "1px solid #ffffff1a", borderRadius: 6, padding: 10, marginBottom: 12, fontSize: 12 }}>
            <strong>Évaluation du DG</strong> {gmRating == null && <span style={{ color: "var(--iceMuted)" }}>(aucun DG en poste : très approximative)</span>}
            <div style={{ marginTop: 4, color: "var(--iceMuted)" }}>
              Valeur envoyée : <strong style={{ color: "var(--ice)" }}>{mine.toFixed(0)}</strong> · valeur reçue : <strong style={{ color: "var(--ice)" }}>{theirs.toFixed(0)}</strong>
              {" · "}Échange <strong style={{ color: leanColor }}>{lean}</strong> pour toi {gmRating != null && <span>(marge d'erreur ± {Math.round(spread * 100)} %)</span>}
            </div>
          </div>
        );
      })()}
      {!txWindow.open && <div style={{ fontSize: 13, color: "var(--loss)", marginBottom: 8 }}>{txWindow.reason}</div>}
      <button onClick={confirmTrade} disabled={!txWindow.open || (myIds.length === 0 && theirIds.length === 0)} style={{ ...btnStyle("var(--red)"), opacity: txWindow.open ? 1 : 0.5 }}>Conclure l'échange</button>
    </div>
  );
}
