import { useState } from "react";
import { NATION_FLAG } from "../data/names";
import { teamOvrBenchmark, starsFor } from "../engine/attributes";
import { FORECHECK_OPTIONS, DEFENSE_OPTIONS, ENTRY_OPTIONS, EXIT_OPTIONS } from "../engine/strategy";
import { starsText } from "../ui/format";
import { h2Style, btnStyle } from "../ui/theme";
import { StarRating } from "./common";

export function Select({ value, options, onSelect, benchmark }) {
  return (
    <select value={value || ""} onChange={(e) => onSelect(e.target.value)} style={{ background: "var(--navy)", color: "var(--ice)", border: "1px solid #ffffff33", borderRadius: 3, padding: "6px 8px", fontSize: 13, width: "100%" }}>
      {options.map((p) => (<option key={p.id} value={p.id}>{p.name} {benchmark != null ? starsText(starsFor(p.ovr, benchmark)) : ""}</option>))}
    </select>
  );
}

export function PitchPlayer({ label, sub, tone, onClick, onDrop, onDragOver, armedTarget }) {
  return (
    <div onClick={onClick} onDrop={onDrop} onDragOver={onDragOver} style={{ background: tone, borderRadius: 6, padding: "5px 9px", textAlign: "center", minWidth: 74, boxShadow: armedTarget ? "0 0 0 2px #fff, 0 2px 5px #00000055" : "0 2px 5px #00000055", border: "1px solid #ffffff44", cursor: "pointer" }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "#0B1B2E", whiteSpace: "nowrap" }}>{label}</div>
      {sub && <div style={{ fontSize: 9, color: "#0B1B2E99", fontWeight: 600 }}>{sub}</div>}
    </div>
  );
}

export function encodeDrag(origin, playerId) { return origin ? `pitch:${origin.section}:${origin.idx}:${origin.key}:${playerId}` : `list:${playerId}`; }

export function decodeDrag(str) {
  if (!str) return null;
  if (str.startsWith("pitch:")) { const parts = str.split(":"); return { type: "pitch", section: parts[1], idx: parts[2] === "null" ? null : Number(parts[2]), key: parts[3], playerId: parts[4] }; }
  if (str.startsWith("list:")) return { type: "list", playerId: str.slice(5) };
  return { type: "list", playerId: str };
}

export function LineupPitch({ team, lines, onSelectPlayer, onAssign, onSwap, armed, onArm, onConsumeArmed }) {
  const findP = (id) => team.roster.find((x) => x.id === id);
  const nameOf = (id) => { const p = findP(id); return p ? p.name.split(" ").slice(-1)[0] : "—"; };
  const lineTone = ["var(--gold)", "#C7D2DD", "#C08A4E", "#8C97A3"];
  const pairTone = ["var(--gold)", "#C7D2DD", "#C08A4E"];
  function handleDrop(e, section, idx, key) {
    e.preventDefault();
    const decoded = decodeDrag(e.dataTransfer.getData("text/plain"));
    if (!decoded) return;
    if (decoded.type === "pitch") { if (decoded.section === section && decoded.idx === idx && decoded.key === key) return; onSwap(decoded.section, decoded.idx, decoded.key, section, idx, key); }
    else onAssign(section, idx, key, decoded.playerId);
  }
  function handleClick(section, idx, key, currentId) {
    if (armed) {
      if (armed.origin && armed.origin.section === section && armed.origin.idx === idx && armed.origin.key === key) { onConsumeArmed(); return; }
      if (armed.origin) onSwap(armed.origin.section, armed.origin.idx, armed.origin.key, section, idx, key);
      else onAssign(section, idx, key, armed.playerId);
      onConsumeArmed();
    } else if (currentId) {
      onArm({ playerId: currentId, origin: { section, idx, key } });
    }
  }
  function handleDoubleClick(currentId) { const p = findP(currentId); if (p) onSelectPlayer(p, team); }
  function slotProps(section, idx, key, currentId) {
    return {
      draggable: !!currentId,
      onDragStart: (e) => currentId && e.dataTransfer.setData("text/plain", encodeDrag({ section, idx, key }, currentId)),
      onDragOver: (e) => e.preventDefault(),
      onDrop: (e) => handleDrop(e, section, idx, key),
      onClick: () => handleClick(section, idx, key, currentId),
      onDoubleClick: () => handleDoubleClick(currentId),
      armedTarget: !!armed,
    };
  }
  return (
    <div style={{ background: "linear-gradient(180deg, #cfe8f5, #a9d4e8)", borderRadius: 8, padding: "16px 10px", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: "50%", left: 0, right: 0, height: 2, background: "#c8102e88" }} />
      <div style={{ position: "absolute", top: "26%", left: 0, right: 0, height: 2, background: "#1e5f8c66" }} />
      <div style={{ position: "absolute", top: "74%", left: 0, right: 0, height: 2, background: "#1e5f8c66" }} />
      <div style={{ position: "absolute", top: "50%", left: "50%", width: 46, height: 46, marginLeft: -23, marginTop: -23, borderRadius: "50%", border: "2px solid #c8102e88" }} />
      <div style={{ display: "flex", flexDirection: "column", gap: 12, position: "relative" }}>
        {lines.forwards.map((l, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "center", gap: 10, flexWrap: "wrap" }}>
            <PitchPlayer label={nameOf(l.LW)} sub={`AG · T${i + 1}`} tone={lineTone[i]} {...slotProps("forwards", i, "LW", l.LW)} />
            <PitchPlayer label={nameOf(l.C)} sub={`C · T${i + 1}`} tone={lineTone[i]} {...slotProps("forwards", i, "C", l.C)} />
            <PitchPlayer label={nameOf(l.RW)} sub={`AD · T${i + 1}`} tone={lineTone[i]} {...slotProps("forwards", i, "RW", l.RW)} />
          </div>
        ))}
        {lines.defense.map((l, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "center", gap: 34, flexWrap: "wrap" }}>
            <PitchPlayer label={nameOf(l.LD)} sub={`DG · P${i + 1}`} tone={pairTone[i]} {...slotProps("defense", i, "LD", l.LD)} />
            <PitchPlayer label={nameOf(l.RD)} sub={`DD · P${i + 1}`} tone={pairTone[i]} {...slotProps("defense", i, "RD", l.RD)} />
          </div>
        ))}
        <div style={{ display: "flex", justifyContent: "center" }}>
          <PitchPlayer label={nameOf(lines.goalies.starter)} sub="Gardien" tone="#5C7080" {...slotProps("goalies", null, "starter", lines.goalies.starter)} />
        </div>
      </div>
      <div style={{ position: "relative", display: "flex", justifyContent: "center", alignItems: "center", gap: 6, marginTop: 10, fontSize: 11, color: "#0B1B2E" }}>
        <span>Réserviste:</span>
        <span {...(() => { const { armedTarget, ...rest } = slotProps("goalies", null, "backup", lines.goalies.backup); return rest; })()} style={{ background: "#ffffffcc", borderRadius: 4, padding: "2px 8px", fontWeight: 600, cursor: "pointer" }}>
          {nameOf(lines.goalies.backup)}
        </span>
      </div>
    </div>
  );
}

export function TacticSummary({ lines }) {
  const fc = FORECHECK_OPTIONS.find((o) => o.id === lines.strategy.forecheck)?.label;
  const df = DEFENSE_OPTIONS.find((o) => o.id === lines.strategy.defense)?.label;
  const en = ENTRY_OPTIONS.find((o) => o.id === lines.strategy.entry)?.label;
  const ex = EXIT_OPTIONS.find((o) => o.id === lines.strategy.exit)?.label;
  return (
    <div style={{ display: "flex", gap: 14, flexWrap: "wrap", fontSize: 11, color: "var(--iceMuted)", marginBottom: 16, background: "var(--navy)", border: "1px solid #ffffff22", borderRadius: 4, padding: "8px 12px" }}>
      <span><strong style={{ color: "var(--ice)" }}>Forecheck:</strong> {fc}</span>
      <span><strong style={{ color: "var(--ice)" }}>Défense:</strong> {df}</span>
      <span><strong style={{ color: "var(--ice)" }}>Entrée:</strong> {en}</span>
      <span><strong style={{ color: "var(--ice)" }}>Sortie:</strong> {ex}</span>
      <span><strong style={{ color: "var(--ice)" }}>Agressivité:</strong> {lines.mentality.aggression}</span>
    </div>
  );
}

export function RosterSideList({ team, benchmark, armed, onArm, onSelectPlayer }) {
  const groups = { C: [], LW: [], RW: [], LD: [], RD: [], G: [] };
  team.roster.forEach((p) => { if (groups[p.pos]) groups[p.pos].push(p); });
  Object.values(groups).forEach((arr) => arr.sort((a, b) => b.ovr - a.ovr));
  const labels = { C: "CENTRES", LW: "AILIERS GAUCHES", RW: "AILIERS DROITS", LD: "DÉFENSEURS GAUCHES", RD: "DÉFENSEURS DROITS", G: "GARDIENS" };
  return (
    <div style={{ background: "var(--navy)", border: "1px solid #ffffff22", borderRadius: 6, padding: 10, maxHeight: 460, overflow: "auto" }}>
      <div style={{ fontSize: 11, color: "var(--iceMuted)", marginBottom: 8 }}>Clique ou glisse un joueur vers une position du schéma. Clique deux joueurs du schéma pour les échanger.</div>
      {Object.keys(groups).map((pos) => groups[pos].length > 0 && (
        <div key={pos} style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 10, color: "var(--iceMuted)", marginBottom: 4, letterSpacing: 0.5 }}>{labels[pos]}</div>
          {groups[pos].map((p) => (
            <div
              key={p.id}
              draggable
              onDragStart={(e) => e.dataTransfer.setData("text/plain", encodeDrag(null, p.id))}
              onClick={() => (armed?.playerId === p.id ? onArm(null) : onArm({ playerId: p.id, origin: null }))}
              onDoubleClick={() => onSelectPlayer(p, team)}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 7px", borderRadius: 3, cursor: "grab", marginBottom: 1, background: armed?.playerId === p.id ? "var(--red)" : "transparent" }}
            >
              <span style={{ flex: 1, fontSize: 12, color: armed?.playerId === p.id ? "#fff" : "var(--ice)" }}>{NATION_FLAG[p.nationality] || ""} {p.name}</span>
              <StarRating value={starsFor(p.ovr, benchmark)} size={9} />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export function LinesEditor({ team, lines, onChange, onSwap, onChangeUnit, onAutoLines, onAutoSpecialTeams, onSelectPlayer }) {
  const [armed, setArmed] = useState(null);
  const benchmark = teamOvrBenchmark(team);
  const skaters = team.roster.filter((p) => p.pos !== "G");
  function chemistry(ids) {
    const found = ids.map((id) => team.roster.find((p) => p.id === id)).filter(Boolean);
    if (found.length === 0) return null;
    return Math.round(found.reduce((a, p) => a + p.ovr, 0) / found.length);
  }
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <h2 style={{ ...h2Style, marginBottom: 0 }}>Trios et paires</h2>
        <button onClick={onAutoLines} style={btnStyle("var(--win)")}>Meilleures lignes automatiques</button>
      </div>
      <p style={{ fontSize: 12, color: "var(--iceMuted)", marginTop: 6, marginBottom: 14 }}>Le trio 1 reçoit le plus de temps de glace; le trio 4 le moins. Double-clique un joueur pour voir sa fiche.</p>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-start", marginBottom: 26 }}>
        <div style={{ flex: "2 1 320px", minWidth: 280 }}>
          <LineupPitch team={team} lines={lines} onSelectPlayer={onSelectPlayer} onAssign={onChange} onSwap={onSwap} armed={armed} onArm={setArmed} onConsumeArmed={() => setArmed(null)} />
          <div style={{ marginTop: 12 }}>
            <TacticSummary lines={lines} />
          </div>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 11, color: "var(--iceMuted)" }}>
            {lines.forwards.map((l, i) => (<span key={i}>Trio {i + 1}: <strong style={{ color: "var(--ice)" }}>{chemistry([l.LW, l.C, l.RW]) ?? "—"}</strong></span>))}
            {lines.defense.map((l, i) => (<span key={i}>Paire {i + 1}: <strong style={{ color: "var(--ice)" }}>{chemistry([l.LD, l.RD]) ?? "—"}</strong></span>))}
          </div>
        </div>
        <div style={{ flex: "1 1 220px", minWidth: 220 }}>
          <RosterSideList team={team} benchmark={benchmark} armed={armed} onArm={setArmed} onSelectPlayer={onSelectPlayer} />
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <h2 style={{ ...h2Style, marginBottom: 0 }}>Avantage numérique (unité 1)</h2>
        <button onClick={onAutoSpecialTeams} style={btnStyle("var(--win)")}>Meilleur alignement spécial automatique</button>
      </div>
      <p style={{ fontSize: 12, color: "var(--iceMuted)", marginTop: 6, marginBottom: 10 }}>5 patineurs qui reçoivent les occasions de marquer lors des punitions adverses.</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px,1fr))", gap: 8, marginBottom: 26 }}>
        {lines.pp.map((id, i) => (<Select key={i} value={id} options={skaters} onSelect={(v) => onChangeUnit("pp", i, v)} benchmark={benchmark} />))}
      </div>
      <h2 style={h2Style}>Désavantage numérique</h2>
      <p style={{ fontSize: 12, color: "var(--iceMuted)", marginTop: -8, marginBottom: 10 }}>4 patineurs qui défendent lorsque ton équipe écope d'une punition.</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px,1fr))", gap: 8 }}>
        {lines.pk.map((id, i) => (<Select key={i} value={id} options={skaters} onSelect={(v) => onChangeUnit("pk", i, v)} benchmark={benchmark} />))}
      </div>
    </div>
  );
}
