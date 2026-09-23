import { NATION_FLAG } from "../data/names";
import { teamOvrBenchmark, starsFor } from "../engine/attributes";
import { lineLabel } from "../engine/lines";
import { h2Style, btnStyle } from "../ui/theme";
import { StarRating } from "./common";

export function DepthGroup({ title, players, lines, benchmark, showLevel, onSelect, action }) {
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
                <span style={{ flex: 1, fontSize: 13 }}>{NATION_FLAG[p.nationality] || ""} {p.name}<span style={{ color: "var(--iceMuted)" }}> ({p.age} ans)</span></span>
                <StarRating value={starsFor(p.ovr, benchmark)} size={10} />
                {lines && <span style={{ fontSize: 10, color: "var(--iceMuted)", minWidth: 46, textAlign: "right" }}>{lineLabel(p.id, lines)}</span>}
                {action && <button onClick={(e) => { e.stopPropagation(); action.onClick(p); }} style={{ ...btnStyle(action.color), fontSize: 10, padding: "3px 6px" }}>{action.label}</button>}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function DepthChartPanel({ team, farm, lines, onSelectPlayer, onCallUp, onSendDown }) {
  const benchmark = teamOvrBenchmark(team);
  const prospects = farm.filter((p) => p.age <= 20);
  const ahl = farm.filter((p) => p.age > 20);
  const select = (p) => onSelectPlayer(p, team);
  return (
    <div>
      <p style={{ fontSize: 12, color: "var(--iceMuted)", marginTop: -8, marginBottom: 16 }}>Vue d'ensemble de l'organisation : ton alignement LNH, ton club-école (LAH) et tes prospects issus du repêchage. Clique un nom pour voir son profil.</p>
      <DepthGroup title="LNH" players={team.roster} lines={lines} benchmark={benchmark} onSelect={select} action={{ label: "Renvoyer", color: "var(--steel)", onClick: onSendDown }} />
      <DepthGroup title="Club-école (LAH)" players={ahl} benchmark={benchmark} onSelect={select} action={{ label: "Rappeler", color: "var(--win)", onClick: onCallUp }} />
      <DepthGroup title="Prospects (repêchage)" players={prospects} benchmark={benchmark} onSelect={select} action={{ label: "Rappeler", color: "var(--win)", onClick: onCallUp }} />
    </div>
  );
}
