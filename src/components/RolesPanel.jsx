import { useState } from "react";
import { ROLES, ROLE_GROUPS, roleGroupOf, roleFit, roleOf, naturalRole, roleWarnings } from "../engine/roles";
import { attr20 } from "../engine/attributes";
import { lineInfo } from "../engine/lines";
import { ATTR_LABELS } from "../engine/attributes";
import { h2Style, btnStyle, attr20Color } from "../ui/theme";
import { PlayerLink } from "./common";

function fitInfo(f) {
  if (f >= 0.5) return { label: "Excellente", color: "var(--win)" };
  if (f >= 0.15) return { label: "Bonne", color: "#7FD6A0" };
  if (f > -0.15) return { label: "Moyenne", color: "var(--gold)" };
  if (f > -0.5) return { label: "Faible", color: "#F59A4A" };
  return { label: "Mauvaise", color: "var(--loss)" };
}

// Effets en jeu d'un rôle, en langage clair.
function effectText(r) {
  const m = r.mods, out = [];
  const pct = (x) => `${x > 1 ? "+" : ""}${Math.round((x - 1) * 100)} %`;
  if (m.shoot && m.shoot !== 1) out.push(`tirs ${pct(m.shoot)}`);
  if (m.pass && m.pass !== 1) out.push(`passes décisives ${pct(m.pass)}`);
  if (m.hit && m.hit !== 1) out.push(`mises en échec ${pct(m.hit)}`);
  if (m.block && m.block !== 1) out.push(`tirs bloqués ${pct(m.block)}`);
  if (m.faceoff) out.push(`mises au jeu +${m.faceoff} (centres bien adaptés)`);
  if (m.attack && m.defense) out.push(m.attack > m.defense ? "penche vers l'attaque" : m.attack < m.defense ? "penche vers la défense" : "équilibré");
  return out.join(" · ");
}

function RoleGuide({ player, roleId }) {
  const r = ROLES[roleId];
  const fit = roleFit(player, roleId);
  const info = fitInfo(fit);
  return (
    <aside style={{ background: "var(--navy2)", border: "1px solid var(--line)", borderRadius: 10, padding: 16, position: "sticky", top: 0 }}>
      <div style={{ fontSize: 11, color: "var(--iceMuted)", letterSpacing: 0.5 }}>{r.en.toUpperCase()} · IMPORTANCE : {r.importance.toUpperCase()}</div>
      <h3 style={{ fontFamily: "Oswald, sans-serif", fontSize: 22, margin: "2px 0 8px" }}>{r.label}</h3>
      <p style={{ fontSize: 13, lineHeight: 1.5, margin: "0 0 12px" }}>{r.desc}</p>
      <div style={{ fontSize: 12, color: "var(--iceMuted)", marginBottom: 6 }}>Attributs clés — {player.name}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 3, marginBottom: 12 }}>
        {Object.keys(r.keys).map((k) => { const v = attr20(player.attrs[k] ?? 60); return (
          <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
            <span>{ATTR_LABELS[k] || k}{r.keys[k] >= 3 ? " ★" : ""}</span>
            <span style={{ background: attr20Color(v), color: "#0A1627", fontWeight: 700, fontSize: 11, borderRadius: 4, padding: "1px 7px", minWidth: 24, textAlign: "center" }}>{v}</span>
          </div>
        ); })}
      </div>
      <div style={{ fontSize: 13, marginBottom: 8 }}>Adéquation : <strong style={{ color: info.color }}>{info.label} ({fit > 0 ? "+" : ""}{Math.round(fit * 100)})</strong></div>
      <div style={{ fontSize: 12, lineHeight: 1.5, color: "var(--iceMuted)" }}>
        <div><strong style={{ color: "var(--ice)" }}>Priorité tactique :</strong> {r.priority}</div>
        {effectText(r) && <div><strong style={{ color: "var(--ice)" }}>En match :</strong> {effectText(r)}</div>}
        <div><strong style={{ color: "var(--ice)" }}>Exemples LNH :</strong> {r.examples}</div>
        <div style={{ marginTop: 6 }}>Un joueur mal adapté ne joue le rôle qu'à moitié et perd en efficacité.</div>
      </div>
    </aside>
  );
}

function PlayerRoleRow({ player, lines, team, selected, onPick, onFocus, focused, onSelectPlayer }) {
  const group = roleGroupOf(player);
  const natural = naturalRole(player);
  const info = lineInfo(player.id, lines);
  const warnings = roleWarnings(selected, info, (lines.pp || []).includes(player.id), (lines.pk || []).includes(player.id));
  return (
    <div style={{ background: focused ? "rgba(92,200,255,0.06)" : "var(--navy)", border: `1px solid ${focused ? "var(--accent)" : "var(--line)"}`, borderRadius: 8, padding: "10px 12px" }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
        <strong style={{ fontSize: 14 }}><PlayerLink player={player} team={team} onSelect={onSelectPlayer} /></strong>
        <span style={{ fontSize: 12, color: "var(--iceMuted)" }}>{player.pos} · {player.age} ans</span>
        <span style={{ fontSize: 11, color: "var(--iceMuted)", marginLeft: "auto" }}>Naturel : <span style={{ color: "var(--gold)" }}>{ROLES[natural].label}</span></span>
      </div>
      <div role="radiogroup" aria-label={`Rôle de ${player.name}`} style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {ROLE_GROUPS[group].map((id) => {
          const f = roleFit(player, id), fi = fitInfo(f), active = id === selected;
          return (
            <button key={id} role="radio" aria-checked={active} onClick={() => { onPick(player.id, id); onFocus(player.id, id); }} onFocus={() => onFocus(player.id, id)} onMouseEnter={() => onFocus(player.id, id)}
              style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 10px", borderRadius: 999, fontSize: 12, fontWeight: active ? 700 : 500, cursor: "pointer", fontFamily: "inherit", color: "var(--ice)",
                background: active ? "linear-gradient(135deg, rgba(92,200,255,0.25), rgba(92,200,255,0.08))" : "var(--navy2)", border: `1px solid ${active ? "var(--accent)" : "var(--line)"}` }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: fi.color }} />{ROLES[id].label}
            </button>
          );
        })}
      </div>
      {warnings.length > 0 && <div style={{ marginTop: 7, display: "flex", flexDirection: "column", gap: 2 }}>{warnings.map((w) => <div key={w} style={{ fontSize: 11, color: "#F59A4A" }}>⚠ {w}</div>)}</div>}
    </div>
  );
}

// Conseils de composition : un trio du top 6 sans créateur, deux défenseurs offensifs ensemble…
function unitHints(kind, ids, roleOfId) {
  const roles = ids.map(roleOfId).filter(Boolean);
  const hints = [];
  if (kind === "F") {
    if (!roles.some((r) => r === "playmaker" || r === "twoWay") && roles.includes("sniper")) hints.push("Aucun fabricant de jeu pour alimenter le franc-tireur.");
    if (roles.filter((r) => r === "sniper").length >= 2 && !roles.includes("playmaker")) hints.push("Deux francs-tireurs sans passeur : peu de création.");
    if (roles.every((r) => r === "grinder")) hints.push("Trio d'énergie : il use l'adversaire mais produit peu.");
  } else if (roles.length === 2) {
    if (roles[0] === "offensiveD" && roles[1] === "offensiveD") hints.push("Deux défenseurs offensifs : jumelle plutôt un offensif avec un défensif pour l'équilibre.");
    if (roles[0] === "stayHome" && roles[1] === "stayHome") hints.push("Deux défenseurs défensifs : solide, mais la relance en souffre.");
  }
  return hints;
}

export function RolesPanel({ team, lines, onChangeRole, onNaturalRoles, onSelectPlayer }) {
  const byId = (id) => team.roster.find((p) => p.id === id);
  const firstId = lines.forwards[0]?.C || lines.forwards[0]?.LW;
  const [focus, setFocus] = useState(() => ({ playerId: firstId, roleId: firstId ? roleOf(lines, byId(firstId)) : "playmaker" }));
  const focusPlayer = byId(focus.playerId) || team.roster.find((p) => p.pos !== "G");
  const focusRole = focusPlayer && ROLES[focus.roleId]?.group === roleGroupOf(focusPlayer) ? focus.roleId : focusPlayer && roleOf(lines, focusPlayer);
  const setF = (playerId, roleId) => setFocus({ playerId, roleId });
  const roleOfId = (id) => (byId(id) ? roleOf(lines, byId(id)) : null);
  const row = (id) => {
    const p = byId(id);
    if (!p) return null;
    return <PlayerRoleRow key={id} player={p} lines={lines} team={team} selected={roleOf(lines, p)} onPick={onChangeRole} onFocus={setF} focused={focus.playerId === id} onSelectPlayer={onSelectPlayer} />;
  };
  const goalie = byId(lines.goalies.starter);
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 6 }}>
        <h2 style={{ ...h2Style, marginBottom: 0 }}>Rôles des joueurs</h2>
        <button onClick={onNaturalRoles} style={btnStyle("var(--win)")}>Rôles naturels pour tous</button>
      </div>
      <p style={{ fontSize: 13, color: "var(--iceMuted)", marginTop: 4, marginBottom: 16, maxWidth: 760, lineHeight: 1.45 }}>
        Demande un rôle à chaque joueur. Le rôle change sa façon de jouer : un franc-tireur tire plus, un fabricant de jeu passe plus, un défenseur défensif bloque plus de tirs… La pastille indique si le joueur a le profil ; un rôle à contre-emploi est joué à moitié et moins bien. Survole ou choisis un rôle pour voir sa fiche.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(260px, 340px)", gap: 18, alignItems: "start" }} className="roles-grid">
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {lines.forwards.map((l, i) => {
            const ids = [l.LW, l.C, l.RW].filter(Boolean);
            const hints = unitHints("F", ids, roleOfId);
            return (
              <section key={`F${i}`}>
                <div style={{ fontFamily: "Oswald, sans-serif", fontSize: 16, marginBottom: 6 }}>Trio {i + 1}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>{ids.map(row)}</div>
                {hints.map((h) => <div key={h} style={{ fontSize: 12, color: "var(--gold)", marginTop: 5 }}>💡 {h}</div>)}
              </section>
            );
          })}
          {lines.defense.map((l, i) => {
            const ids = [l.LD, l.RD].filter(Boolean);
            const hints = unitHints("D", ids, roleOfId);
            return (
              <section key={`D${i}`}>
                <div style={{ fontFamily: "Oswald, sans-serif", fontSize: 16, marginBottom: 6 }}>Paire {i + 1}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>{ids.map(row)}</div>
                {hints.map((h) => <div key={h} style={{ fontSize: 12, color: "var(--gold)", marginTop: 5 }}>💡 {h}</div>)}
              </section>
            );
          })}
          {goalie && (
            <section>
              <div style={{ fontFamily: "Oswald, sans-serif", fontSize: 16, marginBottom: 6 }}>Gardien partant</div>
              <div style={{ background: "var(--navy)", border: "1px solid var(--line)", borderRadius: 8, padding: "10px 12px", fontSize: 13 }}>
                <PlayerLink player={goalie} team={team} onSelect={onSelectPlayer} /> — style {ROLES.butterfly.label} : adéquation <strong style={{ color: fitInfo(roleFit(goalie, "butterfly")).color }}>{fitInfo(roleFit(goalie, "butterfly")).label}</strong>
                <div style={{ fontSize: 11, color: "var(--iceMuted)", marginTop: 4 }}>Le style papillon est le style moderne de tous les gardiens du jeu ; son adéquation reflète leur technique.</div>
              </div>
            </section>
          )}
        </div>
        {focusPlayer && focusRole && <RoleGuide player={focusPlayer} roleId={focusRole} />}
      </div>
    </div>
  );
}
