import { h2Style, btnStyle } from "../ui/theme";
import { FRANCHISE_YEARS } from "../engine/calendar";

const section = { background: "var(--navy2)", border: "1px solid #ffffff1a", borderRadius: 6, padding: 16, marginBottom: 16 };

// Bilan affiché une fois (voir App.jsx startNewSeason) à la fin de la saison qui porte le
// compteur de la franchise à FRANCHISE_YEARS (30 par défaut) — palmarès saison par saison et
// Temple de la renommée (meilleurs pointeurs parmi les joueurs retraités). Ne bloque rien :
// "Continuer la dynastie" referme l'écran, la saison suivante est déjà en cours.
export function FranchiseSummaryPanel({ teamName, history, retiredPlayers, careerStats, onContinue, onNewGame }) {
  const chronological = [...history].reverse();
  const championships = history.filter((h) => h.champion === teamName).length;
  const presidents = history.filter((h) => h.presidents === teamName).length;

  const hallOfFame = retiredPlayers
    .map((p) => {
      const lines = (careerStats[p.id] || []).filter((l) => !l.playoffs);
      const seasons = lines.length;
      const totals = lines.reduce((a, l) => ({ gp: a.gp + l.gp, g: a.g + l.g, a: a.a + l.a, pts: a.pts + l.pts }), { gp: 0, g: 0, a: 0, pts: 0 });
      return { ...p, seasons, ...totals };
    })
    .filter((p) => p.pts > 0)
    .sort((a, b) => b.pts - a.pts)
    .slice(0, 15);

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <h2 style={h2Style}>Bilan de franchise — {FRANCHISE_YEARS} saisons avec les {teamName}</h2>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
        <div style={{ ...section, flex: "1 1 180px", textAlign: "center" }}>
          <div style={{ fontSize: 32, fontFamily: "Oswald, sans-serif", fontWeight: 700, color: "var(--gold)" }}>{championships}</div>
          <div style={{ fontSize: 12, color: "var(--iceMuted)" }}>Coupe{championships > 1 ? "s" : ""} remportée{championships > 1 ? "s" : ""}</div>
        </div>
        <div style={{ ...section, flex: "1 1 180px", textAlign: "center" }}>
          <div style={{ fontSize: 32, fontFamily: "Oswald, sans-serif", fontWeight: 700 }}>{presidents}</div>
          <div style={{ fontSize: 12, color: "var(--iceMuted)" }}>Trophée{presidents > 1 ? "s" : ""} du Président</div>
        </div>
        <div style={{ ...section, flex: "1 1 180px", textAlign: "center" }}>
          <div style={{ fontSize: 32, fontFamily: "Oswald, sans-serif", fontWeight: 700 }}>{retiredPlayers.length}</div>
          <div style={{ fontSize: 12, color: "var(--iceMuted)" }}>Joueurs retraités</div>
        </div>
      </div>

      <div style={section}>
        <div style={{ fontFamily: "Oswald, sans-serif", fontSize: 16, marginBottom: 10 }}>Palmarès, saison par saison</div>
        <div style={{ maxHeight: 280, overflow: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead><tr style={{ color: "var(--iceMuted)", textAlign: "left" }}>
              <th style={{ padding: "4px 8px" }}>Saison</th><th style={{ padding: "4px 8px" }}>Ton équipe</th><th style={{ padding: "4px 8px" }}>Champion</th><th style={{ padding: "4px 8px" }}>Trophée du Président</th><th style={{ padding: "4px 8px" }}>Meilleur pointeur</th>
            </tr></thead>
            <tbody>
              {chronological.map((h) => (
                <tr key={h.year} style={{ borderTop: "1px solid #ffffff11", background: h.champion === teamName ? "#d4af3722" : "transparent" }}>
                  <td style={{ padding: "4px 8px" }}>{h.year}-{h.year + 1}</td>
                  <td style={{ padding: "4px 8px" }}>{h.myRecord}</td>
                  <td style={{ padding: "4px 8px" }}>{h.champion}{h.champion === teamName ? " 🏆" : ""}</td>
                  <td style={{ padding: "4px 8px" }}>{h.presidents}</td>
                  <td style={{ padding: "4px 8px" }}>{h.topScorer}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={section}>
        <div style={{ fontFamily: "Oswald, sans-serif", fontSize: 16, marginBottom: 10 }}>Temple de la renommée (meilleurs pointeurs retraités)</div>
        {hallOfFame.length === 0 && <div style={{ fontSize: 12, color: "var(--iceMuted)" }}>Aucun joueur retraité avec une carrière LNH enregistrée.</div>}
        {hallOfFame.length > 0 && (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead><tr style={{ color: "var(--iceMuted)", textAlign: "left" }}>
              <th style={{ padding: "4px 8px" }}>#</th><th style={{ padding: "4px 8px" }}>Joueur</th><th style={{ padding: "4px 8px" }}>Pos</th><th style={{ padding: "4px 8px" }}>Saisons</th><th style={{ padding: "4px 8px" }}>PJ</th><th style={{ padding: "4px 8px" }}>B</th><th style={{ padding: "4px 8px" }}>A</th><th style={{ padding: "4px 8px" }}>PTS</th><th style={{ padding: "4px 8px" }}>Retraite</th>
            </tr></thead>
            <tbody>
              {hallOfFame.map((p, i) => (
                <tr key={p.id} style={{ borderTop: "1px solid #ffffff11" }}>
                  <td style={{ padding: "4px 8px" }}>{i + 1}</td>
                  <td style={{ padding: "4px 8px" }}>{p.name}</td>
                  <td style={{ padding: "4px 8px" }}>{p.pos}</td>
                  <td style={{ padding: "4px 8px" }}>{p.seasons}</td>
                  <td style={{ padding: "4px 8px" }}>{p.gp}</td>
                  <td style={{ padding: "4px 8px" }}>{p.g}</td>
                  <td style={{ padding: "4px 8px" }}>{p.a}</td>
                  <td style={{ padding: "4px 8px", fontWeight: 700 }}>{p.pts}</td>
                  <td style={{ padding: "4px 8px" }}>{p.retiredYear}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 8 }}>
        <button onClick={onContinue} style={btnStyle("var(--win)")}>Continuer la dynastie</button>
        <button onClick={onNewGame} style={btnStyle("var(--steel)")}>Nouvelle partie</button>
      </div>
    </div>
  );
}
