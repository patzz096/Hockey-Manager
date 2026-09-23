import { useState } from "react";
import { X } from "lucide-react";
import { NATION_FLAG, NATION_NAME } from "../data/names";
import { SKATER_CATEGORIES, GOALIE_CATEGORIES, ATTR_LABELS, attr20, teamOvrBenchmark, starsFor } from "../engine/attributes";
import { lineLabel } from "../engine/lines";
import { getScoutInfo, perceivedRatings, assignScout, scoutingDelay, overallEstimate, reliabilityLabel } from "../engine/scouting";
import { contractLabel, draftLabel } from "../ui/format";
import { btnStyle, scoutQualityColor, attr20Color } from "../ui/theme";
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
  // Les vraies données (import LNH) priment sur les valeurs dérivées.
  return { shoots: player.shoots || shoots, heightCm: player.heightCm || heightCm, weightKg: player.weightKg || weightKg };
}

const FREE_AGENT_TEAM = { id: null, name: "Agent libre", color: "#5C7080", roster: [] };

function tabStyle(active, color) {
  return { background: "none", border: "none", borderBottom: `2px solid ${active ? color : "transparent"}`, color: active ? "var(--ice)" : "var(--iceMuted)", padding: "10px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer" };
}

function Grade20({ value }) {
  const v20 = attr20(value);
  return <span style={{ background: attr20Color(v20), color: "#0B1B2E", fontWeight: 700, fontSize: 11, borderRadius: 3, padding: "1px 7px" }}>{v20}/20</span>;
}

function ReportRow({ label, hint, value, size = 14, color }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid #ffffff11" }}>
      <div>
        <div style={{ fontSize: 13 }}>{label}</div>
        {hint && <div style={{ fontSize: 11, color: "var(--iceMuted)" }}>{hint}</div>}
      </div>
      <StarRating value={value} size={size} color={color} />
    </div>
  );
}

function ScoutingTab({ player, report, pending, currentDay, staff, benchmark, isMine, onRequestScout, onCancelScout }) {
  const scout = pending ? pending.scout : assignScout(player, staff);
  const delay = scoutingDelay(scout.rating);
  const hasReport = report?.estOvr != null;
  function toggle(e) {
    if (e.target.checked) onRequestScout(player);
    else onCancelScout(player.id);
  }
  return (
    <div>
      <label style={{ display: "flex", gap: 10, alignItems: "flex-start", background: "var(--navy)", border: `1px solid ${pending ? "#D9A40488" : "#ffffff22"}`, borderRadius: 4, padding: 12, cursor: "pointer" }}>
        <input type="checkbox" checked={!!pending} onChange={toggle} style={{ marginTop: 3 }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>{hasReport ? "Demander un nouveau rapport" : "Demander un dépistage"}</div>
          <div style={{ fontSize: 12, color: "var(--iceMuted)", marginTop: 4, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            Dépisteur: <span style={{ color: "var(--ice)" }}>{scout.name}</span> <Grade20 value={scout.rating} />
            {scout.offSpecialty && <span>· hors spécialité</span>}
          </div>
          <div style={{ fontSize: 12, marginTop: 4, color: pending ? "#D9A404" : "var(--iceMuted)" }}>
            {pending
              ? `Mission en cours — rapport attendu au jour ${pending.dueDay} (dans ${Math.max(0, pending.dueDay - currentDay)} jour${pending.dueDay - currentDay > 1 ? "s" : ""}). Décoche pour annuler.`
              : `Délai estimé: ${delay} jour${delay > 1 ? "s" : ""} (1 ronde du calendrier = 1 jour). Un meilleur dépisteur est plus rapide et plus précis.`}
          </div>
        </div>
      </label>

      {hasReport ? (
        <div style={{ background: "var(--navy)", border: "1px solid #ffffff22", borderTop: "3px solid #D9A404", borderRadius: 4, padding: 14, marginTop: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 8, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 11, color: "#D9A404", fontWeight: 600, letterSpacing: 0.5 }}>RAPPORT DE DÉPISTAGE · JOUR {report.day}</div>
              <div style={{ fontSize: 13, marginTop: 4, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>{report.scoutName} <Grade20 value={report.quality} /></div>
            </div>
            <div style={{ fontSize: 11, color: "var(--iceMuted)", textAlign: "right" }}>Fiabilité<br /><span style={{ color: "var(--ice)", fontWeight: 600 }}>{reliabilityLabel(report.quality)}</span></div>
          </div>
          <ReportRow label="Habileté actuelle" hint="Ce qu'il apporte aujourd'hui" value={starsFor(report.estOvr, benchmark)} />
          <ReportRow label="Potentiel" hint="Projection à long terme" value={starsFor(report.estPotential, benchmark)} color="#7A9EDB" />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0 4px" }}>
            <div style={{ fontFamily: "Oswald, sans-serif", fontSize: 15, fontWeight: 600 }}>Note générale</div>
            <StarRating value={starsFor(overallEstimate(player.age, report.estOvr, report.estPotential), benchmark)} size={20} />
          </div>
          <div style={{ fontSize: 13, color: "var(--iceMuted)", lineHeight: 1.5, marginTop: 8 }}>{report.text}</div>
          <div style={{ fontSize: 11, color: "var(--iceMuted)", marginTop: 8 }}>Étoiles relatives à la moyenne de ton effectif. Les attributs de l'onglet Profil sont ceux estimés par ce rapport.</div>
        </div>
      ) : (
        <div style={{ fontSize: 12, color: "var(--iceMuted)", marginTop: 14 }}>
          {isMine ? "Ton personnel évalue ce joueur en continu (valeurs de l'onglet Profil, précises selon la note de ton dépisteur). Demande un rapport pour obtenir l'avis détaillé d'un dépisteur." : "Aucun rapport pour ce joueur. Sa cote et ses attributs restent cachés jusqu'à la réception d'un rapport."}
        </div>
      )}
    </div>
  );
}

export function PlayerModal({ player, team, myTeam, lines, editable, seasonStats, staff, myTeamId, scoutKnowledge, pendingScouts, currentDay, onRequestScout, onCancelScout, onClose, onEdit, onOfferContract }) {
  const [tab, setTab] = useState("profile");
  const owner = team || FREE_AGENT_TEAM;
  const isMine = owner.id === myTeamId;
  const categories = player.pos === "G" ? GOALIE_CATEGORIES : SKATER_CATEGORIES;
  const bio = deriveBio(player);
  const stat = seasonStats ? seasonStats[player.id] : null;
  const benchmark = teamOvrBenchmark(myTeam);
  const role = lines ? lineLabel(player.id, lines) : "—";
  const scoutInfo = getScoutInfo(player, owner.id, myTeamId, staff, scoutKnowledge);
  const known = scoutInfo.known;
  const pending = pendingScouts.find((m) => m.playerId === player.id);
  // Tes joueurs arrivent déjà vus par ton personnel (staffViewPlayer); les autres selon le rapport reçu.
  const shown = isMine ? perceivedRatings(player, null) : perceivedRatings(player, scoutInfo);
  const qColor = scoutQualityColor(scoutInfo.quality);
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "#00000099", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 80, padding: 16 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "var(--navy2)", border: `1px solid ${owner.color}55`, borderRadius: 4, width: 500, maxWidth: "94vw", maxHeight: "90vh", overflow: "auto" }}>
        <div style={{ background: `linear-gradient(90deg, ${owner.color}, ${owner.color}99)`, padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#00000030", display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid #ffffff55", flexShrink: 0 }}>
              <span style={{ fontFamily: "Oswald, sans-serif", fontWeight: 700, fontSize: 16, color: "#fff" }}>{player.number ?? player.pos}</span>
            </div>
            <div>
              <div style={{ fontFamily: "Oswald, sans-serif", fontWeight: 600, fontSize: 17, color: "#fff" }}>{player.name}</div>
              <div style={{ fontSize: 12, color: "#ffffffcc" }}>{NATION_FLAG[player.nationality] || "🏳️"} {owner.name} · {player.pos} · {player.age} ans</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer" }}><X size={18} /></button>
        </div>
        <div style={{ display: "flex", borderBottom: "1px solid #ffffff1a", padding: "0 8px" }}>
          <button onClick={() => setTab("profile")} style={tabStyle(tab === "profile", owner.color)}>Profil</button>
          <button onClick={() => setTab("scouting")} style={tabStyle(tab === "scouting", owner.color)}>
            Dépistage{pending ? " · en cours" : scoutInfo.estOvr != null ? " · rapport" : ""}
          </button>
        </div>
        <div style={{ padding: 16 }}>
          {tab === "scouting" ? (
            <ScoutingTab player={player} report={scoutInfo} pending={pending} currentDay={currentDay} staff={staff} benchmark={benchmark} isMine={isMine} onRequestScout={onRequestScout} onCancelScout={onCancelScout} />
          ) : (<>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
            <InfoCard label="CÔTE ACTUELLE / POTENTIELLE" accent={known ? "#D9A404" : "var(--steel)"}>
              {known ? (<><StarRating value={starsFor(shown.ovr, benchmark)} size={13} color={qColor} /><div style={{ marginTop: 4 }}><StarRating value={starsFor(shown.potential, benchmark)} size={13} color={qColor === "#D9A404" ? "#6FA8DC" : "var(--iceMuted)"} /></div></>) : (<div style={{ fontSize: 13, color: "var(--iceMuted)" }}>Non dépisté</div>)}
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
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", fontSize: 12 }}>
              {scoutInfo.estOvr != null ? (
                <span><span style={{ color: qColor, fontWeight: 700 }}>Rapport du jour {scoutInfo.day}</span><span style={{ color: "var(--iceMuted)" }}> · {scoutInfo.scoutName} · {attr20(scoutInfo.quality)}/20</span></span>
              ) : known ? (
                <span><span style={{ color: qColor, fontWeight: 700 }}>Connu (personnel de l'équipe)</span><span style={{ color: "var(--iceMuted)" }}> · qualité {attr20(scoutInfo.quality)}/20</span></span>
              ) : (
                <span style={{ color: "var(--iceMuted)" }}>{pending ? `Dépistage en cours — rapport au jour ${pending.dueDay}.` : "Ce joueur n'a pas été dépisté par ton personnel."}</span>
              )}
              <button onClick={() => setTab("scouting")} style={{ ...btnStyle("var(--steel)"), fontSize: 12, marginLeft: "auto" }}>{scoutInfo.estOvr != null ? "Voir le rapport" : "Onglet Dépistage"}</button>
            </div>
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
                  {cat.attrs.map((k) => <AttrRow key={k} label={ATTR_LABELS[k]} val={shown.attrs[k]} />)}
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
          {editable && (
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => onEdit(player)} style={{ ...btnStyle("var(--steel)"), flex: 1, justifyContent: "center" }}>Modifier ce joueur</button>
              <button onClick={() => onOfferContract(player)} style={{ ...btnStyle("var(--win)"), flex: 1, justifyContent: "center" }}>Nouveau contrat</button>
            </div>
          )}
          </>)}
        </div>
      </div>
    </div>
  );
}
