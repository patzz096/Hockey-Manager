import { useState } from "react";
import { ArrowUp, ArrowDown, X, GripVertical } from "lucide-react";
import { SCOUT_REGIONS, MINOR_LEAGUES } from "../engine/minorLeagues";
import { GRADES, DURATIONS, POSITION_FOCUS, coverageGain, reportsPerWeek, regionLabel, effectiveScout, missionWeeklyCost, missionTotalCost, missionSummary, distanceLabel } from "../engine/scoutingZones";
import { ROLES } from "../engine/roles";
import { getScoutInfo, perceivedRatings } from "../engine/scouting";
import { teamOvrBenchmark, starsFor, attr20 } from "../engine/attributes";
import { formatDay } from "../engine/calendar";
import { h2Style, btnStyle } from "../ui/theme";
import { StarRating, TeamCrest, ConfirmButton } from "./common";

// ---------------------------------------------------------------------------------------
// Centre de dépistage, à la FM24 : zones à couvrir (déploiement des dépisteurs et couverture),
// rapports et suggestions, cuvée du repêchage (avec statistiques des ligues mineures) et ta
// liste de repêchage ordonnée. Chaque joueur s'ouvre sur son profil (ajout à la liste, etc.).
// ---------------------------------------------------------------------------------------

const POS_FR = { C: "C", LW: "AG", RW: "AD", LD: "DG", RD: "DD", G: "G" };
const card = { background: "var(--navy2)", border: "1px solid var(--line)", borderRadius: 10, padding: 14 };
const th = { textAlign: "left", padding: "6px 8px", fontSize: 10, letterSpacing: 0.4, color: "var(--iceMuted)", fontWeight: 600, borderBottom: "1px solid var(--line)", whiteSpace: "nowrap" };
const td = { padding: "5px 8px", fontSize: 12, borderBottom: "1px solid #ffffff0d", whiteSpace: "nowrap" };
const selStyle = { background: "var(--navy)", color: "var(--ice)", border: "1px solid var(--line)", borderRadius: 6, padding: "6px 8px", fontSize: 12, fontFamily: "inherit" };

function GradeBadge({ grade }) {
  const g = GRADES[grade];
  return <span title={g.label} style={{ display: "inline-block", minWidth: 20, textAlign: "center", fontWeight: 800, fontSize: 12, color: "#0A1627", background: g.color, borderRadius: 4, padding: "1px 6px" }}>{grade}</span>;
}
function CoverageBar({ value }) {
  const color = value >= 70 ? "var(--win)" : value >= 35 ? "var(--gold)" : "var(--loss)";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ flex: 1, height: 7, borderRadius: 4, background: "#ffffff14", overflow: "hidden" }}><div style={{ width: `${value}%`, height: "100%", background: color }} /></div>
      <strong style={{ fontSize: 12, color, width: 38, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{Math.round(value)} %</strong>
    </div>
  );
}
// Étoiles estimées (rapport) ou « ? » si le joueur n'a pas été dépisté.
function Estimate({ player, info, benchmark }) {
  if (!info.known) return <span style={{ color: "var(--iceMuted)", fontSize: 11 }}>Non dépisté</span>;
  const r = perceivedRatings(player, info);
  return <span style={{ display: "inline-flex", gap: 6 }}><StarRating value={starsFor(r.ovr, benchmark)} size={10} /><StarRating value={starsFor(r.potential, benchmark)} size={10} color="#7A9EDB" /></span>;
}

// ------------------------------------ Zones ------------------------------------
function ZonesView({ scouts, missions, coverage, draftClass }) {
  const perRegion = (r) => draftClass.filter((p) => r.leagues.includes(p.league)).length;
  const groups = [["Amérique du Nord", ["quebec", "ontario", "west", "usa"]], ["Europe", ["sweden", "finland", "russia", "central"]], ["Professionnels", ["pro"]]];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <p style={{ fontSize: 12, color: "var(--iceMuted)", margin: 0 }}>Couverture de chaque zone : elle monte chaque semaine où un dépisteur y est en mission et s'érode lentement sinon. Une zone bien couverte fait ressortir les meilleurs joueurs. Les missions se gèrent dans « Équipe et missions ».</p>
      {groups.map(([title, ids]) => (
        <section key={title}>
          <div style={{ fontSize: 11, letterSpacing: 0.5, color: "var(--iceMuted)", margin: "4px 0 6px" }}>{title.toUpperCase()}</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: 10 }}>
            {ids.map((id) => {
              const r = SCOUT_REGIONS.find((x) => x.id === id);
              const who = scouts.filter((sc) => missions[sc.id]?.region === id);
              return (
                <div key={id} style={{ ...card, padding: 12, borderColor: who.length ? "var(--accent)" : "var(--line)", boxShadow: who.length ? "0 0 0 1px var(--accent)" : "none" }}>
                  <strong style={{ fontSize: 13, display: "block", marginBottom: 6 }}>{r.label}</strong>
                  <CoverageBar value={coverage[id] ?? 0} />
                  <div style={{ fontSize: 11, color: "var(--iceMuted)", marginTop: 6 }}>
                    {r.leagues.map((l) => (l === "NHL" ? "LNH" : MINOR_LEAGUES[l].short)).join(" · ")}
                    {id !== "pro" && <> · {perRegion(r)} espoirs de la cuvée</>}
                  </div>
                  {who.length > 0 && <div style={{ fontSize: 11, color: "var(--accent)", marginTop: 6 }}>En mission : {who.map((sc) => sc.name).join(", ")}</div>}
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

// ------------------------------- Équipe et missions -------------------------------
const money = (v) => `${Math.round(v).toLocaleString("fr-CA")} $`;
const SPEC = { junior: "Amateur (juniors, NCAA, Europe)", pro: "Professionnel (LNH, LAH)" };

function defaultMission(scout) {
  const region = scout.specialty === "pro" ? "pro" : scout.home === "pro" ? "quebec" : scout.home;
  return { region, league: null, focus: "general", focusValue: null, target: region === "pro" ? "all" : "draft", weeks: 4 };
}

function MissionEditor({ scout, mission, onSetMission, onFire }) {
  const active = !!mission?.region;
  const [m, setM] = useState(() => (active ? { ...mission } : defaultMission(scout)));
  const set = (patch) => setM((prev) => ({ ...prev, ...patch }));
  const region = SCOUT_REGIONS.find((r) => r.id === m.region);
  const eff = effectiveScout(scout, m.region);
  const weekly = missionWeeklyCost(scout, m), total = missionTotalCost(scout, m);
  const field = { display: "flex", flexDirection: "column", gap: 3, fontSize: 11, color: "var(--iceMuted)" };
  return (
    <div style={{ ...card, borderColor: active ? "var(--accent)" : "var(--line)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
        <div>
          <div style={{ fontSize: 11, color: "var(--iceMuted)", letterSpacing: 0.4 }}>{(scout.head || "Dépisteur en renfort").toUpperCase()}</div>
          <div style={{ fontSize: 15, fontWeight: 700 }}>{scout.name} <span style={{ color: "var(--gold)" }}>{attr20(scout.rating)}/20</span></div>
          <div style={{ fontSize: 11, color: "var(--iceMuted)" }}>{SPEC[scout.specialty]} · port d'attache : {regionLabel(scout.home)}{scout.salary ? ` · ${scout.salary.toLocaleString("fr-CA")} k$/an` : ""}</div>
        </div>
        <div style={{ textAlign: "right", fontSize: 12 }}>
          {active ? <>
            <div style={{ color: "var(--accent)", fontWeight: 700 }}>En mission</div>
            <div style={{ color: "var(--iceMuted)" }}>{mission.weeks ? `semaine ${Math.min(mission.weeksDone + 1, mission.weeks)} sur ${mission.weeks}` : `continue · ${mission.weeksDone} semaine${mission.weeksDone > 1 ? "s" : ""}`}</div>
          </> : <div style={{ color: "var(--iceMuted)" }}>En réserve</div>}
        </div>
      </div>
      {active && <div style={{ fontSize: 12, marginBottom: 10, color: "var(--ice)" }}>{missionSummary(mission)} · {money(missionWeeklyCost(scout, mission))} par semaine</div>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 8 }}>
        <label style={field}>Zone
          <select value={m.region} onChange={(e) => set({ region: e.target.value, league: null, target: e.target.value === "pro" ? "all" : m.target })} style={selStyle}>
            {SCOUT_REGIONS.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
          </select>
        </label>
        <label style={field}>Étendue
          <select value={m.league || ""} onChange={(e) => set({ league: e.target.value || null })} style={selStyle}>
            <option value="">Toute la zone</option>
            {region.leagues.map((l) => <option key={l} value={l}>Seulement : {l === "NHL" ? "LNH" : MINOR_LEAGUES[l].short}</option>)}
          </select>
        </label>
        <label style={field}>Recherche
          <select value={m.focus} onChange={(e) => set({ focus: e.target.value, focusValue: e.target.value === "pos" ? "F" : e.target.value === "role" ? "sniper" : null })} style={selStyle}>
            <option value="general">Générale (meilleurs joueurs)</option><option value="pos">Par position</option><option value="role">Par rôle</option>
          </select>
        </label>
        {m.focus === "pos" && <label style={field}>Position
          <select value={m.focusValue} onChange={(e) => set({ focusValue: e.target.value })} style={selStyle}>{POSITION_FOCUS.map((x) => <option key={x.id} value={x.id}>{x.label}</option>)}</select>
        </label>}
        {m.focus === "role" && <label style={field}>Rôle recherché
          <select value={m.focusValue} onChange={(e) => set({ focusValue: e.target.value })} style={selStyle}>
            {["F", "D", "G"].map((g) => <optgroup key={g} label={g === "F" ? "Attaquants" : g === "D" ? "Défenseurs" : "Gardiens"}>{Object.entries(ROLES).filter(([, r]) => r.group === g).map(([id, r]) => <option key={id} value={id}>{r.label}</option>)}</optgroup>)}
          </select>
        </label>}
        <label style={field}>Cible
          <select value={m.target} onChange={(e) => set({ target: e.target.value })} disabled={m.region === "pro"} style={selStyle}>
            <option value="draft">Cuvée du repêchage</option><option value="all">Tous les joueurs</option>
          </select>
        </label>
        <label style={field}>Durée
          <select value={m.weeks ?? ""} onChange={(e) => set({ weeks: e.target.value ? Number(e.target.value) : null })} style={selStyle}>
            {DURATIONS.map((d) => <option key={d.label} value={d.weeks ?? ""}>{d.label}</option>)}
          </select>
        </label>
      </div>

      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", fontSize: 12, margin: "10px 0", padding: "8px 10px", background: "var(--navy)", borderRadius: 8 }}>
        <span>Frais : <strong style={{ color: "var(--gold)" }}>{money(weekly)}</strong> / semaine</span>
        <span>Total : <strong style={{ color: "var(--gold)" }}>{total != null ? money(total) : "selon la durée"}</strong></span>
        <span style={{ color: "var(--iceMuted)" }}>Distance : {distanceLabel(scout.home, m.region)}{m.league ? " · une ligue (frais × 0,6, couverture × 1,3)" : ""}</span>
        <span style={{ color: "var(--iceMuted)" }}>+{Math.round(coverageGain(eff.rating, m))} % de couverture et {reportsPerWeek(eff.rating)} rapport{reportsPerWeek(eff.rating) > 1 ? "s" : ""} par semaine</span>
        {eff.offSpecialty && <span style={{ color: "#F59A4A" }}>Hors de sa spécialité : -15 %</span>}
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button onClick={() => onSetMission(scout.id, m)} style={{ ...btnStyle("var(--win)"), fontSize: 12 }}>{active ? "Modifier la mission" : "Lancer la mission"}</button>
        {active && <button onClick={() => onSetMission(scout.id, null)} style={{ ...btnStyle("var(--steel)"), fontSize: 12 }}>Rappeler le dépisteur</button>}
        {!scout.head && <ConfirmButton label="Congédier" confirmLabel="Confirmer le congédiement" color="var(--loss)" onConfirm={() => onFire(scout.id)} />}
      </div>
    </div>
  );
}

function TeamView({ scouts, missions, onSetMission, market, onHire, onFire, onRefreshMarket, spend, cash, maxExtra }) {
  const extra = scouts.filter((sc) => !sc.head).length;
  const weekly = scouts.reduce((a, sc) => a + missionWeeklyCost(sc, missions[sc.id]), 0);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", fontSize: 12 }}>
        {[["Dépisteurs", `${scouts.length} (${extra}/${maxExtra} en renfort)`], ["En mission", scouts.filter((sc) => missions[sc.id]?.region).length], ["Frais actuels", `${money(weekly)} / sem.`], ["Frais de la saison", money(spend)], ["Caisse", money(cash)]].map(([k, v]) => (
          <span key={k} style={{ background: "var(--navy2)", border: "1px solid var(--line)", borderRadius: 8, padding: "5px 10px" }}><span style={{ color: "var(--iceMuted)" }}>{k} </span><strong>{v}</strong></span>
        ))}
      </div>
      <p style={{ fontSize: 12, color: "var(--iceMuted)", margin: 0 }}>Une mission : une zone (ou une seule de ses ligues), une recherche générale, par position ou par rôle, une cible et une durée. Les frais dépendent de l'étendue, de la distance entre le port d'attache du dépisteur et la zone, et de son niveau ; ils sont prélevés chaque semaine. Le salaire des dépisteurs en renfort s'ajoute aux dépenses du personnel.</p>
      {scouts.map((sc) => <MissionEditor key={`${sc.id}-${JSON.stringify(missions[sc.id] || null)}`} scout={sc} mission={missions[sc.id]} onSetMission={onSetMission} onFire={onFire} />)}
      <section style={card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
          <div style={{ fontFamily: "Oswald, sans-serif", fontSize: 16 }}>Dépisteurs disponibles</div>
          <button onClick={onRefreshMarket} style={{ ...btnStyle("var(--steel)"), fontSize: 12 }}>Rafraîchir le marché</button>
        </div>
        {market.length === 0 ? <div style={{ fontSize: 12, color: "var(--iceMuted)" }}>Aucun dépisteur disponible.</div> : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 620 }}>
              <thead><tr>{["Nom", "Cote", "Spécialité", "Port d'attache", "Salaire", ""].map((h) => <th key={h} style={th}>{h}</th>)}</tr></thead>
              <tbody>{market.map((c) => (
                <tr key={c.id}>
                  <td style={{ ...td, fontWeight: 600 }}>{c.name}</td>
                  <td style={{ ...td, color: "var(--gold)", fontWeight: 700 }}>{attr20(c.rating)}/20</td>
                  <td style={td}>{SPEC[c.specialty]}</td>
                  <td style={td}>{regionLabel(c.home)}</td>
                  <td style={td}>{c.salary.toLocaleString("fr-CA")} k$/an</td>
                  <td style={td}><button onClick={() => onHire(c)} disabled={extra >= maxExtra} style={{ ...btnStyle("var(--win)"), fontSize: 11, padding: "3px 10px", opacity: extra >= maxExtra ? 0.5 : 1 }}>Engager</button></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

// ------------------------------------ Rapports ------------------------------------
function ReportsView({ suggestions, findPlayerView, onOpenPlayerById, teamsById, benchmark }) {
  const [grade, setGrade] = useState("AB");
  const [kind, setKind] = useState("all");
  const rows = suggestions.filter((s) => grade.includes(s.grade) && (kind === "all" || (kind === "draft") === s.draftProspect));
  return (
    <div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
        <select aria-label="Notes" value={grade} onChange={(e) => setGrade(e.target.value)} style={selStyle}>
          <option value="AB">A et B (recommandés)</option><option value="A">A seulement</option><option value="ABC">A, B et C</option>
        </select>
        <select aria-label="Type" value={kind} onChange={(e) => setKind(e.target.value)} style={selStyle}>
          <option value="all">Espoirs et professionnels</option><option value="draft">Espoirs du repêchage</option><option value="pro">Professionnels et agents libres</option>
        </select>
      </div>
      {rows.length === 0 ? <div style={{ ...card, fontSize: 13, color: "var(--iceMuted)" }}>Aucune suggestion pour l'instant. Déploie tes dépisteurs dans des zones (onglet « Zones à couvrir ») : leurs rapports arrivent chaque semaine.</div> : (
        <div style={{ overflowX: "auto", ...card, padding: 0 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 820 }}>
            <thead><tr>{["Note", "Joueur", "Pos", "Âge", "Équipe / ligue", "Estimation", "Dépisteur", "Date", "Avis"].map((h) => <th key={h} style={th}>{h}</th>)}</tr></thead>
            <tbody>{rows.map((s) => {
              const v = findPlayerView(s.playerId);
              return (
                <tr key={s.id} onClick={() => onOpenPlayerById(s.playerId)} style={{ cursor: "pointer" }}>
                  <td style={td}><GradeBadge grade={s.grade} /></td>
                  <td style={{ ...td, fontWeight: 600 }}>{s.playerName}</td>
                  <td style={td}>{POS_FR[s.pos]}</td>
                  <td style={td}>{s.age}</td>
                  <td style={td}>{s.ownerTeamId ? <span style={{ display: "inline-flex", gap: 6, alignItems: "center" }}><TeamCrest team={teamsById[s.ownerTeamId]} size={16} />{teamsById[s.ownerTeamId].name}</span> : v?.player?.league ? `${v.player.club} (${MINOR_LEAGUES[v.player.league].short})` : "Agent libre"}</td>
                  <td style={td}>{v ? <Estimate player={v.player} info={v.info} benchmark={benchmark} /> : "—"}</td>
                  <td style={{ ...td, color: "var(--iceMuted)" }}>{s.scoutName}</td>
                  <td style={{ ...td, color: "var(--iceMuted)" }}>{formatDay(s.day)}</td>
                  <td style={{ ...td, whiteSpace: "normal", minWidth: 260, fontSize: 11, color: "var(--iceMuted)" }}>{s.note}</td>
                </tr>
              );
            })}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ------------------------------------ Cuvée ------------------------------------
function ClassView({ draftClass, classYear, info, benchmark, minorLine, draftIds, onSelectPlayer }) {
  const [region, setRegion] = useState("all");
  const [pos, setPos] = useState("all");
  const [onlyKnown, setOnlyKnown] = useState(false);
  const [sort, setSort] = useState("pts");
  const rows = draftClass
    .filter((p) => (region === "all" || SCOUT_REGIONS.find((r) => r.id === region).leagues.includes(p.league)) && (pos === "all" || p.pos === pos) && (!onlyKnown || info(p).known))
    .map((p) => ({ p, line: minorLine(p), inf: info(p) }))
    .sort((a, b) => {
      if (sort === "est") return (b.inf.known ? perceivedRatings(b.p, b.inf).potential : 0) - (a.inf.known ? perceivedRatings(a.p, a.inf).potential : 0);
      if (sort === "ppg") return (b.line?.gp ? (b.line.pts ?? 0) / b.line.gp : 0) - (a.line?.gp ? (a.line.pts ?? 0) / a.line.gp : 0);
      return (b.line?.pts ?? b.line?.w ?? 0) - (a.line?.pts ?? a.line?.w ?? 0);
    });
  return (
    <div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 10 }}>
        <select aria-label="Zone" value={region} onChange={(e) => setRegion(e.target.value)} style={selStyle}>
          <option value="all">Toutes les zones</option>
          {SCOUT_REGIONS.filter((r) => r.id !== "pro").map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
        </select>
        <select aria-label="Position" value={pos} onChange={(e) => setPos(e.target.value)} style={selStyle}>
          <option value="all">Toutes les positions</option>
          {Object.entries(POS_FR).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select aria-label="Tri" value={sort} onChange={(e) => setSort(e.target.value)} style={selStyle}>
          <option value="pts">Tri : points (victoires pour les gardiens)</option><option value="ppg">Tri : points par match</option><option value="est">Tri : potentiel estimé</option>
        </select>
        <label style={{ fontSize: 12, display: "inline-flex", gap: 6, alignItems: "center" }}><input type="checkbox" checked={onlyKnown} onChange={(e) => setOnlyKnown(e.target.checked)} /> Dépistés seulement</label>
        <span style={{ fontSize: 11, color: "var(--iceMuted)" }}>{rows.length} espoirs · repêchage {classYear + 1}</span>
      </div>
      <div style={{ overflowX: "auto", ...card, padding: 0 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 860 }}>
          <thead><tr>{["Liste", "Espoir", "Pos", "Âge", "Club", "Ligue", "PJ", "B / V", "A / MOY", "PTS / %ARR", "Estimation (act. / pot.)"].map((h) => <th key={h} style={th}>{h}</th>)}</tr></thead>
          <tbody>{rows.slice(0, 150).map(({ p, line, inf }) => {
            const n = draftIds.indexOf(p.id);
            const g = p.pos === "G";
            return (
              <tr key={p.id} onClick={() => onSelectPlayer(p, null)} style={{ cursor: "pointer" }}>
                <td style={{ ...td, color: "var(--gold)", fontWeight: 700 }}>{n >= 0 ? `n° ${n + 1}` : ""}</td>
                <td style={{ ...td, fontWeight: 600 }}>{p.name}</td>
                <td style={td}>{POS_FR[p.pos]}</td>
                <td style={td}>{p.age}</td>
                <td style={{ ...td, color: "var(--iceMuted)" }}>{p.club}</td>
                <td style={td}>{MINOR_LEAGUES[p.league].short}</td>
                <td style={td}>{line?.gp ?? 0}</td>
                <td style={td}>{g ? line?.w ?? 0 : line?.g ?? 0}</td>
                <td style={td}>{g ? (line?.gaa ?? 0).toFixed(2) : line?.a ?? 0}</td>
                <td style={{ ...td, fontWeight: 700 }}>{g ? (line?.svPct ? line.svPct.toFixed(3).replace(/^0/, "") : "—") : line?.pts ?? 0}</td>
                <td style={td}><Estimate player={p} info={inf} benchmark={benchmark} /></td>
              </tr>
            );
          })}</tbody>
        </table>
      </div>
      <p style={{ fontSize: 11, color: "var(--iceMuted)" }}>Les statistiques des ligues mineures sont publiques ; l'estimation d'habileté et de potentiel demande un rapport de dépistage. Clique un espoir pour son profil : « Ajouter à ma liste de repêchage » ou demander un dépistage.</p>
    </div>
  );
}

// ------------------------------------ Ma liste ------------------------------------
function ListView({ draftIds, byId, info, benchmark, minorLine, onReorder, onRemove, onSelectPlayer, draft, teamsById }) {
  const [dragIdx, setDragIdx] = useState(null);
  const move = (from, to) => { if (to < 0 || to >= draftIds.length) return; const ids = [...draftIds]; const [x] = ids.splice(from, 1); ids.splice(to, 0, x); onReorder(ids); };
  const pickedBy = (id) => draft?.picks.find((k) => k.playerId === id);
  if (!draftIds.length) return <div style={{ ...card, fontSize: 13, color: "var(--iceMuted)" }}>Ta liste est vide. Ouvre le profil d'un espoir (cuvée ou suggestions) et choisis « Ajouter à ma liste de repêchage ». Le jour du repêchage, tes choix automatiques suivent cette liste, dans l'ordre.</div>;
  const icon = { background: "none", border: "1px solid var(--line)", borderRadius: 5, color: "var(--iceMuted)", cursor: "pointer", padding: 3, display: "inline-flex" };
  return (
    <div style={{ ...card, padding: 6 }}>
      {draftIds.map((id, i) => {
        const p = byId(id);
        const taken = pickedBy(id);
        const line = p && minorLine(p);
        return (
          <div key={id} draggable onDragStart={() => setDragIdx(i)} onDragOver={(e) => e.preventDefault()} onDrop={() => { if (dragIdx != null) move(dragIdx, i); setDragIdx(null); }}
            style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 8px", borderBottom: "1px solid #ffffff0d", opacity: taken ? 0.5 : 1, background: dragIdx === i ? "rgba(92,200,255,0.08)" : "transparent" }}>
            <GripVertical size={14} color="var(--iceMuted)" style={{ cursor: "grab", flexShrink: 0 }} />
            <strong style={{ width: 28, color: "var(--gold)", fontSize: 13 }}>{i + 1}</strong>
            {p ? (
              <button onClick={() => onSelectPlayer(p, null)} style={{ flex: 1, minWidth: 0, background: "none", border: "none", textAlign: "left", color: "var(--ice)", cursor: "pointer", fontFamily: "inherit", padding: 0, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                <span style={{ fontWeight: 600, fontSize: 13, textDecoration: taken ? "line-through" : "none" }}>{p.name}</span>
                <span style={{ fontSize: 11, color: "var(--iceMuted)" }}>{POS_FR[p.pos]} · {p.age} ans · {p.club} ({MINOR_LEAGUES[p.league]?.short})</span>
                {line && p.pos !== "G" && <span style={{ fontSize: 11, color: "var(--iceMuted)" }}>{line.gp} PJ · {line.pts} PTS</span>}
                <Estimate player={p} info={info(p)} benchmark={benchmark} />
                {taken && <span style={{ fontSize: 11, color: "var(--loss)" }}>Repêché par {teamsById[taken.teamId]?.name} (n° {taken.overall})</span>}
              </button>
            ) : <span style={{ flex: 1, color: "var(--iceMuted)" }}>Joueur indisponible</span>}
            <button title="Monter" aria-label="Monter" onClick={() => move(i, i - 1)} style={icon}><ArrowUp size={13} /></button>
            <button title="Descendre" aria-label="Descendre" onClick={() => move(i, i + 1)} style={icon}><ArrowDown size={13} /></button>
            <button title="Retirer de la liste" aria-label="Retirer" onClick={() => onRemove(id)} style={icon}><X size={13} /></button>
          </div>
        );
      })}
    </div>
  );
}

const VIEWS = [["team", "Équipe et missions"], ["zones", "Zones à couvrir"], ["reports", "Rapports et suggestions"], ["class", "Cuvée du repêchage"], ["list", "Ma liste de repêchage"]];

export function ScoutingCenter({ scouts, missions, coverage, onSetMission, market, onHire, onFire, onRefreshMarket, spend, cash, maxExtra, staff, suggestions, draftClass, classYear, myTeam, myTeamId, scoutKnowledge, pendingScouts, teamsById, draftIds, onReorder, onRemoveFromList, draft, minorLine, onSelectPlayer, onOpenPlayerById }) {
  const [view, setView] = useState("team");
  const benchmark = teamOvrBenchmark(myTeam);
  const info = (p, owner = null) => getScoutInfo(p, owner, myTeamId, staff, scoutKnowledge);
  const classById = new Map([...draftClass, ...(draft?.pool || [])].map((p) => [p.id, p]));
  const findPlayerView = (id) => {
    const p = classById.get(id) || Object.values(teamsById).flatMap((t) => t.roster).find((x) => x.id === id);
    return p ? { player: p, info: info(p) } : null;
  };
  const newCount = suggestions.filter((s) => s.grade !== "C").length;
  const segBtn = (active) => ({ padding: "7px 13px", borderRadius: 8, border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 12, fontWeight: active ? 700 : 500, color: active ? "#0A1627" : "var(--ice)", background: active ? "var(--accent)" : "transparent" });
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
        <h2 style={{ ...h2Style, marginBottom: 0 }}>Centre de dépistage</h2>
        <span style={{ fontSize: 12, color: "var(--iceMuted)" }}>{pendingScouts.length} mission{pendingScouts.length > 1 ? "s" : ""} individuelle{pendingScouts.length > 1 ? "s" : ""} en cours · {draftIds.length} espoir{draftIds.length > 1 ? "s" : ""} dans ta liste</span>
      </div>
      <div role="tablist" aria-label="Dépistage" style={{ display: "inline-flex", flexWrap: "wrap", background: "var(--navy)", border: "1px solid var(--line)", borderRadius: 10, padding: 3, marginBottom: 14 }}>
        {VIEWS.map(([k, label]) => (
          <button key={k} role="tab" aria-selected={view === k} onClick={() => setView(k)} style={segBtn(view === k)}>
            {label}{k === "reports" && newCount > 0 ? ` (${newCount})` : ""}{k === "list" && draftIds.length ? ` (${draftIds.length})` : ""}
          </button>
        ))}
      </div>
      {view === "team" && <TeamView scouts={scouts} missions={missions} onSetMission={onSetMission} market={market} onHire={onHire} onFire={onFire} onRefreshMarket={onRefreshMarket} spend={spend} cash={cash} maxExtra={maxExtra} />}
      {view === "zones" && <ZonesView scouts={scouts} missions={missions} coverage={coverage} draftClass={draftClass} />}
      {view === "reports" && <ReportsView suggestions={suggestions} findPlayerView={findPlayerView} onOpenPlayerById={onOpenPlayerById} teamsById={teamsById} benchmark={benchmark} />}
      {view === "class" && <ClassView draftClass={draftClass} classYear={classYear} info={info} benchmark={benchmark} minorLine={minorLine} draftIds={draftIds} onSelectPlayer={onSelectPlayer} />}
      {view === "list" && <ListView draftIds={draftIds} byId={(id) => classById.get(id)} info={info} benchmark={benchmark} minorLine={minorLine} onReorder={onReorder} onRemove={onRemoveFromList} onSelectPlayer={onSelectPlayer} draft={draft} teamsById={teamsById} />}
    </div>
  );
}
