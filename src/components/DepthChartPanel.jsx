import { useState } from "react";
import { teamOvrBenchmark, starsFor } from "../engine/attributes";
import { lineLabel, lineInfo } from "../engine/lines";
import { ltirEligible, injuryLabel } from "../engine/injuries";
import { formatDay } from "../engine/calendar";
import { formatMoney, ROSTER_MAX } from "../engine/cap";
import { h2Style } from "../ui/theme";
import { StarRating, InjuryBadge } from "./common";

// ---------------------------------------------------------------------------------------
// Onglet Profondeur : toute l'organisation (LNH, club-école, espoirs) vue de trois façons,
// inspirées de Football Manager (Squad Planner) et d'Eastside Hockey Manager (Team Report) :
//   Patinoire : une carte par position, profondeur 1-2-3-4 et nombre de joueurs LNH ;
//   Tableau   : colonnes par position, joueurs classés du meilleur au moins bon ;
//   Rapport   : besoins, meneurs par catégorie, meilleurs espoirs et infirmerie.
// Chaque joueur est cliquable : les actions (rappel, renvoi, LTIR…) sont dans son profil.
// ---------------------------------------------------------------------------------------

const POSITIONS = [
  { pos: "G", short: "G", label: "Gardiens", need: 2 },
  { pos: "LD", short: "DG", label: "Défenseurs gauches", need: 3 },
  { pos: "RD", short: "DD", label: "Défenseurs droits", need: 3 },
  { pos: "LW", short: "AG", label: "Ailiers gauches", need: 4 },
  { pos: "C", short: "C", label: "Centres", need: 4 },
  { pos: "RW", short: "AD", label: "Ailiers droits", need: 4 },
];
const LEVELS = {
  NHL: { label: "LNH", color: "var(--ice)", tag: "#5CC8FF" },
  AHL: { label: "LAH", color: "var(--gold)", tag: "#FFC247" },
  PROS: { label: "Espoir", color: "#7FD6A0", tag: "#2DBE74" },
};
// « Cole Caufield » → « C. Caufield » (tableau serré, comme EHM).
const shortName = (name) => { const parts = name.split(" "); return parts.length > 1 ? `${parts[0][0]}. ${parts.slice(1).join(" ")}` : name; };
const avgOf = (p, keys) => keys.reduce((a, k) => a + (p.attrs[k] ?? 50), 0) / keys.length;

function LevelTag({ level }) {
  const l = LEVELS[level];
  return <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: 0.3, color: "#0A1627", background: l.tag, borderRadius: 3, padding: "0 4px", lineHeight: "14px", flexShrink: 0 }}>{l.label}</span>;
}

// Une ligne « joueur » réutilisée par les cartes et le tableau.
function PlayerLine({ entry, rank, benchmark, lines, injuries, day, onOpen, compact = false, table = false }) {
  const { p, level, waivers } = entry;
  const hurt = injuries[p.id] && injuries[p.id].until > day;
  return (
    <button onClick={() => onOpen(entry)} title={`${p.name} — ${p.age} ans — ouvrir le profil`}
      style={{ display: "flex", alignItems: "center", gap: 6, width: "100%", background: "none", border: "none", borderTop: rank > 1 ? "1px solid #ffffff10" : "none", padding: compact ? "3px 2px" : "5px 2px", cursor: "pointer", color: LEVELS[level].color, fontFamily: "inherit", textAlign: "left" }}>
      {!table && <span style={{ fontSize: 10, color: "var(--iceMuted)", width: 22, flexShrink: 0 }}>{rank}{rank === 1 ? "er" : "e"}</span>}
      <span style={{ flex: 1, minWidth: 0, fontSize: 12, fontWeight: level === "NHL" ? 600 : 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", opacity: hurt ? 0.6 : 1 }}>
        {table ? shortName(p.name) : p.name}<InjuryBadge injury={injuries[p.id]} day={day} />
      </span>
      {!compact && level === "NHL" && lines && <span style={{ fontSize: 10, color: "var(--iceMuted)", whiteSpace: "nowrap" }}>{lineLabel(p.id, lines).split(" · ")[0].replace("Trio ", "T").replace("Paire ", "P")}</span>}
      {waivers && <span title="Ballottage requis pour le renvoyer au club-école" style={{ fontSize: 9, fontWeight: 700, color: "var(--gold)", border: "1px solid rgba(255,194,71,0.45)", borderRadius: 3, padding: "0 3px", lineHeight: "13px" }}>B</span>}
      {level !== "NHL" && !table && <LevelTag level={level} />}
      <StarRating value={starsFor(p.ovr, benchmark)} size={9} />
    </button>
  );
}

// ------------------------------------ Vue patinoire ------------------------------------
function PositionCard({ def, list, benchmark, lines, injuries, day, onOpen }) {
  const nhl = list.filter((e) => e.level === "NHL" && !(injuries[e.p.id] && injuries[e.p.id].until > day)).length;
  const ok = nhl >= def.need;
  return (
    <section style={{ background: "rgba(8,20,36,0.92)", border: "1px solid #ffffff26", borderRadius: 8, padding: "8px 10px", boxShadow: "0 6px 16px #0007", minWidth: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
        <span style={{ fontSize: 10, fontWeight: 800, background: "var(--accent)", color: "#0A1627", borderRadius: 3, padding: "1px 5px" }}>{def.short}</span>
        <strong style={{ fontSize: 12, flex: 1 }}>{def.label}</strong>
        <span title={`${nhl} joueur(s) LNH en santé ; il en faut ${def.need}`} style={{ fontSize: 10, fontWeight: 700, borderRadius: 3, padding: "1px 6px", background: ok ? "rgba(45,190,116,0.2)" : "rgba(240,96,93,0.2)", color: ok ? "#7FD6A0" : "#FF9A97" }}>
          {nhl}/{def.need}
        </span>
      </div>
      {list.length === 0 && <div style={{ fontSize: 12, color: "var(--iceMuted)", padding: "4px 0" }}>Aucun joueur</div>}
      {list.map((e, i) => <PlayerLine key={e.p.id} entry={e} rank={i + 1} benchmark={benchmark} lines={lines} injuries={injuries} day={day} onOpen={onOpen} compact />)}
    </section>
  );
}

function RinkView({ byPos, ...rest }) {
  const card = (pos) => <PositionCard def={POSITIONS.find((d) => d.pos === pos)} list={byPos[pos]} {...rest} />;
  return (
    <div className="depth-rink" style={{ position: "relative", borderRadius: 16, padding: 16, background: "radial-gradient(120% 100% at 50% 50%, #1B3A58, #0C1D31)", border: "1px solid var(--line)", overflow: "hidden" }}>
      {/* Lignes de patinoire, vue de côté : défensive à gauche, offensive à droite. */}
      <svg viewBox="0 0 100 50" preserveAspectRatio="none" aria-hidden="true" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.35 }}>
        <rect x="1" y="1" width="98" height="48" rx="8" fill="none" stroke="#9FD3F5" strokeWidth="0.3" />
        <rect x="6" y="1" width="0.3" height="48" fill="#C8102E" />
        <rect x="93.7" y="1" width="0.3" height="48" fill="#C8102E" />
        <rect x="35" y="1" width="0.8" height="48" fill="#2F6FB5" />
        <rect x="64.2" y="1" width="0.8" height="48" fill="#2F6FB5" />
        <rect x="49.8" y="1" width="0.4" height="48" fill="#C8102E" />
        <ellipse cx="50" cy="25" rx="6" ry="9" fill="none" stroke="#2F6FB5" strokeWidth="0.3" />
      </svg>
      <div className="depth-rink-grid" style={{ position: "relative" }}>
        <div style={{ gridArea: "g" }}>{card("G")}</div>
        <div style={{ gridArea: "ld" }}>{card("LD")}</div>
        <div style={{ gridArea: "rd" }}>{card("RD")}</div>
        <div style={{ gridArea: "lw" }}>{card("LW")}</div>
        <div style={{ gridArea: "c" }}>{card("C")}</div>
        <div style={{ gridArea: "rw" }}>{card("RW")}</div>
      </div>
    </div>
  );
}

// ------------------------------------ Vue tableau ------------------------------------
function TableView({ byPos, benchmark, lines, injuries, day, onOpen }) {
  const rows = Math.max(...POSITIONS.map((d) => byPos[d.pos].length), 1);
  return (
    <div style={{ overflowX: "auto", background: "var(--navy2)", border: "1px solid var(--line)", borderRadius: 10 }}>
      <table style={{ width: "100%", minWidth: 960, borderCollapse: "collapse", tableLayout: "fixed" }}>
        <thead>
          <tr>
            <th style={{ width: 30, padding: "8px 6px", fontSize: 10, color: "var(--iceMuted)", borderBottom: "1px solid var(--line)" }}>#</th>
            {POSITIONS.map((d) => <th key={d.pos} style={{ padding: "8px 6px", fontSize: 11, letterSpacing: 0.4, color: "var(--accent)", borderBottom: "1px solid var(--line)", textAlign: "left" }}>{d.label.toUpperCase()}</th>)}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }, (_, i) => (
            <tr key={i} style={{ background: i % 2 ? "#ffffff05" : "transparent" }}>
              <td style={{ padding: "0 6px", fontSize: 11, color: "var(--iceMuted)", textAlign: "center" }}>{i + 1}</td>
              {POSITIONS.map((d) => {
                const e = byPos[d.pos][i];
                return (
                  <td key={d.pos} style={{ padding: "0 6px", borderLeft: "1px solid #ffffff0d", background: i < d.need ? "rgba(92,200,255,0.04)" : "transparent" }}>
                    {e ? <PlayerLine entry={e} rank={i + 1} benchmark={benchmark} lines={lines} injuries={injuries} day={day} onOpen={onOpen} compact table /> : null}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ------------------------------------ Vue rapport ------------------------------------
const LEADERS = [
  { label: "Plus grande vedette", value: (p) => p.ovr, skaters: false },
  { label: "Meilleur leader", value: (p) => p.attrs.leadership, skaters: false },
  { label: "Meilleur patineur", value: (p) => avgOf(p, ["speed", "acceleration", "agility"]) },
  { label: "Meilleur tireur", value: (p) => avgOf(p, ["shotAccuracy", "gettingOpen"]) },
  { label: "Tir le plus puissant", value: (p) => p.attrs.shotRange },
  { label: "Meilleur passeur", value: (p) => avgOf(p, ["passing", "offensiveRead"]) },
  { label: "Mises au jeu", value: (p) => p.attrs.faceoffs, only: ["C"] },
  { label: "Meilleur défensivement", value: (p) => avgOf(p, ["positioning", "defensiveRead", "stickchecking"]) },
  { label: "Meilleur bloqueur de tirs", value: (p) => p.attrs.shotBlocking },
  { label: "Plus physique", value: (p) => avgOf(p, ["hitting", "checking", "strength"]) },
  { label: "Bagarreur", value: (p) => p.attrs.fighting },
];

function ReportView({ team, org, benchmark, byPos, injuries, day, onOpen, onSelectPlayer, cap }) {
  const nhl = org.filter((e) => e.level === "NHL");
  const skaters = nhl.filter((e) => e.p.pos !== "G");
  const leaders = LEADERS.map((l) => {
    const pool = (l.skaters === false ? nhl : skaters).filter((e) => !l.only || l.only.includes(e.p.pos));
    const best = pool.reduce((a, e) => (!a || l.value(e.p) > l.value(a.p) ? e : a), null);
    return { ...l, best };
  });
  const prospects = org.filter((e) => e.p.age <= 23 && e.level !== "NHL").sort((a, b) => b.p.potential - a.p.potential).slice(0, 10);
  const hurt = team.roster.filter((p) => injuries[p.id] && injuries[p.id].until > day);
  const needs = POSITIONS.map((d) => {
    const healthy = byPos[d.pos].filter((e) => e.level === "NHL" && !(injuries[e.p.id] && injuries[e.p.id].until > day)).length;
    const nextUp = byPos[d.pos].find((e) => e.level !== "NHL");
    return { ...d, healthy, nextUp };
  });
  const card = { background: "var(--navy2)", border: "1px solid var(--line)", borderRadius: 10, padding: 14 };
  const head = { fontFamily: "Oswald, sans-serif", fontSize: 16, marginBottom: 8 };
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 14 }}>
      <section style={card}>
        <div style={head}>Besoins de l'équipe</div>
        {needs.map((n) => (
          <div key={n.pos} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, padding: "4px 0", borderTop: "1px solid #ffffff0d" }}>
            <span style={{ width: 130 }}>{n.label}</span>
            <strong style={{ color: n.healthy >= n.need ? "#7FD6A0" : "#FF9A97", width: 40 }}>{n.healthy}/{n.need}</strong>
            <span style={{ color: "var(--iceMuted)", flex: 1 }}>
              {n.healthy < n.need ? (n.nextUp ? <>Manque {n.need - n.healthy} · prochain : <button onClick={() => onOpen(n.nextUp)} style={{ background: "none", border: "none", color: "var(--gold)", cursor: "pointer", padding: 0, fontFamily: "inherit", fontSize: 12, textDecoration: "underline" }}>{n.nextUp.p.name}</button></> : `Manque ${n.need - n.healthy} · aucun remplaçant dans l'organisation`) : n.healthy > n.need + 1 ? "Surplus" : "Complet"}
            </span>
          </div>
        ))}
        <div style={{ fontSize: 11, color: "var(--iceMuted)", marginTop: 8 }}>
          Alignement : {cap.rosterSize}/{ROSTER_MAX} · espace sous le plafond : <span style={{ color: cap.space >= 0 ? "#7FD6A0" : "#FF9A97" }}>{formatMoney(cap.space)}</span>
        </div>
      </section>

      <section style={card}>
        <div style={head}>Meneurs de l'équipe</div>
        {leaders.map((l) => (
          <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, padding: "3px 0", borderTop: "1px solid #ffffff0d" }}>
            <span style={{ width: 170, color: "var(--iceMuted)" }}>{l.label}</span>
            {l.best ? <button onClick={() => onOpen(l.best)} style={{ background: "none", border: "none", color: "var(--ice)", cursor: "pointer", padding: 0, fontFamily: "inherit", fontSize: 12, fontWeight: 600, textAlign: "left" }}>{l.best.p.name}</button> : "—"}
          </div>
        ))}
      </section>

      <section style={card}>
        <div style={head}>Meilleurs espoirs</div>
        {prospects.length === 0 && <div style={{ fontSize: 12, color: "var(--iceMuted)" }}>Aucun espoir de 23 ans ou moins hors de la LNH.</div>}
        {prospects.map((e, i) => (
          <button key={e.p.id} onClick={() => onOpen(e)} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", background: "none", border: "none", borderTop: i ? "1px solid #ffffff0d" : "none", padding: "4px 0", cursor: "pointer", color: "var(--ice)", fontFamily: "inherit", fontSize: 12, textAlign: "left" }}>
            <span style={{ width: 18, color: "var(--iceMuted)" }}>{i + 1}</span>
            <span style={{ flex: 1 }}>{e.p.name}</span>
            <span style={{ color: "var(--iceMuted)", whiteSpace: "nowrap" }}>{e.p.age} ans · {POSITIONS.find((d) => d.pos === e.p.pos)?.short}</span>
            <LevelTag level={e.level} />
            <span title="Potentiel"><StarRating value={starsFor(e.p.potential, benchmark)} size={10} color="#7A9EDB" /></span>
          </button>
        ))}
      </section>

      <section style={card}>
        <div style={head}>Infirmerie</div>
        {hurt.length === 0 ? <div style={{ fontSize: 12, color: "var(--iceMuted)" }}>Aucun blessé. Les blessés sont remplacés automatiquement dans les trios par le meilleur joueur disponible.</div> : hurt.map((p) => {
          const i = injuries[p.id];
          return (
            <button key={p.id} onClick={() => onSelectPlayer(p, team)} style={{ display: "block", width: "100%", textAlign: "left", background: "none", border: "none", borderLeft: `3px solid ${i.ltir ? "#7A4E9E" : "var(--loss)"}`, padding: "5px 8px", marginBottom: 6, cursor: "pointer", color: "var(--ice)", fontFamily: "inherit", fontSize: 12 }}>
              <strong>{p.name}</strong> <span style={{ color: "var(--iceMuted)" }}>({p.pos}) · {injuryLabel(i, day)} · retour vers le {formatDay(i.until)}</span>
              <div style={{ fontSize: 11, color: "#C9A6E8" }}>{i.ltir ? `En LTIR : place libérée, ${formatMoney(p.contract?.salary || 0)} d'allègement` : ltirEligible(i, day) ? "Admissible à la LTIR (dans son profil)" : "Absence trop courte pour la LTIR"}</div>
            </button>
          );
        })}
      </section>
    </div>
  );
}

// ------------------------------------ Composant ------------------------------------
const VIEWS = [["rink", "Patinoire"], ["table", "Tableau par position"], ["report", "Rapport d'équipe"]];

export function DepthChartPanel({ team, farm, lines, needsWaivers = () => false, onSelectPlayer, injuries = {}, day = 0, cap }) {
  const [view, setView] = useState("rink");
  const [scope, setScope] = useState("org");
  const benchmark = teamOvrBenchmark(team);
  const org = [
    ...team.roster.map((p) => ({ p, level: "NHL", waivers: needsWaivers(p) })),
    ...farm.map((p) => ({ p, level: p.age <= 20 ? "PROS" : "AHL" })),
  ];
  const shown = scope === "nhl" ? org.filter((e) => e.level === "NHL") : org;
  // Patinoire : l'ordre de l'alignement réel (trio 1, paire 1, partant…) puis le reste par cote ;
  // tableau : classement par cote seulement, pour repérer un joueur du club-école meilleur qu'un titulaire.
  const depthKey = (e) => { if (e.level !== "NHL") return 100; const i = lineInfo(e.p.id, lines); return i.idx < 0 ? 50 : i.idx; };
  const byPos = Object.fromEntries(POSITIONS.map((d) => [d.pos, shown.filter((e) => e.p.pos === d.pos).sort((a, b) => (view === "rink" ? depthKey(a) - depthKey(b) : 0) || b.p.ovr - a.p.ovr)]));
  const onOpen = (e) => onSelectPlayer(e.p, team);
  const shared = { benchmark, lines, injuries, day, onOpen };
  const counts = { NHL: org.filter((e) => e.level === "NHL").length, AHL: org.filter((e) => e.level === "AHL").length, PROS: org.filter((e) => e.level === "PROS").length };
  const hurtCount = team.roster.filter((p) => injuries[p.id] && injuries[p.id].until > day).length;
  const segBtn = (active) => ({ padding: "6px 12px", borderRadius: 7, border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 12, fontWeight: active ? 700 : 500, color: active ? "#0A1627" : "var(--ice)", background: active ? "var(--accent)" : "transparent" });

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
        <h2 style={{ ...h2Style, marginBottom: 0 }}>Profondeur de l'organisation</h2>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", fontSize: 12 }}>
          {[["LNH", `${counts.NHL}/${ROSTER_MAX}`, "var(--ice)"], ["LAH", counts.AHL, "var(--gold)"], ["Espoirs", counts.PROS, "#7FD6A0"], ["Blessés", hurtCount, hurtCount ? "#FF9A97" : "var(--iceMuted)"], ["Plafond", cap ? formatMoney(cap.space) : "—", cap && cap.space < 0 ? "#FF9A97" : "#7FD6A0"]].map(([k, v, c]) => (
            <span key={k} style={{ background: "var(--navy2)", border: "1px solid var(--line)", borderRadius: 8, padding: "5px 10px" }}><span style={{ color: "var(--iceMuted)" }}>{k} </span><strong style={{ color: c }}>{v}</strong></span>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 12 }}>
        <div role="tablist" aria-label="Vue" style={{ display: "inline-flex", background: "var(--navy)", border: "1px solid var(--line)", borderRadius: 9, padding: 3 }}>
          {VIEWS.map(([k, label]) => <button key={k} role="tab" aria-selected={view === k} onClick={() => setView(k)} style={segBtn(view === k)}>{label}</button>)}
        </div>
        {view !== "report" && (
          <div role="radiogroup" aria-label="Portée" style={{ display: "inline-flex", background: "var(--navy)", border: "1px solid var(--line)", borderRadius: 9, padding: 3 }}>
            {[["org", "Organisation"], ["nhl", "LNH seulement"]].map(([k, label]) => <button key={k} role="radio" aria-checked={scope === k} onClick={() => setScope(k)} style={segBtn(scope === k)}>{label}</button>)}
          </div>
        )}
        <span style={{ fontSize: 11, color: "var(--iceMuted)", display: "inline-flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ color: "var(--ice)" }}>■ LNH</span> <LevelTag level="AHL" /> club-école <LevelTag level="PROS" /> espoir (20 ans et moins)
          <span style={{ fontWeight: 700, color: "var(--gold)", border: "1px solid rgba(255,194,71,0.45)", borderRadius: 3, padding: "0 3px" }}>B</span> ballottage requis
        </span>
      </div>
      <p style={{ fontSize: 12, color: "var(--iceMuted)", margin: "0 0 12px" }}>{view === "rink" ? "Patinoire : ordre de ton alignement (trio, paire, partant), puis la relève par cote. Le compteur indique les joueurs LNH en santé sur le nombre requis. " : view === "table" ? "Tableau : toute la position classée par cote (couleur du nom : blanc LNH, or club-école, vert espoir). " : ""}Clique un joueur pour ouvrir son profil : rappel, renvoi, ballottage, LTIR et contrat se gèrent dans son volet « Gestion du joueur ».</p>

      {view === "rink" && <RinkView byPos={byPos} {...shared} />}
      {view === "table" && <TableView byPos={byPos} {...shared} />}
      {view === "report" && <ReportView team={team} org={org} byPos={Object.fromEntries(POSITIONS.map((d) => [d.pos, org.filter((e) => e.p.pos === d.pos).sort((a, b) => b.p.ovr - a.p.ovr)]))} onSelectPlayer={onSelectPlayer} cap={cap || { rosterSize: counts.NHL, space: 0 }} {...shared} />}
    </div>
  );
}
