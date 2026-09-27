import { formatDay } from "../engine/calendar";
import { useMemo, useState } from "react";
import { teamOvrBenchmark, starsFor } from "../engine/attributes";
import { getScoutInfo, perceivedRatings } from "../engine/scouting";
import { gmSpread } from "../engine/contracts";
import { tradeValue } from "../engine/trades";
import { capStatus } from "../engine/cap";
import { h2Style, btnStyle, inputStyle, scoutQualityColor } from "../ui/theme";
import { StarRating, PlayerLink, TeamCrest } from "./common";
import { money } from "../ui/format";

const POS_GROUPS = [["Tous", null], ["Attaquants", ["C", "LW", "RW"]], ["Défenseurs", ["LD", "RD"]], ["Gardiens", ["G"]]];

function CapBadge({ label, team, seasonYear, opts }) {
  const st = capStatus(team.roster, seasonYear, opts);
  const color = st.overCap ? "var(--loss)" : st.space < 3000 ? "var(--gold)" : "var(--win)";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--navy)", border: "1px solid #ffffff1a", borderRadius: 6, padding: "6px 10px" }}>
      <TeamCrest team={team} size={26} />
      <div>
        <div style={{ fontSize: 11, color: "var(--iceMuted)" }}>{label}</div>
        <div style={{ fontSize: 12, fontWeight: 600, color }}>{money(st.space)} d'espace</div>
      </div>
    </div>
  );
}

export function TransactionsCenter({ myTeam, teams, myTeamId, staff, scoutKnowledge, pendingScouts, onRequestScout, onSelectPlayer, onTrade, txWindow = { open: true }, gmRating = null, tradeBlockIds = [], onToggleTradeBlock, seasonYear, myCapOpts = {}, standings = [] }) {
  const otherTeams = teams.filter((t) => t.id !== myTeam.id);
  const [partnerId, setPartnerId] = useState(otherTeams[0]?.id);
  const [myIds, setMyIds] = useState([]);
  const [theirIds, setTheirIds] = useState([]);
  const [myFilter, setMyFilter] = useState(null);
  const [theirFilter, setTheirFilter] = useState(null);
  const partner = teams.find((t) => t.id === partnerId) || otherTeams[0];

  function toggle(setFn, list, id) { setFn(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]); }
  function changePartner(id) { setPartnerId(id); setMyIds([]); setTheirIds([]); setTheirFilter(null); }
  const [retention, setRetention] = useState({});
  function confirmTrade() { onTrade(partner.id, myIds, theirIds, retention); setMyIds([]); setTheirIds([]); setRetention({}); }

  const benchmark = teamOvrBenchmark(myTeam);
  const rankOf = (teamId) => { const i = standings.findIndex((x) => x.id === teamId); return i >= 0 ? i + 1 : null; };

  function RosterPicker({ team, selected, onToggle, posFilter, onFilter }) {
    const roster = team.roster.filter((p) => !posFilter || posFilter.includes(p.pos)).sort((a, b) => b.ovr - a.ovr);
    const ownerTeamId = team.id;
    return (
      <>
        <div style={{ display: "flex", gap: 4, marginBottom: 6, flexWrap: "wrap" }}>
          {POS_GROUPS.map(([label, grp]) => (
            <button key={label} onClick={() => onFilter(grp)} style={{ ...btnStyle(JSON.stringify(posFilter) === JSON.stringify(grp) ? "var(--accent)" : "var(--steel)"), fontSize: 11, padding: "3px 8px" }}>{label}</button>
          ))}
        </div>
        <div style={{ maxHeight: 300, overflow: "auto", border: "1px solid #ffffff1a", borderRadius: 4 }}>
          {roster.map((p) => {
            const scoutInfo = getScoutInfo(p, ownerTeamId, myTeamId, staff, scoutKnowledge);
            const pending = pendingScouts.find((m) => m.playerId === p.id);
            const shown = perceivedRatings(p, ownerTeamId === myTeamId ? null : scoutInfo);
            const onBlockHint = ownerTeamId === myTeamId && tradeBlockIds.includes(p.id);
            return (
              <label key={p.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", fontSize: 13, borderBottom: "1px solid #ffffff11", cursor: "pointer", background: selected.includes(p.id) ? "#ffffff14" : "transparent" }}>
                <input type="checkbox" checked={selected.includes(p.id)} onChange={() => onToggle(p.id)} />
                <span style={{ width: 28, color: "var(--iceMuted)", fontSize: 11 }}>{p.pos}</span>
                <span style={{ flex: 1, display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                  <PlayerLink player={p} team={team} onSelect={onSelectPlayer} style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} />
                  {onBlockHint && <span title="Sur le marché des échanges" style={{ fontSize: 10, color: "var(--accent)" }}>●</span>}
                </span>
                <span style={{ width: 30, color: "var(--iceMuted)", fontSize: 11, textAlign: "center" }}>{p.age}</span>
                <span style={{ width: 90, color: "var(--iceMuted)", fontSize: 11, textAlign: "right" }}>{p.contract ? `${money(p.contract.salary)}×${p.contract.years}` : "—"}</span>
                <span style={{ width: 78, flexShrink: 0 }}>
                  {scoutInfo.known ? <StarRating value={starsFor(shown.ovr, benchmark)} size={11} color={scoutQualityColor(scoutInfo.quality)} /> : pending ? <span style={{ fontSize: 10, color: "var(--gold)" }}>Dépist. · {formatDay(pending.dueDay)}</span> : <button onClick={(e) => { e.preventDefault(); onRequestScout(p); }} style={{ ...btnStyle("var(--steel)"), fontSize: 10, padding: "2px 6px" }}>Dépister</button>}
                </span>
              </label>
            );
          })}
          {roster.length === 0 && <div style={{ padding: 10, fontSize: 12, color: "var(--iceMuted)" }}>Aucun joueur à ce poste.</div>}
        </div>
      </>
    );
  }

  const onBlock = myTeam.roster.filter((p) => tradeBlockIds.includes(p.id) && !myIds.includes(p.id));
  const evalResult = useMemo(() => {
    if (myIds.length === 0 && theirIds.length === 0) return null;
    const sideValue = (team, ids) => team.roster.filter((p) => ids.includes(p.id)).reduce((a, p) => {
      const scoutInfo = team.id === myTeamId ? null : getScoutInfo(p, team.id, myTeamId, staff, scoutKnowledge);
      const shown = perceivedRatings(p, scoutInfo);
      return a + tradeValue(shown.ovr, shown.potential, p.age);
    }, 0);
    const mine = sideValue(myTeam, myIds), theirs = partner ? sideValue(partner, theirIds) : 0;
    const spread = gmSpread(gmRating);
    const diff = theirs - mine;
    const lean = Math.abs(diff) <= Math.max(mine, theirs, 1) * spread ? "équilibré" : diff > 0 ? "favorable" : "défavorable";
    return { mine, theirs, spread, lean };
  }, [myIds, theirIds, myTeam, partner, staff, scoutKnowledge, gmRating, myTeamId]);
  const leanColor = evalResult?.lean === "équilibré" ? "var(--gold)" : evalResult?.lean === "favorable" ? "var(--win)" : "var(--loss)";

  return (
    <div>
      <h2 style={h2Style}>Échanges</h2>
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginBottom: 16 }}>
        <CapBadge label={`${myTeam.name} · ${rankOf(myTeamId) ? `${rankOf(myTeamId)}e` : "—"}`} team={myTeam} seasonYear={seasonYear} opts={myCapOpts} />
        <span style={{ color: "var(--iceMuted)", fontSize: 18 }}>⇄</span>
        {partner && (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <CapBadge label={`${partner.name} · ${rankOf(partner.id) ? `${rankOf(partner.id)}e` : "—"}`} team={partner} seasonYear={seasonYear} opts={{}} />
            <select value={partner?.id} onChange={(e) => changePartner(e.target.value)} style={{ ...inputStyle, width: "auto" }}>
              {otherTeams.map((t) => (<option key={t.id} value={t.id}>{t.name}</option>))}
            </select>
          </div>
        )}
      </div>
      {onBlock.length > 0 && (
        <div style={{ background: "var(--navy)", border: "1px solid var(--accent)", borderRadius: 4, padding: "10px 14px", marginBottom: 14 }}>
          <div style={{ fontSize: 11, color: "var(--accent)", letterSpacing: 0.5, marginBottom: 6 }}>MARCHÉ DES ÉCHANGES — AJOUTER RAPIDEMENT À L'OFFRE</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {onBlock.map((p) => (
              <span key={p.id} style={{ display: "flex", alignItems: "center", gap: 6, background: "#ffffff0f", borderRadius: 3, padding: "3px 8px", fontSize: 12 }}>
                <PlayerLink player={p} team={myTeam} onSelect={onSelectPlayer} /> ({p.pos})
                <button onClick={() => toggle(setMyIds, myIds, p.id)} title="Ajouter à l'offre" style={{ background: "none", border: "none", color: "var(--win)", cursor: "pointer", padding: 0, fontSize: 13, fontWeight: 700 }}>+</button>
                <button onClick={() => onToggleTradeBlock(p.id)} title="Retirer du marché" style={{ background: "none", border: "none", color: "var(--iceMuted)", cursor: "pointer", padding: 0, fontSize: 12 }}>✕</button>
              </span>
            ))}
          </div>
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 12, color: myTeam.color, fontWeight: 600, marginBottom: 6 }}>Tu envoies ({myTeam.name})</div>
          <RosterPicker team={myTeam} selected={myIds} onToggle={(id) => toggle(setMyIds, myIds, id)} posFilter={myFilter} onFilter={setMyFilter} />
        </div>
        <div>
          <div style={{ fontSize: 12, color: partner?.color || "var(--iceMuted)", fontWeight: 600, marginBottom: 6 }}>Tu reçois ({partner?.name})</div>
          {partner && <RosterPicker team={partner} selected={theirIds} onToggle={(id) => toggle(setTheirIds, theirIds, id)} posFilter={theirFilter} onFilter={setTheirFilter} />}
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
      {evalResult && (
        <div style={{ background: "var(--navy2)", border: "1px solid #ffffff1a", borderRadius: 6, padding: 10, marginBottom: 12, fontSize: 12 }}>
          <strong>Évaluation du DG</strong> {gmRating == null && <span style={{ color: "var(--iceMuted)" }}>(aucun DG en poste : très approximative)</span>}
          <div style={{ marginTop: 4, color: "var(--iceMuted)" }}>
            Valeur envoyée : <strong style={{ color: "var(--ice)" }}>{evalResult.mine.toFixed(0)}</strong> · valeur reçue : <strong style={{ color: "var(--ice)" }}>{evalResult.theirs.toFixed(0)}</strong>
            {" · "}Échange <strong style={{ color: leanColor }}>{evalResult.lean}</strong> pour toi {gmRating != null && <span>(marge d'erreur ± {Math.round(evalResult.spread * 100)} %)</span>}
          </div>
        </div>
      )}
      {!txWindow.open && <div style={{ fontSize: 13, color: "var(--loss)", marginBottom: 8 }}>{txWindow.reason}</div>}
      <button onClick={confirmTrade} disabled={!txWindow.open || (myIds.length === 0 && theirIds.length === 0)} style={{ ...btnStyle("var(--red)"), opacity: txWindow.open ? 1 : 0.5 }}>Conclure l'échange</button>
    </div>
  );
}
