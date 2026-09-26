import { X } from "lucide-react";
import { SKATER_CATEGORIES, GOALIE_CATEGORIES, ATTR_LABELS, attr20, teamOvrBenchmark, starsFor } from "../engine/attributes";
import { attr20Color } from "../ui/theme";
import { StarRating, PlayerFace } from "./common";

// Ligne de comparaison d'un attribut entre deux joueurs (façon FM "Compare With") : la valeur la
// plus haute est mise en évidence, les deux badges restent sur l'échelle /20 habituelle.
function CompareAttrRow({ label, a, b }) {
  const va = attr20(a), vb = attr20(b);
  const badge = (v, best) => (
    <span style={{ background: attr20Color(v), color: "#0B1B2E", fontWeight: 700, fontSize: 11, borderRadius: 3, padding: "1px 8px", minWidth: 26, textAlign: "center", outline: best ? "2px solid #fff" : "none" }}>{v}</span>
  );
  return (
    <div style={{ display: "grid", gridTemplateColumns: "60px 1fr 60px", alignItems: "center", gap: 8, padding: "3px 0" }}>
      <div style={{ textAlign: "right" }}>{badge(va, va > vb)}</div>
      <div style={{ fontSize: 12, color: "var(--iceMuted)", textAlign: "center" }}>{label}</div>
      <div>{badge(vb, vb > va)}</div>
    </div>
  );
}

function PlayerHeader({ player, team }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <PlayerFace player={player} size={44} color={team.color} />
      <div>
        <div style={{ fontFamily: "Oswald, sans-serif", fontWeight: 600, fontSize: 15 }}>{player.name}</div>
        <div style={{ fontSize: 11, color: "var(--iceMuted)" }}>{player.pos} · {player.age} ans</div>
      </div>
    </div>
  );
}

// Page plein écran comparant deux joueurs (même équipe, même groupe de position) attribut par
// attribut, avec leur cote et potentiel en étoiles en tête — même format que les profils.
export function ComparePlayersModal({ players, team, onClose }) {
  const [pa, pb] = players;
  const categories = pa.pos === "G" ? GOALIE_CATEGORIES : SKATER_CATEGORIES;
  const benchmark = teamOvrBenchmark(team);
  return (
    <div style={{ position: "fixed", inset: 0, background: "var(--navy)", zIndex: 80, display: "flex", flexDirection: "column" }}>
      <div style={{ background: `linear-gradient(90deg, ${team.color}, ${team.color}99)`, padding: "16px 28px", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
        <div style={{ fontFamily: "Oswald, sans-serif", fontWeight: 600, fontSize: 19, color: "#fff" }}>Comparaison de joueurs</div>
        <button onClick={onClose} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer" }}><X size={22} /></button>
      </div>
      <div style={{ flex: 1, overflow: "auto" }}>
        <div style={{ maxWidth: 780, margin: "0 auto", padding: "24px 28px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
            <PlayerHeader player={pa} team={team} />
            <PlayerHeader player={pb} team={team} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20, padding: "10px 0", borderTop: "1px solid #ffffff1a", borderBottom: "1px solid #ffffff1a" }}>
            <div><div style={{ fontSize: 10, color: "var(--iceMuted)", marginBottom: 3 }}>COTE / POTENTIEL</div><StarRating value={starsFor(pa.ovr, benchmark)} size={14} /><div style={{ marginTop: 2 }}><StarRating value={starsFor(pa.potential, benchmark)} size={12} color="#7A9EDB" /></div></div>
            <div style={{ textAlign: "right" }}><div style={{ fontSize: 10, color: "var(--iceMuted)", marginBottom: 3 }}>COTE / POTENTIEL</div><StarRating value={starsFor(pb.ovr, benchmark)} size={14} /><div style={{ marginTop: 2 }}><StarRating value={starsFor(pb.potential, benchmark)} size={12} color="#7A9EDB" /></div></div>
          </div>
          {categories.map((cat) => (
            <div key={cat.key} style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 11, letterSpacing: 0.5, color: "var(--iceMuted)", marginBottom: 4, borderBottom: "1px solid #ffffff1a", paddingBottom: 3, textAlign: "center" }}>{cat.label.toUpperCase()}</div>
              {cat.attrs.map((k) => <CompareAttrRow key={k} label={ATTR_LABELS[k]} a={pa.attrs[k]} b={pb.attrs[k]} />)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
