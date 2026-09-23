import { useState } from "react";
import { Info } from "lucide-react";
import { ROLES, ROLE_GROUPS, roleGroupOf, roleFit, roleScore, roleOf, roleWarnings } from "../engine/roles";
import { lineInfo } from "../engine/lines";
import { teamOvrBenchmark, starsFor } from "../engine/attributes";
import { SPECIAL_KINDS, SPECIAL_SYSTEMS, specialSystem, specialSystems, specialUnits, specialUnitOf, slotFit, slotScore, unitFit, systemEffects } from "../engine/specialTeams";
import { h2Style, btnStyle } from "../ui/theme";
import { StarRating } from "./common";
import { TacticSummary } from "./LinesEditor";

// ---------------------------------------------------------------------------------------
// Planificateur tactique, à la Football Manager : schéma de la patinoire à gauche (glisser-déposer
// ou clic-clic), tableau Poste / Rôle / Aptitude / Joueur à droite. Trois vues : égalité
// numérique (trios, paires, gardiens), avantage numérique et désavantage numérique (2 unités).
// ---------------------------------------------------------------------------------------

const POS_FR = { C: "C", LW: "AG", RW: "AD", LD: "DG", RD: "DD", G: "G" };
const ROLE_SHORT = { playmaker: "FAB", sniper: "TIR", powerForward: "PUI", twoWay: "2 S", grinder: "ÉNE", offensiveD: "D-OF", stayHome: "D-DÉ", twoWayD: "D-CO", butterfly: "PAP" };
const LINE_TONE = ["#FFC247", "#9FD3F5", "#E2A06A", "#9AA7B4"];
const lastName = (p) => (p ? p.name.split(" ").slice(-1)[0] : "—");

// Aptitude au rôle ou au poste : étoiles relatives à l'effectif (comme les autres notes du jeu),
// couleur selon l'adéquation absolue (-1..+1), celle qui compte en match.
function aptitude(player, row, lines) {
  if (!player) return null;
  if (row.slot) return { score: slotScore(player, row.slot), fit: slotFit(player, row.slot, row.ref) };
  const roleId = player.pos === "G" ? "butterfly" : roleOf(lines, player);
  return { score: roleScore(player, roleId), fit: roleFit(player, roleId) };
}
function MiniStars({ value, color }) {
  return (
    <span aria-label={`${value} étoiles sur 5`} style={{ fontSize: 10, letterSpacing: 0.5, lineHeight: 1 }}>
      {[1, 2, 3, 4, 5].map((i) => <span key={i} style={{ color: value >= i - 0.25 ? color : "#ffffff30" }}>{value >= i - 0.25 ? "★" : value >= i - 0.75 ? "⯪" : "☆"}</span>)}
    </span>
  );
}
function fitColor(f) { return f >= 0.5 ? "var(--win)" : f >= 0.15 ? "#7FD6A0" : f > -0.15 ? "var(--gold)" : f > -0.5 ? "#F59A4A" : "var(--loss)"; }
function fitLabel(f) { return f >= 0.5 ? "excellente" : f >= 0.15 ? "bonne" : f > -0.15 ? "moyenne" : f > -0.5 ? "faible" : "mauvaise"; }

const encode = (slot, id) => (slot ? `slot|${slot.section}|${slot.idx}|${slot.key}|${id}` : `list|${id}`);
function decode(str) {
  if (!str) return null;
  const parts = str.split("|");
  if (parts[0] === "slot") return { slot: { section: parts[1], idx: parts[2] === "null" ? null : Number(parts[2]), key: parts[3] }, playerId: parts[4] };
  if (parts[0] === "list") return { slot: null, playerId: parts[1] };
  return null;
}
const sameSlot = (a, b) => a && b && a.section === b.section && a.idx === b.idx && a.key === b.key;

// Rangées du tableau et cartes du schéma pour chaque vue.
function esSlots(lines) {
  const rows = [];
  lines.forwards.forEach((l, i) => ["LW", "C", "RW"].forEach((k) => rows.push({ section: "forwards", idx: i, key: k, id: l[k], pos: `${POS_FR[k]}`, group: `Trio ${i + 1}`, tone: LINE_TONE[i] })));
  lines.defense.forEach((l, i) => ["LD", "RD"].forEach((k) => rows.push({ section: "defense", idx: i, key: k, id: l[k], pos: `${POS_FR[k]}`, group: `Paire ${i + 1}`, tone: LINE_TONE[i] })));
  rows.push({ section: "goalies", idx: null, key: "starter", id: lines.goalies.starter, pos: "G", group: "Gardiens", tone: "#B9C4CF" });
  rows.push({ section: "goalies", idx: null, key: "backup", id: lines.goalies.backup, pos: "G2", group: "Gardiens", tone: "#B9C4CF" });
  return rows;
}
function specialSlots(lines, kind) {
  const sys = specialSystem(kind, specialSystems(lines)[kind]);
  return specialUnits(lines, kind).flatMap((u, i) => sys.slots.map((s) => ({ section: kind, idx: i, key: s.key, id: u[s.key], pos: s.short, group: `Unité ${i + 1}`, tone: LINE_TONE[i], slot: s, ref: sys.ref })));
}

// ------------------------------- Schéma : égalité numérique -------------------------------
function PlayerChip({ row, player, lines, armed, drag, benchmark }) {
  const isSpecial = !!row.slot;
  const apt = aptitude(player, row, lines);
  const tag = isSpecial ? row.slot.short : player ? (player.pos === "G" ? "PAP" : ROLE_SHORT[roleOf(lines, player)]) : row.pos;
  const isArmed = sameSlot(armed?.slot, row);
  return (
    <div {...drag} title={player ? `${player.name} — ${isSpecial ? row.slot.label : player.pos === "G" ? "Gardien" : ROLES[roleOf(lines, player)].label}` : "Poste vide"}
      style={{ width: 78, textAlign: "center", cursor: player ? "grab" : "pointer", userSelect: "none", transform: isArmed ? "translateY(-2px)" : "none", transition: "transform .12s" }}>
      <div style={{ display: "inline-block", fontSize: 9, fontWeight: 800, letterSpacing: 0.4, padding: "1px 6px", borderRadius: "4px 4px 0 0", background: row.tone, color: "#0A1627" }}>{tag}</div>
      <div style={{ background: isArmed ? "var(--red)" : "rgba(8,20,36,0.92)", border: `1px solid ${isArmed ? "#fff" : armed ? "var(--accent)" : "#ffffff30"}`, borderRadius: 6, padding: "4px 4px 3px", boxShadow: "0 3px 8px #0006" }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{lastName(player)}</div>
        {apt && <div style={{ marginTop: 1 }}><MiniStars value={starsFor(apt.score, benchmark)} color={fitColor(apt.fit)} /></div>}
      </div>
    </div>
  );
}

function RinkLines({ half }) {
  // Glace vue de haut : lignes bleues, ligne rouge (vue complète) ou filet et cercles (demi-zone).
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} aria-hidden="true">
      {half ? (<>
        <rect x="0" y="2" width="100" height="1.6" fill="#2F6FB5" opacity="0.8" />
        <rect x="0" y="90" width="100" height="0.5" fill="#C8102E" opacity="0.7" />
        <path d="M44 90 A6 5 0 0 0 56 90 Z" fill="#6FB4E8" opacity="0.45" />
        <rect x="46" y="90.5" width="8" height="4" fill="none" stroke="#C8102E" strokeWidth="0.7" />
        {[27, 73].map((x) => <g key={x}><ellipse cx={x} cy="66" rx="13" ry="12" fill="none" stroke="#C8102E" strokeWidth="0.45" opacity="0.6" /><circle cx={x} cy="66" r="1" fill="#C8102E" opacity="0.7" /></g>)}
      </>) : (<>
        <rect x="0" y="30" width="100" height="1.2" fill="#2F6FB5" opacity="0.7" />
        <rect x="0" y="49.4" width="100" height="1.2" fill="#C8102E" opacity="0.6" />
        <rect x="0" y="69" width="100" height="1.2" fill="#2F6FB5" opacity="0.7" />
        <ellipse cx="50" cy="50" rx="10" ry="6" fill="none" stroke="#2F6FB5" strokeWidth="0.5" opacity="0.6" />
        <path d="M44 96 A6 4 0 0 1 56 96 Z" fill="#6FB4E8" opacity="0.45" />
      </>)}
    </svg>
  );
}

function Rink({ children, half, minHeight }) {
  return (
    <div style={{ position: "relative", borderRadius: 14, overflow: "hidden", background: "radial-gradient(120% 90% at 50% 40%, #EAF5FB, #BCDDEE)", border: "3px solid #0E2238", boxShadow: "inset 0 0 30px #0002", minHeight }}>
      <RinkLines half={half} />
      {children}
    </div>
  );
}

// ------------------------------------ Tableau ------------------------------------
const th = { textAlign: "left", fontSize: 10, letterSpacing: 0.5, color: "var(--iceMuted)", fontWeight: 600, padding: "6px 8px", borderBottom: "1px solid var(--line)", whiteSpace: "nowrap" };
const td = { padding: "4px 8px", fontSize: 12, borderBottom: "1px solid #ffffff0d", verticalAlign: "middle" };
const selStyle = { background: "var(--navy)", color: "var(--ice)", border: "1px solid var(--line)", borderRadius: 5, padding: "4px 6px", fontSize: 12, fontFamily: "inherit", maxWidth: "100%" };

function SlotRow({ row, team, lines, benchmark, armed, drag, onAssign, onChangeRole, onSelectPlayer, candidates }) {
  const p = team.roster.find((x) => x.id === row.id);
  const isSpecial = !!row.slot, isGoalie = row.section === "goalies";
  const roleId = p && !isGoalie && !isSpecial ? roleOf(lines, p) : null;
  const apt = aptitude(p, row, lines);
  const warnings = p && roleId ? roleWarnings(roleId, lineInfo(p.id, lines), specialUnitOf(lines, "pp", p.id) > 0, specialUnitOf(lines, "pk", p.id) > 0) : [];
  const isArmed = sameSlot(armed?.slot, row);
  return (
    <tr {...drag} style={{ background: isArmed ? "rgba(214,48,49,0.22)" : "transparent", cursor: "grab" }}>
      <td style={td}>
        <span style={{ display: "inline-block", minWidth: 40, textAlign: "center", fontSize: 11, fontWeight: 800, padding: "3px 6px", borderRadius: 4, background: row.tone, color: "#0A1627" }}>{row.pos}</span>
      </td>
      <td style={td}>
        {isSpecial ? <span title={row.slot.label} style={{ fontSize: 12 }}>{row.slot.label}{row.slot.pos && <span style={{ color: "var(--iceMuted)", fontSize: 10 }}> · {row.slot.pos === "D" ? "déf." : "att."} conseillé</span>}</span>
          : isGoalie ? <span>{row.key === "starter" ? "Partant" : "Réserviste"} · {ROLES.butterfly.label}</span>
          : p ? (
            <select aria-label={`Rôle de ${p.name}`} value={roleId} onChange={(e) => onChangeRole(p.id, e.target.value)} onClick={(e) => e.stopPropagation()} style={selStyle}>
              {ROLE_GROUPS[roleGroupOf(p)].map((id) => <option key={id} value={id}>{ROLES[id].label} — {fitLabel(roleFit(p, id))}</option>)}
            </select>
          ) : <span style={{ color: "var(--iceMuted)" }}>—</span>}
      </td>
      <td style={td}>{apt ? <span title={`Adéquation ${fitLabel(apt.fit)} (${apt.fit > 0 ? "+" : ""}${Math.round(apt.fit * 100)})`}><StarRating value={starsFor(apt.score, benchmark)} size={11} color={fitColor(apt.fit)} /></span> : null}</td>
      <td style={td}>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <select aria-label={`Joueur ${row.group} ${row.pos}`} value={row.id || ""} onChange={(e) => e.target.value && onAssign(row.section, row.idx, row.key, e.target.value)} onClick={(e) => e.stopPropagation()} style={{ ...selStyle, width: 170 }}>
            {!row.id && <option value="">— Vide —</option>}
            {candidates.map((c) => <option key={c.id} value={c.id}>{c.name} ({POS_FR[c.pos]})</option>)}
          </select>
          {p && <button title="Voir la fiche" aria-label={`Fiche de ${p.name}`} onClick={(e) => { e.stopPropagation(); onSelectPlayer(p, team); }} style={{ background: "none", border: "none", color: "var(--iceMuted)", cursor: "pointer", padding: 2, display: "inline-flex" }}><Info size={14} /></button>}
        </div>
      </td>
      <td style={{ ...td, color: "var(--iceMuted)" }}>{p ? POS_FR[p.pos] : ""}</td>
      <td style={{ ...td, color: "var(--iceMuted)", fontVariantNumeric: "tabular-nums" }}>{p?.age ?? ""}</td>
      <td style={td}>{p && <StarRating value={starsFor(p.ovr, benchmark)} size={10} />}</td>
      <td style={{ ...td, width: 20 }}>{warnings.length > 0 && <span title={warnings.join("\n")} style={{ color: "#F59A4A", cursor: "help" }}>⚠</span>}</td>
    </tr>
  );
}

function PlannerTable({ rows, team, lines, benchmark, armed, dragProps, onAssign, onChangeRole, onSelectPlayer }) {
  const skaters = team.roster.filter((p) => p.pos !== "G");
  const goalies = team.roster.filter((p) => p.pos === "G");
  let lastGroup = null;
  return (
    <div style={{ overflowX: "auto", background: "var(--navy2)", border: "1px solid var(--line)", borderRadius: 10 }}>
      <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 640 }}>
        <thead>
          <tr><th style={th}>POSTE</th><th style={th}>RÔLE</th><th style={th}>APTITUDE</th><th style={th}>JOUEUR</th><th style={th}>POS.</th><th style={th}>ÂGE</th><th style={th}>NOTE</th><th style={th} /></tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const header = row.group !== lastGroup;
            lastGroup = row.group;
            return [
              header && <tr key={`h-${row.group}`}><td colSpan={8} style={{ padding: "8px 8px 3px", fontFamily: "Oswald, sans-serif", fontSize: 13, letterSpacing: 0.4, color: row.tone }}>{row.group.toUpperCase()}</td></tr>,
              <SlotRow key={`${row.section}-${row.idx}-${row.key}`} row={row} team={team} lines={lines} benchmark={benchmark} armed={armed} drag={dragProps(row)}
                onAssign={onAssign} onChangeRole={onChangeRole} onSelectPlayer={onSelectPlayer} candidates={row.section === "goalies" ? goalies : skaters} />,
            ];
          })}
        </tbody>
      </table>
    </div>
  );
}

// ------------------------------- Unités spéciales : en-tête -------------------------------
const FX_ROWS = {
  pp: [["vol", "Tirs en AN", 1], ["q", "Qualité des chances", 1], ["shA", "Risque de but contre en infériorité", -1]],
  pk: [["volA", "Tirs accordés", -1], ["qA", "Qualité accordée", -1], ["sh", "Buts en infériorité", 1]],
};
function FxChips({ kind, e }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
      {FX_ROWS[kind].map(([k, label, sign]) => {
        const pct = Math.round((e[k] - 1) * 100), good = sign * pct;
        return <span key={k} style={{ fontSize: 11, padding: "3px 8px", borderRadius: 999, fontVariantNumeric: "tabular-nums", background: pct === 0 ? "#ffffff0d" : good > 0 ? "rgba(45,190,116,0.16)" : "rgba(240,96,93,0.16)", color: pct === 0 ? "var(--iceMuted)" : good > 0 ? "#7FD6A0" : "#FF9A97" }}>{label} {pct > 0 ? "+" : ""}{pct} %</span>;
      })}
    </div>
  );
}

function SystemBar({ kind, team, lines, onChangeSystem, onBestSystem, onAutoUnits }) {
  const current = specialSystems(lines)[kind];
  const sys = specialSystem(kind, current);
  const units = specialUnits(lines, kind);
  const fits = units.map((u) => unitFit(u, team.roster, kind, current));
  return (
    <section style={{ background: "var(--navy2)", border: "1px solid var(--line)", borderRadius: 10, padding: 14, marginBottom: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
        <strong style={{ fontSize: 12, letterSpacing: 0.4, color: "var(--iceMuted)" }}>SYSTÈME</strong>
        <div role="radiogroup" aria-label={`Système ${SPECIAL_KINDS[kind].label}`} style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {SPECIAL_SYSTEMS[kind].map((s) => {
            const active = s.id === current;
            return <button key={s.id} role="radio" aria-checked={active} onClick={() => onChangeSystem(kind, s.id)} style={{ padding: "6px 12px", borderRadius: 999, fontSize: 12, fontWeight: active ? 700 : 500, fontFamily: "inherit", cursor: "pointer", color: "var(--ice)", background: active ? "linear-gradient(135deg, rgba(92,200,255,0.28), rgba(92,200,255,0.08))" : "var(--navy)", border: `1px solid ${active ? "var(--accent)" : "var(--line)"}` }}>{s.label}</button>;
          })}
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 6, flexWrap: "wrap" }}>
          <button onClick={() => onAutoUnits(kind)} style={{ ...btnStyle("var(--steel)"), fontSize: 12 }}>Meilleures unités pour ce système</button>
          <button onClick={() => onBestSystem(kind)} style={{ ...btnStyle("var(--win)"), fontSize: 12 }}>Meilleur système et unités</button>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14 }}>
        <div style={{ fontSize: 13, lineHeight: 1.45 }}>
          <div>{sys.desc}</div>
          <div style={{ fontSize: 12, marginTop: 6 }}><strong style={{ color: "#7FD6A0" }}>Convient :</strong> <span style={{ color: "var(--iceMuted)" }}>{sys.good}</span></div>
          <div style={{ fontSize: 12, marginTop: 3 }}><strong style={{ color: "#FF9A97" }}>À éviter :</strong> <span style={{ color: "var(--iceMuted)" }}>{sys.bad}</span></div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {fits.map((f, i) => (
            <div key={i}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                <span style={{ color: "var(--iceMuted)" }}>Unité {i + 1} · {Math.round(SPECIAL_KINDS[kind].shares[i] * 100)} % du temps</span>
                <strong style={{ color: fitColor(f) }}>Adéquation {fitLabel(f)}</strong>
              </div>
              <FxChips kind={kind} e={systemEffects(kind, current, f)} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ------------------------------------ Composant ------------------------------------
const VIEWS = [
  { key: "es", label: "Égalité numérique", sub: "5 c. 5" },
  { key: "pp", label: "Avantage numérique", sub: "5 c. 4" },
  { key: "pk", label: "Désavantage numérique", sub: "4 c. 5" },
];

export function TacticsPlanner({ team, lines, onAssign, onSwap, onChangeRole, onNaturalRoles, onAutoLines, onChangeSystem, onBestSystem, onAutoUnits, onSelectPlayer }) {
  const [view, setView] = useState("es");
  const [unitIdx, setUnitIdx] = useState(0);
  const [armed, setArmed] = useState(null);
  const benchmark = teamOvrBenchmark(team);
  const byId = (id) => team.roster.find((p) => p.id === id);
  const rows = view === "es" ? esSlots(lines) : specialSlots(lines, view);
  const usedIds = new Set(rows.map((r) => r.id).filter(Boolean));
  const reserves = team.roster.filter((p) => !usedIds.has(p.id) && (view === "es" || p.pos !== "G")).sort((a, b) => b.ovr - a.ovr);

  // Un gardien ne va que devant le filet, un patineur jamais.
  const fitsSlot = (playerId, section) => { const p = byId(playerId); return !p || (p.pos === "G") === (section === "goalies"); };
  function dropOn(row, data) {
    if (!data || !fitsSlot(data.playerId, row.section)) return;
    if (data.slot && row.id && !fitsSlot(row.id, data.slot.section)) return;
    if (data.slot) { if (!sameSlot(data.slot, row)) onSwap(data.slot.section, data.slot.idx, data.slot.key, row.section, row.idx, row.key); }
    else onAssign(row.section, row.idx, row.key, data.playerId);
  }
  function clickSlot(row) {
    if (armed) {
      if (!sameSlot(armed.slot, row)) dropOn(row, armed);
      setArmed(null);
    } else if (row.id) setArmed({ slot: { section: row.section, idx: row.idx, key: row.key }, playerId: row.id });
  }
  const dragProps = (row) => ({
    draggable: !!row.id,
    onDragStart: (e) => { if (row.id) e.dataTransfer.setData("text/plain", encode(row, row.id)); },
    onDragOver: (e) => e.preventDefault(),
    onDrop: (e) => { e.preventDefault(); dropOn(row, decode(e.dataTransfer.getData("text/plain"))); setArmed(null); },
    onClick: () => clickSlot(row),
    onDoubleClick: () => { const p = byId(row.id); if (p) onSelectPlayer(p, team); },
  });
  const chip = (row) => <PlayerChip key={`${row.section}-${row.idx}-${row.key}`} row={row} player={byId(row.id)} lines={lines} armed={armed} drag={dragProps(row)} benchmark={benchmark} />;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
        <h2 style={{ ...h2Style, marginBottom: 0 }}>Planificateur tactique</h2>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {view === "es" && <button onClick={onNaturalRoles} style={{ ...btnStyle("var(--steel)"), fontSize: 12 }}>Rôles naturels pour tous</button>}
          {view === "es" && <button onClick={onAutoLines} style={{ ...btnStyle("var(--win)"), fontSize: 12 }}>Meilleurs trios automatiques</button>}
        </div>
      </div>

      <div role="tablist" aria-label="Situation de jeu" style={{ display: "inline-flex", background: "var(--navy)", border: "1px solid var(--line)", borderRadius: 10, padding: 3, marginBottom: 14, flexWrap: "wrap" }}>
        {VIEWS.map((v) => {
          const active = v.key === view;
          return (
            <button key={v.key} role="tab" aria-selected={active} onClick={() => { setView(v.key); setArmed(null); setUnitIdx(0); }}
              style={{ padding: "7px 14px", borderRadius: 8, border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: active ? 700 : 500, color: active ? "#0A1627" : "var(--ice)", background: active ? "var(--accent)" : "transparent" }}>
              {v.label} <span style={{ fontSize: 10, opacity: 0.7 }}>{v.sub}</span>
            </button>
          );
        })}
      </div>

      {view === "es" ? <TacticSummary lines={lines} /> : <SystemBar kind={view} team={team} lines={lines} onChangeSystem={onChangeSystem} onBestSystem={onBestSystem} onAutoUnits={onAutoUnits} />}

      <p style={{ fontSize: 12, color: "var(--iceMuted)", margin: "0 0 12px" }}>
        Glisse un joueur sur un poste (schéma, tableau ou réservistes), ou clique un joueur puis un poste pour les échanger. Double-clique pour ouvrir sa fiche. Aptitude : les étoiles comparent le joueur au reste de ton effectif ; leur couleur indique s'il a le profil du rôle (vert) ou non (orange, rouge).
      </p>

      <div className="tp-grid">
        <div>
          {view === "es" ? (
            <Rink minHeight={470}>
              <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: 10, padding: "12px 6px" }}>
                {lines.forwards.map((l, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "center", gap: 8 }}>{rows.filter((r) => r.section === "forwards" && r.idx === i).map(chip)}</div>
                ))}
                {lines.defense.map((l, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "center", gap: 40 }}>{rows.filter((r) => r.section === "defense" && r.idx === i).map(chip)}</div>
                ))}
                <div style={{ display: "flex", justifyContent: "center", gap: 18 }}>{rows.filter((r) => r.section === "goalies").map(chip)}</div>
              </div>
            </Rink>
          ) : (
            <>
              <div role="tablist" aria-label="Unité" style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                {[0, 1].map((i) => (
                  <button key={i} role="tab" aria-selected={unitIdx === i} onClick={() => setUnitIdx(i)} style={{ flex: 1, padding: "6px 10px", borderRadius: 8, cursor: "pointer", fontFamily: "inherit", fontSize: 12, fontWeight: 700, color: unitIdx === i ? "#0A1627" : "var(--ice)", background: unitIdx === i ? LINE_TONE[i] : "var(--navy)", border: `1px solid ${unitIdx === i ? LINE_TONE[i] : "var(--line)"}` }}>
                    {SPECIAL_KINDS[view].short}{i + 1} · Unité {i + 1}
                  </button>
                ))}
              </div>
              <Rink half>
                <div style={{ position: "relative", width: "100%", aspectRatio: "1 / 1" }}>
                  {rows.filter((r) => r.idx === unitIdx).map((r) => (
                    <div key={r.key} style={{ position: "absolute", left: `${r.slot.x}%`, top: `${r.slot.y}%`, transform: "translate(-50%, -50%)" }}>{chip(r)}</div>
                  ))}
                </div>
              </Rink>
              <div style={{ fontSize: 11, color: "var(--iceMuted)", marginTop: 6 }}>Zone {view === "pp" ? "adverse" : "défensive"} : ligne bleue en haut, filet en bas.</div>
            </>
          )}
        </div>
        <div>
          <PlannerTable rows={rows} team={team} lines={lines} benchmark={benchmark} armed={armed} dragProps={dragProps} onAssign={onAssign} onChangeRole={onChangeRole} onSelectPlayer={onSelectPlayer} />
        </div>
      </div>

      <section style={{ marginTop: 14, background: "var(--navy2)", border: "1px solid var(--line)", borderRadius: 10, padding: 12 }}>
        <div style={{ fontFamily: "Oswald, sans-serif", fontSize: 14, marginBottom: 8 }}>{view === "es" ? "Hors alignement" : "Autres patineurs"} <span style={{ fontSize: 11, color: "var(--iceMuted)", fontFamily: "inherit" }}>({reserves.length})</span></div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {reserves.length === 0 && <span style={{ fontSize: 12, color: "var(--iceMuted)" }}>Tout l'effectif est utilisé.</span>}
          {reserves.map((p) => {
            const isArmed = armed && !armed.slot && armed.playerId === p.id;
            return (
              <div key={p.id} draggable onDragStart={(e) => e.dataTransfer.setData("text/plain", encode(null, p.id))}
                onClick={() => setArmed(isArmed ? null : { slot: null, playerId: p.id })} onDoubleClick={() => onSelectPlayer(p, team)}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 9px", borderRadius: 8, cursor: "grab", fontSize: 12, background: isArmed ? "var(--red)" : "var(--navy)", border: `1px solid ${isArmed ? "#fff" : "var(--line)"}` }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: "var(--iceMuted)" }}>{POS_FR[p.pos]}</span>
                <span>{p.name}</span>
                <StarRating value={starsFor(p.ovr, benchmark)} size={9} />
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
