import { useState } from "react";
import { X } from "lucide-react";
import { NATION_FLAG, NATION_NAME, NATIONALITY_POOL } from "../data/names";
import { SKATER_CATEGORIES, GOALIE_CATEGORIES, ATTR_LABELS, computeOvr, emptyAttrs, attr20, teamOvrBenchmark, starsFor } from "../engine/attributes";
import { randomContractRT } from "../engine/contracts";
import { btnStyle, inputStyle } from "../ui/theme";
import { StarRating } from "./common";

export function PlayerEditorModal({ initial, isNew, team, onSave, onClose }) {
  const [name, setName] = useState(initial.name);
  const [pos, setPos] = useState(initial.pos);
  const [age, setAge] = useState(initial.age);
  const [attrs, setAttrs] = useState(initial.attrs);
  const [potentialOverride, setPotentialOverride] = useState(initial.potential);
  const [nationality, setNationality] = useState(initial.nationality || "CA");

  const ovr = computeOvr(pos, attrs);
  const categories = pos === "G" ? GOALIE_CATEGORIES : SKATER_CATEGORIES;

  function changePos(newPos) { setPos(newPos); setAttrs(emptyAttrs(newPos, 60)); }
  function setAttr(k, v) { setAttrs((prev) => ({ ...prev, [k]: v })); }
  function handleSave() {
    if (!name.trim()) return;
    const finalPotential = Math.max(ovr, Math.min(99, Number(potentialOverride) || ovr));
    onSave({
      id: initial.id, name: name.trim(), pos, age: Number(age) || 20, attrs, ovr, potential: finalPotential,
      number: initial.number, contract: initial.contract || randomContractRT(), draftPick: initial.draftPick ?? null, draftYear: initial.draftYear ?? null, nationality: nationality,
    });
  }

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "#00000099", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 60, padding: 16 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "var(--navy2)", border: "1px solid #ffffff33", borderTop: "4px solid var(--red)", borderRadius: 4, padding: 24, width: 440, maxWidth: "92vw", maxHeight: "88vh", overflow: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
          <div style={{ fontFamily: "Oswald, sans-serif", fontWeight: 600, fontSize: 20 }}>{isNew ? "Créer un joueur" : "Modifier le joueur"}</div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--iceMuted)", cursor: "pointer" }}><X size={18} /></button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 80px", gap: 8, marginBottom: 10 }}>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nom du joueur" style={inputStyle} />
          <select value={pos} onChange={(e) => changePos(e.target.value)} style={inputStyle}>
            {["C", "LW", "RW", "LD", "RD", "G"].map((p) => (<option key={p} value={p}>{p}</option>))}
          </select>
          <input type="number" value={age} onChange={(e) => setAge(e.target.value)} style={inputStyle} min={17} max={42} />
        </div>
        <select value={nationality} onChange={(e) => setNationality(e.target.value)} style={{ ...inputStyle, marginBottom: 16 }}>
          {NATIONALITY_POOL.map((n) => (<option key={n.code} value={n.code}>{NATION_FLAG[n.code]} {NATION_NAME[n.code]}</option>))}
        </select>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 18, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ fontSize: 12, color: "var(--iceMuted)" }}>Actuel</span><StarRating value={starsFor(ovr, teamOvrBenchmark(team))} /></div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flex: 1, minWidth: 160 }}>
            <span style={{ fontSize: 12, color: "var(--iceMuted)" }}>Potentiel</span>
            <StarRating value={starsFor(potentialOverride, teamOvrBenchmark(team))} color="#7A9EDB" />
            <input type="range" min={ovr} max={99} value={potentialOverride} onChange={(e) => setPotentialOverride(Number(e.target.value))} style={{ flex: 1 }} />
          </div>
        </div>
        {categories.map((cat) => (
          <div key={cat.key} style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: "var(--iceMuted)", marginBottom: 8, borderBottom: "1px solid #ffffff1a", paddingBottom: 4 }}>{cat.label}</div>
            {cat.attrs.map((k) => (
              <div key={k} style={{ marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--iceMuted)", marginBottom: 2 }}><span>{ATTR_LABELS[k]}</span><span>{attr20(attrs[k])}/20</span></div>
                <input type="range" min={20} max={99} value={attrs[k]} onChange={(e) => setAttr(k, Number(e.target.value))} style={{ width: "100%" }} />
              </div>
            ))}
          </div>
        ))}
        <button onClick={handleSave} style={{ ...btnStyle("var(--red)"), width: "100%", justifyContent: "center", marginTop: 8 }}>Enregistrer</button>
      </div>
    </div>
  );
}
