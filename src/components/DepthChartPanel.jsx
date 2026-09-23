import { NATION_FLAG } from "../data/names";
import { teamOvrBenchmark, starsFor } from "../engine/attributes";
import { lineLabel } from "../engine/lines";
import { h2Style, btnStyle } from "../ui/theme";
import { StarRating, InjuryBadge } from "./common";
import { ltirEligible, injuryLabel } from "../engine/injuries";
import { formatDay } from "../engine/calendar";
import { formatMoney } from "../engine/cap";

export function DepthGroup({ title, players, lines, benchmark, showLevel, onSelect, action, injuries = {}, day = 0 }) {
  const groups = { C: [], LW: [], RW: [], LD: [], RD: [], G: [] };
  players.forEach((p) => { if (groups[p.pos]) groups[p.pos].push(p); });
  Object.values(groups).forEach((arr) => arr.sort((a, b) => b.ovr - a.ovr));
  const posLabel = { C: "Centres", LW: "Ailiers gauches", RW: "Ailiers droits", LD: "Défenseurs gauches", RD: "Défenseurs droits", G: "Gardiens" };
  return (
    <div style={{ marginBottom: 24 }}>
      <h2 style={h2Style}>{title}</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px,1fr))", gap: 14 }}>
        {["C", "LW", "RW", "LD", "RD", "G"].map((pos) => (
          <div key={pos} style={{ background: "var(--navy)", border: "1px solid #ffffff22", borderRadius: 4, padding: 12 }}>
            <div style={{ fontSize: 11, color: "var(--iceMuted)", marginBottom: 8, letterSpacing: 0.5 }}>{posLabel[pos].toUpperCase()}</div>
            {groups[pos].length === 0 && <div style={{ fontSize: 12, color: "var(--iceMuted)" }}>Aucun</div>}
            {groups[pos].map((p, i) => (
              <div key={p.id} onClick={() => onSelect(p)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 0", borderBottom: i < groups[pos].length - 1 ? "1px solid #ffffff11" : "none", cursor: "pointer" }}>
                <span style={{ fontSize: 11, color: "var(--iceMuted)", width: 14 }}>{i + 1}</span>
                <span style={{ flex: 1, fontSize: 13 }}>{NATION_FLAG[p.nationality] || ""} {p.name}<span style={{ color: "var(--iceMuted)" }}> ({p.age} ans)</span><InjuryBadge injury={injuries[p.id]} day={day} /></span>
                <StarRating value={starsFor(p.ovr, benchmark)} size={10} />
                {lines && <span style={{ fontSize: 10, color: "var(--iceMuted)", minWidth: 46, textAlign: "right" }}>{lineLabel(p.id, lines)}</span>}
                {action && <button onClick={(e) => { e.stopPropagation(); action.onClick(p); }} style={{ ...btnStyle(action.color), fontSize: 10, padding: "3px 6px" }}>{typeof action.label === "function" ? action.label(p) : action.label}</button>}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function DepthChartPanel({ team, farm, lines, needsWaivers = () => false, onSelectPlayer, onCallUp, onSendDown, injuries = {}, day = 0, onLtir }) {
  const benchmark = teamOvrBenchmark(team);
  const prospects = farm.filter((p) => p.age <= 20);
  const ahl = farm.filter((p) => p.age > 20);
  const select = (p) => onSelectPlayer(p, team);
  return (
    <div>
      <p style={{ fontSize: 12, color: "var(--iceMuted)", marginTop: -8, marginBottom: 16 }}>Vue d'ensemble de l'organisation : ton alignement LNH, ton club-école (LAH) et tes prospects issus du repêchage. Clique un nom pour voir son profil.</p>
      {(() => {
        const hurt = team.roster.filter((p) => injuries[p.id] && injuries[p.id].until > day);
        return (
          <div style={{ marginBottom: 24 }}>
            <h2 style={h2Style}>Infirmerie</h2>
            {hurt.length === 0 ? <div style={{ fontSize: 13, color: "var(--iceMuted)" }}>Aucun blessé. Les blessés sont remplacés automatiquement dans les trios par le meilleur joueur disponible.</div> : (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {hurt.map((p) => { const i = injuries[p.id]; return (
                  <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10, background: "var(--navy2)", border: "1px solid #ffffff1a", borderLeft: `3px solid ${i.ltir ? "#7A4E9E" : "var(--loss)"}`, borderRadius: 6, padding: "8px 12px", fontSize: 13, flexWrap: "wrap" }}>
                    <span onClick={() => onSelectPlayer(p, team)} style={{ flex: 1, cursor: "pointer", minWidth: 160 }}><strong>{p.name}</strong> <span style={{ color: "var(--iceMuted)" }}>({p.pos}) · {injuryLabel(i, day)} · retour vers le {formatDay(i.until)}</span></span>
                    {i.ltir ? <span style={{ fontSize: 12, color: "#C9A6E8" }}>En LTIR : place libérée, {formatMoney(p.contract?.salary || 0)} d'allègement</span>
                      : ltirEligible(i, day) ? <button onClick={() => onLtir(p.id)} style={{ ...btnStyle("#7A4E9E"), fontSize: 11, padding: "4px 9px" }}>Placer sur la LTIR</button>
                      : <span style={{ fontSize: 11, color: "var(--iceMuted)" }}>LTIR : absence de 24 jours minimum</span>}
                  </div>
                ); })}
              </div>
            )}
          </div>
        );
      })()}
      <DepthGroup title="LNH" injuries={injuries} day={day} players={team.roster} lines={lines} benchmark={benchmark} onSelect={select} action={{ label: (p) => (needsWaivers(p) ? "Ballottage" : "Renvoyer"), color: "var(--steel)", onClick: onSendDown }} />
      <DepthGroup title="Club-école (LAH)" players={ahl} benchmark={benchmark} onSelect={select} action={{ label: "Rappeler", color: "var(--win)", onClick: onCallUp }} />
      <DepthGroup title="Prospects (repêchage)" players={prospects} benchmark={benchmark} onSelect={select} action={{ label: "Rappeler", color: "var(--win)", onClick: onCallUp }} />
    </div>
  );
}
