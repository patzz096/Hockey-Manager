import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { NATION_FLAG, NATION_NAME } from "../data/names";
import { SKATER_CATEGORIES, GOALIE_CATEGORIES, ATTR_LABELS, attr20, teamOvrBenchmark, starsFor } from "../engine/attributes";
import { lineLabel } from "../engine/lines";
import { formatDay } from "../engine/calendar";
import { ROLES, naturalRole, roleFit, roleOf } from "../engine/roles";
import { getScoutInfo, perceivedRatings, scoutOptions, scoutingDelay, overallEstimate, reliabilityLabel } from "../engine/scouting";
import { contractLabel, draftLabel } from "../ui/format";
import { btnStyle, scoutQualityColor, attr20Color } from "../ui/theme";
import { StarRating, AttrRow, InfoCard, PlayerFace, InjuryBadge, ConfirmButton } from "./common";
import { useCustomization, useFaceUrl } from "../custom/CustomizationContext";
import { MINOR_LEAGUES } from "../engine/minorLeagues";

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

function FacePicker({ player }) {
  const { setFace } = useCustomization();
  const url = useFaceUrl(player);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--iceMuted)", margin: "4px 0 14px" }}>
      Photo :
      <label style={{ ...btnStyle("var(--steel)"), fontSize: 11, padding: "3px 8px" }}>
        {url ? "Changer" : "Choisir une image"}
        <input type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) setFace(player, f); }} />
      </label>
      {url && <button onClick={() => setFace(player, null)} style={{ background: "none", border: "none", color: "var(--iceMuted)", cursor: "pointer", fontSize: 11, textDecoration: "underline" }}>Retirer</button>}
    </div>
  );
}

const FREE_AGENT_TEAM = { id: null, name: "Agent libre", color: "#5C7080", roster: [] };
const PROSPECT_TEAM = { id: null, name: "Espoir du repêchage", color: "#7A4E9E", roster: [] };

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

function ScoutingTab({ player, report, pending, currentDay, staff, extraScouts = [], benchmark, isMine, onRequestScout, onCancelScout }) {
  const options = scoutOptions(player, staff, extraScouts);
  const [chosenId, setChosenId] = useState(null);
  const chosen = options.find((o) => o.id === chosenId) || options[0];
  const scout = pending ? pending.scout : chosen;
  const delay = scoutingDelay(scout.rating);
  const hasReport = report?.estOvr != null;
  function toggle(e) {
    if (e.target.checked) onRequestScout(player, chosen.id);
    else onCancelScout(player.id);
  }
  return (
    <div>
      <label style={{ display: "flex", gap: 10, alignItems: "flex-start", background: "var(--navy)", border: `1px solid ${pending ? "rgba(255,194,71,0.55)" : "#ffffff22"}`, borderRadius: 4, padding: 12, cursor: "pointer" }}>
        <input type="checkbox" checked={!!pending} onChange={toggle} style={{ marginTop: 3 }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>{hasReport ? "Demander un nouveau rapport" : "Demander un dépistage"}</div>
          {pending || options.length <= 1 ? (
            <div style={{ fontSize: 12, color: "var(--iceMuted)", marginTop: 4, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              Dépisteur: <span style={{ color: "var(--ice)" }}>{scout.name}</span> <Grade20 value={scout.rating} />
              {scout.offSpecialty && <span>· hors spécialité</span>}
            </div>
          ) : (
            <div style={{ marginTop: 6 }} onClick={(e) => e.preventDefault()}>
              <label style={{ fontSize: 11, color: "var(--iceMuted)", display: "block", marginBottom: 3 }}>Choisir le dépisteur assigné :</label>
              <select value={chosen.id} onChange={(e) => setChosenId(e.target.value)} style={{ background: "var(--navy2)", color: "var(--ice)", border: "1px solid #ffffff33", borderRadius: 3, padding: "4px 6px", fontSize: 12, width: "100%" }}>
                {options.map((o) => (
                  <option key={o.id} value={o.id}>{o.name} — {attr20(o.rating)}/20{o.offSpecialty ? " (hors spécialité)" : ""} — {o.etaDays}j</option>
                ))}
              </select>
            </div>
          )}
          <div style={{ fontSize: 12, marginTop: 4, color: pending ? "var(--gold)" : "var(--iceMuted)" }}>
            {pending
              ? `Mission en cours — rapport attendu le ${formatDay(pending.dueDay)} (dans ${Math.max(0, pending.dueDay - currentDay)} jour${pending.dueDay - currentDay > 1 ? "s" : ""}). Décoche pour annuler.`
              : `Délai estimé : ${delay} jours de calendrier (rapport vers le ${formatDay(currentDay + delay)}). Un meilleur dépisteur est plus rapide et plus précis.`}
          </div>
        </div>
      </label>

      {hasReport ? (
        <div style={{ background: "var(--navy)", border: "1px solid #ffffff22", borderTop: "3px solid #D9A404", borderRadius: 4, padding: 14, marginTop: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 8, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 11, color: "var(--gold)", fontWeight: 600, letterSpacing: 0.5 }}>RAPPORT DE DÉPISTAGE · {formatDay(report.day).toUpperCase()}</div>
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

// Volet « Gestion du joueur » : rappel, renvoi / ballottage, LTIR, contrat, rachat, réclamation,
// signature, repêchage. Les actions sont calculées par l'application selon le statut du joueur.
function ActionsPanel({ actions, known, onClose }) {
  if (!actions.length) return null;
  const run = (a) => { a.onClick(); if (a.close) onClose(); };
  return (
    <div style={{ background: "var(--navy)", border: "1px solid var(--line)", borderRadius: 8, padding: "10px 12px", margin: "12px 16px 0" }}>
      <div style={{ fontSize: 11, letterSpacing: 0.5, color: "var(--iceMuted)", marginBottom: 8 }}>GESTION DU JOUEUR</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {actions.map((a) => {
          if (a.status) return <div key={a.key} style={{ fontSize: 12, color: "#C9A6E8" }}>{a.status}</div>;
          const disabled = a.disabled || (a.requiresKnown && !known);
          const hint = a.requiresKnown && !known ? "Dépiste-le d'abord (onglet Dépistage) pour connaître sa valeur." : a.hint;
          return (
            <div key={a.key} style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              {a.confirmLabel && !disabled
                ? <ConfirmButton label={a.label} confirmLabel={a.confirmLabel} color={a.color} onConfirm={() => run(a)} />
                : <button onClick={() => !disabled && run(a)} disabled={disabled} style={{ ...btnStyle(a.color), fontSize: 12, opacity: disabled ? 0.45 : 1, cursor: disabled ? "not-allowed" : "pointer" }}>{a.label}</button>}
              {hint && <span style={{ fontSize: 11, color: "var(--iceMuted)", flex: "1 1 180px", lineHeight: 1.35 }}>{hint}</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function PlayerModal({ player, team, myTeam, lines, editable, seasonStats, playoffStats = {}, careerStats = {}, seasonYear, injuries = {}, staff, extraScouts = [], myTeamId, scoutKnowledge, pendingScouts, currentDay, onRequestScout, onCancelScout, onClose, onEdit, actions = [], minorLine = null }) {
  const [tab, setTab] = useState("profile");
  // Échap ferme le profil.
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  const owner = team || (player.draftProspect ? PROSPECT_TEAM : FREE_AGENT_TEAM);
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
            <div style={{ position: "relative" }}>
              <PlayerFace player={player} size={56} color={owner.color} />
              <span style={{ position: "absolute", right: -4, bottom: -2, background: "var(--navy)", border: "1px solid #ffffff55", borderRadius: 10, padding: "0 5px", fontFamily: "Oswald, sans-serif", fontWeight: 700, fontSize: 11, color: "#fff" }}>{player.number ?? player.pos}</span>
            </div>
            <div>
              <div style={{ fontFamily: "Oswald, sans-serif", fontWeight: 600, fontSize: 17, color: "#fff" }}>{player.name}<InjuryBadge injury={injuries[player.id]} day={currentDay} /></div>
              <div style={{ fontSize: 12, color: "#ffffffcc" }}>{NATION_FLAG[player.nationality] || "🏳️"} {owner.name} · {player.pos} · {player.age} ans</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer" }}><X size={18} /></button>
        </div>
        <ActionsPanel actions={actions} known={known || isMine} onClose={onClose} />
        <div style={{ display: "flex", borderBottom: "1px solid #ffffff1a", padding: "0 8px" }}>
          <button onClick={() => setTab("profile")} style={tabStyle(tab === "profile", owner.color)}>Profil</button>
          <button onClick={() => setTab("scouting")} style={tabStyle(tab === "scouting", owner.color)}>
            Dépistage{pending ? " · en cours" : scoutInfo.estOvr != null ? " · rapport" : ""}
          </button>
        </div>
        <div style={{ padding: 16 }}>
          {tab === "scouting" ? (
            <ScoutingTab player={player} report={scoutInfo} pending={pending} currentDay={currentDay} staff={staff} extraScouts={extraScouts} benchmark={benchmark} isMine={isMine} onRequestScout={onRequestScout} onCancelScout={onCancelScout} />
          ) : (<>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
            <InfoCard label="CÔTE ACTUELLE / POTENTIELLE" accent={known ? "var(--gold)" : "var(--steel)"}>
              {known ? (<><StarRating value={starsFor(shown.ovr, benchmark)} size={13} color={qColor} /><div style={{ marginTop: 4 }}><StarRating value={starsFor(shown.potential, benchmark)} size={13} color={qColor === "var(--gold)" ? "#6FA8DC" : "var(--iceMuted)"} /></div></>) : (<div style={{ fontSize: 13, color: "var(--iceMuted)" }}>Non dépisté</div>)}
            </InfoCard>
            <InfoCard label="SOUS CONTRAT" accent="var(--win)">
              <div style={{ fontSize: 13, fontWeight: 600 }}>{known ? contractLabel(player.contract) : "?"}</div>
            </InfoCard>
            <InfoCard label="RÔLE DANS L'ÉQUIPE" accent="var(--steel)">
              <div style={{ fontSize: 13, fontWeight: 600 }}>{role}</div>
              {known && player.pos !== "G" && (() => {
                const shownPlayer = { ...player, attrs: shown.attrs };
                const nat = naturalRole(shownPlayer);
                const asked = lines ? roleOf(lines, shownPlayer) : nat;
                return (
                  <div style={{ fontSize: 11, color: "var(--iceMuted)", marginTop: 4, lineHeight: 1.4 }}>
                    Archétype : <span style={{ color: "var(--gold)" }}>{ROLES[nat].label}</span>
                    {isMine && asked !== nat && <><br />Rôle demandé : {ROLES[asked].label} ({roleFit(shownPlayer, asked) >= 0.15 ? "adapté" : roleFit(shownPlayer, asked) > -0.15 ? "passable" : "à contre-emploi"})</>}
                  </div>
                );
              })()}
            </InfoCard>
            <InfoCard label="REPÊCHAGE">
              <div style={{ fontSize: 13, fontWeight: 600 }}>{known ? draftLabel(player) : "?"}</div>
            </InfoCard>
          </div>

          <InfoCard label="DÉPISTAGE">
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", fontSize: 12 }}>
              {scoutInfo.estOvr != null ? (
                <span><span style={{ color: qColor, fontWeight: 700 }}>Rapport du {formatDay(scoutInfo.day)}</span><span style={{ color: "var(--iceMuted)" }}> · {scoutInfo.scoutName} · {attr20(scoutInfo.quality)}/20</span></span>
              ) : known ? (
                <span><span style={{ color: qColor, fontWeight: 700 }}>Connu (personnel de l'équipe)</span><span style={{ color: "var(--iceMuted)" }}> · qualité {attr20(scoutInfo.quality)}/20</span></span>
              ) : (
                <span style={{ color: "var(--iceMuted)" }}>{pending ? `Dépistage en cours — rapport vers le ${formatDay(pending.dueDay)}.` : "Ce joueur n'a pas été dépisté par ton personnel."}</span>
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
          {(minorLine || (player.minorHistory || []).length > 0) && (() => {
            const g = player.pos === "G";
            const heads = g ? ["Saison", "Club", "Ligue", "PJ", "V", "D", "MOY", "%ARR", "BL"] : ["Saison", "Club", "Ligue", "PJ", "B", "A", "PTS", "+/-", "PUN"];
            const row = (l, season, current) => {
              const cells = g ? [l.gp, l.w, l.l, l.gaa.toFixed(2), l.svPct ? l.svPct.toFixed(3).replace(/^0/, "") : "—", l.so] : [l.gp, l.g, l.a, l.pts, l.pm > 0 ? `+${l.pm}` : l.pm, l.pim];
              return <tr key={`${season}-${l.league}`} style={{ color: current ? "var(--gold)" : "var(--ice)" }}>{[`${season}-${String(season + 1).slice(2)}`, l.club, MINOR_LEAGUES[l.league]?.short || l.league, ...cells].map((v, i) => <td key={i} style={{ padding: "3px 6px", whiteSpace: "nowrap" }}>{v}</td>)}</tr>;
            };
            return (
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, color: "var(--iceMuted)", marginBottom: 6, borderTop: "1px solid #ffffff1a", paddingTop: 10 }}>LIGUES MINEURES ET JUNIORS {minorLine && <>· {MINOR_LEAGUES[minorLine.league]?.name}</>}</div>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
                    <thead><tr style={{ color: "var(--iceMuted)", fontSize: 11 }}>{heads.map((h) => <th key={h} style={{ padding: "3px 6px", textAlign: "left", borderBottom: "1px solid #ffffff1a" }}>{h}</th>)}</tr></thead>
                    <tbody>
                      {(player.minorHistory || []).map((l) => row(l, l.season, false))}
                      {minorLine && row(minorLine, minorLine.year, true)}
                    </tbody>
                  </table>
                </div>
                <div style={{ fontSize: 10, color: "var(--iceMuted)", marginTop: 4 }}>Saison en cours en or (simulation rapide de la ligue, mise à jour avec le calendrier).</div>
              </div>
            );
          })()}
          {known && ((careerStats[player.id] || []).length > 0 || playoffStats[player.id]?.gp > 0) && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: "var(--iceMuted)", marginBottom: 6 }}>CARRIÈRE (S = saison régulière, SÉ = séries)</div>
              <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
                <thead><tr style={{ color: "var(--iceMuted)", fontSize: 11 }}>{["Saison", "", "Équipe", "PJ", "B", "A", "PTS", "+/-", "PUN"].map((h) => <th key={h} style={{ padding: "3px 6px", textAlign: "left", borderBottom: "1px solid #ffffff1a" }}>{h}</th>)}</tr></thead>
                <tbody>
                  {careerStats[player.id].map((c) => (
                    <tr key={`${c.season}-${c.playoffs ? "p" : "r"}`}>{[`${c.season}-${String(c.season + 1).slice(2)}`, c.playoffs ? "SÉ" : "S", c.team, c.gp, c.g, c.a, c.pts, c.plusMinus > 0 ? `+${c.plusMinus}` : c.plusMinus, c.pim].map((v, i) => <td key={i} style={{ padding: "3px 6px" }}>{v}</td>)}</tr>
                  ))}
                  {playoffStats[player.id]?.gp > 0 && (() => { const ps = playoffStats[player.id]; return <tr style={{ color: "var(--gold)" }}>{[`${seasonYear}-${String(seasonYear + 1).slice(2)}`, "SÉ", owner.name, ps.gp, ps.g, ps.a, ps.pts, ps.plusMinus > 0 ? `+${ps.plusMinus}` : ps.plusMinus, ps.pim].map((v, i) => <td key={i} style={{ padding: "3px 6px" }}>{v}</td>)}</tr>; })()}
                  {stat?.gp > 0 && <tr style={{ color: "var(--gold)" }}>{[`${seasonYear}-${String(seasonYear + 1).slice(2)}`, "S", owner.name, stat.gp, stat.g, stat.a, stat.pts, stat.plusMinus > 0 ? `+${stat.plusMinus}` : stat.plusMinus, stat.pim].map((v, i) => <td key={i} style={{ padding: "3px 6px" }}>{v}</td>)}</tr>}
                </tbody>
              </table>
            </div>
          )}
          <FacePicker player={player} />
          {editable && (
            <button onClick={() => onEdit(player)} style={{ ...btnStyle("var(--steel)"), width: "100%", justifyContent: "center" }}>Modifier ce joueur</button>
          )}
          </>)}
        </div>
      </div>
    </div>
  );
}
