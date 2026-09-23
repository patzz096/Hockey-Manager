import { STRATEGY_PHASES, normalizeStrategy, computeStrategyFits, optionEffects, optionValue, getStrategyMultipliers, playersForOption } from "../engine/strategy";
import { h2Style, btnStyle } from "../ui/theme";
import { PlayerLink } from "./common";

export function MentalitySlider({ id, label, hint, value, onChange }) {
  const tone = value >= 65 ? "var(--red)" : value <= 35 ? "var(--win)" : "var(--gold)";
  return (
    <div style={{ marginBottom: 16 }}>
      <label htmlFor={id} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 2 }}>
        <span>{label}</span>
        <span style={{ color: tone, fontWeight: 600 }}>{value}</span>
      </label>
      <input id={id} type="range" min={0} max={100} step={5} value={value} onChange={(e) => onChange(Number(e.target.value))} style={{ width: "100%" }} />
      <div style={{ fontSize: 11, color: "var(--iceMuted)" }}>{hint}</div>
    </div>
  );
}

// Adéquation (-1..+1) → libellé et couleur.
function fitInfo(f) {
  if (f >= 0.5) return { label: "Excellente", color: "var(--win)" };
  if (f >= 0.15) return { label: "Bonne", color: "#7FD6A0" };
  if (f > -0.15) return { label: "Moyenne", color: "var(--gold)" };
  if (f > -0.5) return { label: "Faible", color: "#F59A4A" };
  return { label: "Mauvaise", color: "var(--loss)" };
}

function FitMeter({ fit }) {
  const info = fitInfo(fit);
  const pct = (fit + 1) * 50;
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
        <span style={{ color: "var(--iceMuted)" }}>Adéquation de ton effectif</span>
        <strong style={{ color: info.color }}>{info.label} ({fit > 0 ? "+" : ""}{Math.round(fit * 100)})</strong>
      </div>
      <div style={{ position: "relative", height: 8, borderRadius: 4, background: "linear-gradient(90deg, var(--loss), var(--gold) 50%, var(--win))", opacity: 0.9 }}>
        <div style={{ position: "absolute", left: `calc(${pct}% - 6px)`, top: -3, width: 12, height: 14, borderRadius: 3, background: "var(--ice)", boxShadow: "0 0 0 2px var(--navy)" }} />
      </div>
    </div>
  );
}

// Effets exprimés du point de vue de l'équipe : vert = favorable, rouge = défavorable.
const EFFECT_ROWS = [
  ["vol", "Tirs pour", 1], ["q", "Qualité des chances pour", 1],
  ["volA", "Tirs contre", -1], ["qA", "Qualité des chances contre", -1], ["pen", "Punitions", -1],
];
function Effects({ e, compact = false }) {
  const rows = EFFECT_ROWS.map(([k, label, sign]) => ({ k, label, pct: Math.round((e[k] - 1) * 1000) / 10, good: sign * (e[k] - 1) }));
  const shown = compact ? rows : rows.filter((r) => Math.abs(r.pct) >= 0.5);
  if (!shown.length) return <div style={{ fontSize: 12, color: "var(--iceMuted)" }}>Effet neutre avec cet effectif.</div>;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
      {shown.map((r) => (
        <span key={r.k} style={{ fontSize: 12, padding: "3px 8px", borderRadius: 999, background: Math.abs(r.pct) < 0.5 ? "#ffffff0d" : r.good > 0 ? "rgba(45,190,116,0.16)" : "rgba(240,96,93,0.16)", color: Math.abs(r.pct) < 0.5 ? "var(--iceMuted)" : r.good > 0 ? "#7FD6A0" : "#FF9A97", fontVariantNumeric: "tabular-nums" }}>
          {r.label} {r.pct > 0 ? "+" : ""}{r.pct} %
        </span>
      ))}
    </div>
  );
}

function PhaseCard({ phase, selected, fits, team, onPick, onSelectPlayer }) {
  const option = phase.options.find((o) => o.id === selected);
  const fit = fits[phase.key][selected];
  const people = playersForOption(team, option, 3);
  // Système qui rapporte le plus à cet effectif dans cette phase (même calcul que le choix auto).
  const bestId = [...phase.options].sort((a, b) => optionValue(optionEffects(phase.key, b.id, fits[phase.key][b.id])) - optionValue(optionEffects(phase.key, a.id, fits[phase.key][a.id])))[0].id;
  return (
    <section style={{ background: "var(--navy2)", border: "1px solid var(--line)", borderRadius: 10, padding: 16 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
        <h3 style={{ fontFamily: "Oswald, sans-serif", fontWeight: 600, fontSize: 18, margin: 0, letterSpacing: 0.3 }}>{phase.label}</h3>
        <span style={{ fontSize: 11, color: "var(--iceMuted)" }}>Pastille : adéquation de ton effectif · ★ : le système le plus rentable pour lui</span>
      </div>
      <div role="radiogroup" aria-label={phase.label} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 8, marginBottom: 14 }}>
        {phase.options.map((o) => {
          const f = fits[phase.key][o.id];
          const info = fitInfo(f);
          const active = o.id === selected;
          return (
            <button key={o.id} role="radio" aria-checked={active} onClick={() => onPick(phase.key, o.id)}
              style={{ textAlign: "left", display: "flex", flexDirection: "column", gap: 5, padding: "9px 11px", borderRadius: 8, cursor: "pointer", color: "var(--ice)", fontFamily: "inherit",
                background: active ? "linear-gradient(135deg, rgba(92,200,255,0.22), rgba(92,200,255,0.06))" : "var(--navy)",
                border: `1px solid ${active ? "var(--accent)" : "var(--line)"}`, boxShadow: active ? "0 0 0 1px var(--accent), 0 6px 18px -8px rgba(92,200,255,0.6)" : "none" }}>
              <span style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.2 }}>{o.label}</span>
              {o.id === bestId && <span style={{ fontSize: 10, fontWeight: 700, color: "var(--gold)", letterSpacing: 0.3 }}>★ MEILLEUR CHOIX</span>}
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, color: info.color }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: info.color }} />{info.label}
              </span>
            </button>
          );
        })}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ fontSize: 14, lineHeight: 1.45 }}>{option.desc}</div>
          <div style={{ fontSize: 12, lineHeight: 1.45 }}>
            <div><strong style={{ color: "#7FD6A0" }}>Convient le mieux :</strong> <span style={{ color: "var(--iceMuted)" }}>{option.good}</span></div>
            <div style={{ marginTop: 4 }}><strong style={{ color: "#FF9A97" }}>À éviter :</strong> <span style={{ color: "var(--iceMuted)" }}>{option.bad}</span></div>
          </div>
          <FitMeter fit={fit} />
          <Effects e={optionEffects(phase.key, selected, fit)} />
        </div>
        <div style={{ fontSize: 12 }}>
          <div style={{ color: "var(--iceMuted)", marginBottom: 6 }}>Profil évalué chez tes {people.group}</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {[["Les mieux adaptés", people.best, "#7FD6A0"], ["Les moins adaptés", people.worst, "#FF9A97"]].map(([title, list, color]) => (
              <div key={title} style={{ background: "var(--navy)", border: "1px solid var(--line)", borderRadius: 8, padding: "8px 10px" }}>
                <div style={{ color, fontWeight: 600, marginBottom: 4 }}>{title}</div>
                {list.map(({ p, v }) => (
                  <div key={p.id} style={{ display: "flex", justifyContent: "space-between", gap: 6, padding: "2px 0" }}>
                    <PlayerLink player={p} team={team} onSelect={onSelectPlayer}>{p.name.split(" ").slice(-1)[0]}</PlayerLink>
                    <span style={{ color: "var(--iceMuted)", fontVariantNumeric: "tabular-nums" }}>{p.pos} · {Math.round(v)}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function StrategyEditor({ team, lines, onChangeStrategy, onChangeMentality, onAutoStrategy, onSelectPlayer }) {
  const strategy = normalizeStrategy(lines.strategy);
  const fits = computeStrategyFits(team, lines);
  const total = getStrategyMultipliers(strategy, fits, lines.mentality);
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 6 }}>
        <h2 style={{ ...h2Style, marginBottom: 0 }}>Système de jeu</h2>
        <button onClick={onAutoStrategy} style={btnStyle("var(--win)")}>Meilleur système pour mon effectif</button>
      </div>
      <p style={{ fontSize: 13, color: "var(--iceMuted)", marginTop: 4, marginBottom: 14, maxWidth: 760, lineHeight: 1.45 }}>
        Cinq phases de jeu, cinq systèmes chacune. Un système ne vaut que par les joueurs qui l'appliquent : l'adéquation mesure le profil de ton effectif (pondéré par le temps de glace des trios). Avec une bonne adéquation, le système donne son plein effet ; avec une mauvaise, il peut se retourner contre toi.
      </p>
      <div style={{ position: "sticky", top: 0, zIndex: 5, background: "var(--navy)", borderBottom: "1px solid var(--line)", padding: "10px 0", marginBottom: 16, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <strong style={{ fontSize: 12, letterSpacing: 0.4, color: "var(--iceMuted)" }}>EFFET COMBINÉ</strong>
        <Effects e={total} compact />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 28 }}>
        {STRATEGY_PHASES.map((ph) => (
          <PhaseCard key={ph.key} phase={ph} selected={strategy[ph.key]} fits={fits} team={team} onPick={onChangeStrategy} onSelectPlayer={onSelectPlayer} />
        ))}
      </div>

      <h2 style={h2Style}>Mentalité d'équipe</h2>
      <p style={{ fontSize: 12, color: "var(--iceMuted)", marginTop: -8, marginBottom: 14 }}>Curseurs fins façon Eastside Hockey Manager, à ajuster par-dessus ton système de jeu.</p>
      <MentalitySlider id="mentality-aggression" label="Agressivité" hint="Plus de contact et de pression, mais plus de punitions." value={lines.mentality.aggression} onChange={(v) => onChangeMentality("aggression", v)} />
      <MentalitySlider id="mentality-pinch" label="Pincement des défenseurs" hint="Tes défenseurs se joignent plus à l'attaque — plus offensif, mais plus de contre-attaques adverses." value={lines.mentality.pinch} onChange={(v) => onChangeMentality("pinch", v)} />
      <MentalitySlider id="mentality-discipline" label="Discipline" hint="Réduit le taux de punitions, surtout utile avec un style agressif." value={lines.mentality.discipline} onChange={(v) => onChangeMentality("discipline", v)} />
    </div>
  );
}
