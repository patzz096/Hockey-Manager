import { X } from "lucide-react";
import { NATION_FLAG, NATION_NAME } from "../data/names";
import { SKATER_CATEGORIES, GOALIE_CATEGORIES, ATTR_LABELS, attr20, teamOvrBenchmark, starsFor } from "../engine/attributes";
import { lineLabel } from "../engine/lines";
import { getScoutInfo } from "../engine/scouting";
import { contractLabel, draftLabel } from "../ui/format";
import { btnStyle, scoutQualityColor } from "../ui/theme";
import { StarRating, AttrRow, InfoCard } from "./common";

export function hashStr(s) { let h = 0; for (let i = 0; i < s.length; i++) { h = (h * 31 + s.charCodeAt(i)) >>> 0; } return h; }

export function deriveBio(player) {
  const h = hashStr(player.id + player.name);
  const shoots = h % 2 === 0 ? "Gauche" : "Droite";
  const isD = player.pos === "LD" || player.pos === "RD";
  const baseHeight = player.pos === "G" ? 185 : isD ? 188 : 180;
  const heightCm = baseHeight + (h % 13) - 6;
  const baseWeight = player.pos === "G" ? 84 : isD ? 92 : 85;
  const weightKg = baseWeight + ((h >> 3) % 15) - 7;
  return { shoots, heightCm, weightKg };
}

export function scoutReport(player, staff) {
  const cats = player.pos === "G" ? GOALIE_CATEGORIES : SKATER_CATEGORIES;
  const allAttrs = cats.flatMap((c) => c.attrs).map((k) => ({ k, v: player.attrs[k] }));
  const sorted = [...allAttrs].sort((a, b) => b.v - a.v);
  const strengths = sorted.slice(0, 2).map((a) => ATTR_LABELS[a.k].toLowerCase());
  const weaknesses = sorted.slice(-2).map((a) => ATTR_LABELS[a.k].toLowerCase());
  const gap = player.potential - player.ovr;
  const scout = staff?.scoutPro || staff?.scoutAmateur;
  let projection;
  if (gap >= 12) projection = "Marge de progression importante — un projet à long terme prometteur.";
  else if (gap >= 5) projection = "Encore de la place pour progresser avec le bon encadrement.";
  else if (gap <= -2) projection = "A probablement atteint son plafond, sinon amorce un déclin.";
  else projection = "Joueur déjà proche de son plein potentiel.";
  const header = scout ? `Analyse de ${scout.name} (dépisteur, cote ${scout.rating})` : "Analyse interne (aucun dépisteur en poste — évaluation limitée)";
  return { header, body: `Points forts: ${strengths.join(" et ")}. À travailler: ${weaknesses.join(" et ")}. ${projection}` };
}

export function PlayerModal({ player, team, lines, editable, seasonStats, staff, myTeamId, scoutKnowledge, onRequestScout, onClose, onEdit, onOfferContract }) {
  const categories = player.pos === "G" ? GOALIE_CATEGORIES : SKATER_CATEGORIES;
  const bio = deriveBio(player);
  const stat = seasonStats ? seasonStats[player.id] : null;
  const benchmark = teamOvrBenchmark(team);
  const role = lineLabel(player.id, lines);
  const scoutInfo = getScoutInfo(player, team.id, myTeamId, staff, scoutKnowledge);
  const known = scoutInfo.known;
  const qColor = scoutQualityColor(scoutInfo.quality);
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "#00000099", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 16 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "var(--navy2)", border: `1px solid ${team.color}55`, borderRadius: 4, width: 500, maxWidth: "94vw", maxHeight: "90vh", overflow: "auto" }}>
        <div style={{ background: `linear-gradient(90deg, ${team.color}, ${team.color}99)`, padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#00000030", display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid #ffffff55", flexShrink: 0 }}>
              <span style={{ fontFamily: "Oswald, sans-serif", fontWeight: 700, fontSize: 16, color: "#fff" }}>{player.number ?? player.pos}</span>
            </div>
            <div>
              <div style={{ fontFamily: "Oswald, sans-serif", fontWeight: 600, fontSize: 17, color: "#fff" }}>{player.name}</div>
              <div style={{ fontSize: 12, color: "#ffffffcc" }}>{NATION_FLAG[player.nationality] || "🏳️"} {team.name} · {player.pos} · {player.age} ans</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer" }}><X size={18} /></button>
        </div>
        <div style={{ padding: 16 }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
            <InfoCard label="CÔTE ACTUELLE / POTENTIELLE" accent={known ? "#D9A404" : "var(--steel)"}>
              {known ? (<><StarRating value={starsFor(player.ovr, benchmark)} size={13} color={qColor} /><div style={{ marginTop: 4 }}><StarRating value={starsFor(player.potential, benchmark)} size={13} color={qColor === "#D9A404" ? "#6FA8DC" : "var(--iceMuted)"} /></div></>) : (<div style={{ fontSize: 13, color: "var(--iceMuted)" }}>Non dépisté</div>)}
            </InfoCard>
            <InfoCard label="SOUS CONTRAT" accent="var(--win)">
              <div style={{ fontSize: 13, fontWeight: 600 }}>{known ? contractLabel(player.contract) : "?"}</div>
            </InfoCard>
            <InfoCard label="RÔLE DANS L'ÉQUIPE" accent="var(--steel)">
              <div style={{ fontSize: 13, fontWeight: 600 }}>{role}</div>
            </InfoCard>
            <InfoCard label="REPÊCHAGE">
              <div style={{ fontSize: 13, fontWeight: 600 }}>{known ? draftLabel(player) : "?"}</div>
            </InfoCard>
          </div>

          <InfoCard label="DÉPISTAGE">
            {known ? (
              <div style={{ fontSize: 12 }}>
                <span style={{ color: qColor, fontWeight: 700 }}>{scoutInfo.month ? `Connu depuis le mois ${scoutInfo.month}` : "Connu (personnel de l'équipe)"}</span>
                <span style={{ color: "var(--iceMuted)" }}> · évalué par {scoutInfo.scoutName} · qualité {attr20(scoutInfo.quality)}/20</span>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <span style={{ fontSize: 12, color: "var(--iceMuted)" }}>Ce joueur n'a pas été dépisté par ton personnel.</span>
                <button onClick={() => onRequestScout(player)} style={{ ...btnStyle("var(--red)"), fontSize: 12 }}>Demander un dépistage</button>
              </div>
            )}
          </InfoCard>

          {known && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr", gap: "2px 12px", fontSize: 12, margin: "16px 0 18px", color: "var(--iceMuted)" }}>
              <div>Nationalité <span style={{ color: "var(--ice)" }}>{NATION_FLAG[player.nationality] || ""} {NATION_NAME[player.nationality] || "—"}</span></div>
              <div>Tire <span style={{ color: "var(--ice)" }}>{bio.shoots}</span></div>
              <div>Taille <span style={{ color: "var(--ice)" }}>{bio.heightCm} cm</span></div>
              <div>Poids <span style={{ color: "var(--ice)" }}>{bio.weightKg} kg</span></div>
              <div>Forme <span style={{ color: "var(--win)" }}>Bonne</span></div>
            </div>
          )}

          {known ? (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px", marginTop: 16 }}>
              {categories.map((cat) => (
                <div key={cat.key} style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 11, letterSpacing: 0.5, color: "var(--iceMuted)", marginBottom: 4, borderBottom: "1px solid #ffffff1a", paddingBottom: 3 }}>{cat.label.toUpperCase()}</div>
                  {cat.attrs.map((k) => <AttrRow key={k} label={ATTR_LABELS[k]} val={player.attrs[k]} />)}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: 12, color: "var(--iceMuted)", margin: "16px 0" }}>Attributs cachés tant que ce joueur n'a pas été dépisté.</div>
          )}
          {known && player.pos !== "G" && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: "var(--iceMuted)", marginBottom: 6, borderTop: "1px solid #ffffff1a", paddingTop: 10 }}>STATISTIQUES DE SAISON</div>
              <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
                <thead><tr style={{ color: "var(--iceMuted)", fontSize: 11 }}>{["PJ", "B", "A", "PTS", "T", "+/-", "MEC", "PUN"].map((h) => (<th key={h} style={{ padding: "3px 6px", borderBottom: "1px solid #ffffff1a" }}>{h}</th>))}</tr></thead>
                <tbody><tr>{[stat?.gp || 0, stat?.g || 0, stat?.a || 0, stat?.pts || 0, stat?.shots || 0, stat?.plusMinus || 0, stat?.hits || 0, stat?.pim || 0].map((v, i) => (<td key={i} style={{ padding: "5px 6px", textAlign: "center" }}>{i === 5 && v > 0 ? `+${v}` : v}</td>))}</tr></tbody>
              </table>
            </div>
          )}
          {editable && known && (() => { const report = scoutReport(player, staff); return (
            <div style={{ background: "var(--navy)", border: "1px solid #ffffff22", borderRadius: 4, padding: 12, marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: "#D9A404", marginBottom: 4, fontWeight: 600 }}>{report.header.toUpperCase()}</div>
              <div style={{ fontSize: 13, color: "var(--iceMuted)", lineHeight: 1.5 }}>{report.body}</div>
            </div>
          ); })()}
          {editable && (
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => onEdit(player)} style={{ ...btnStyle("var(--steel)"), flex: 1, justifyContent: "center" }}>Modifier ce joueur</button>
              <button onClick={() => onOfferContract(player)} style={{ ...btnStyle("var(--win)"), flex: 1, justifyContent: "center" }}>Nouveau contrat</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
