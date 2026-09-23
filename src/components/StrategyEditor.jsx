import { FORECHECK_OPTIONS, DEFENSE_OPTIONS, ENTRY_OPTIONS, EXIT_OPTIONS } from "../engine/strategy";
import { h2Style, btnStyle, inputStyle } from "../ui/theme";

export function MentalitySlider({ label, hint, value, onChange }) {
  const tone = value >= 65 ? "var(--red)" : value <= 35 ? "var(--win)" : "var(--gold)";
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 2 }}>
        <span>{label}</span>
        <span style={{ color: tone, fontWeight: 600 }}>{value}</span>
      </div>
      <input type="range" min={0} max={100} step={5} value={value} onChange={(e) => onChange(Number(e.target.value))} style={{ width: "100%" }} />
      <div style={{ fontSize: 11, color: "var(--iceMuted)" }}>{hint}</div>
    </div>
  );
}

export function StrategyEditor({ team, lines, onChangeStrategy, onChangeMentality, onAutoStrategy }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <h2 style={{ ...h2Style, marginBottom: 0 }}>Système de jeu</h2>
        <button onClick={onAutoStrategy} style={btnStyle("var(--win)")}>Meilleure stratégie automatique</button>
      </div>
      <p style={{ fontSize: 12, color: "var(--iceMuted)", marginTop: 6, marginBottom: 16 }}>Inspiré des approches de coaching NHL: pression en zone offensive, système défensif, entrées et sorties de zone.</p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 26 }}>
        <div>
          <div style={{ fontSize: 12, color: "var(--iceMuted)", marginBottom: 6 }}>Forecheck (pression offensive)</div>
          <select value={lines.strategy.forecheck} onChange={(e) => onChangeStrategy("forecheck", e.target.value)} style={inputStyle}>
            {FORECHECK_OPTIONS.map((o) => (<option key={o.id} value={o.id}>{o.label}</option>))}
          </select>
        </div>
        <div>
          <div style={{ fontSize: 12, color: "var(--iceMuted)", marginBottom: 6 }}>Système défensif</div>
          <select value={lines.strategy.defense} onChange={(e) => onChangeStrategy("defense", e.target.value)} style={inputStyle}>
            {DEFENSE_OPTIONS.map((o) => (<option key={o.id} value={o.id}>{o.label}</option>))}
          </select>
        </div>
        <div>
          <div style={{ fontSize: 12, color: "var(--iceMuted)", marginBottom: 6 }}>Entrée de zone</div>
          <select value={lines.strategy.entry} onChange={(e) => onChangeStrategy("entry", e.target.value)} style={inputStyle}>
            {ENTRY_OPTIONS.map((o) => (<option key={o.id} value={o.id}>{o.label}</option>))}
          </select>
        </div>
        <div>
          <div style={{ fontSize: 12, color: "var(--iceMuted)", marginBottom: 6 }}>Sortie de zone</div>
          <select value={lines.strategy.exit} onChange={(e) => onChangeStrategy("exit", e.target.value)} style={inputStyle}>
            {EXIT_OPTIONS.map((o) => (<option key={o.id} value={o.id}>{o.label}</option>))}
          </select>
        </div>
      </div>

      <h2 style={h2Style}>Mentalité d'équipe</h2>
      <p style={{ fontSize: 12, color: "var(--iceMuted)", marginTop: -8, marginBottom: 14 }}>Curseurs fins façon Eastside Hockey Manager, à ajuster par-dessus ton système de jeu.</p>
      <MentalitySlider label="Agressivité" hint="Plus de contact et de pression, mais plus de punitions." value={lines.mentality.aggression} onChange={(v) => onChangeMentality("aggression", v)} />
      <MentalitySlider label="Pincement des défenseurs" hint="Tes défenseurs se joignent plus à l'attaque — plus offensif, mais plus de contre-attaques adverses." value={lines.mentality.pinch} onChange={(v) => onChangeMentality("pinch", v)} />
      <MentalitySlider label="Discipline" hint="Réduit le taux de punitions, surtout utile avec un style agressif." value={lines.mentality.discipline} onChange={(v) => onChangeMentality("discipline", v)} />
    </div>
  );
}
