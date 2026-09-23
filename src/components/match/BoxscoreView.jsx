import { formatTOI } from "../../ui/format";
import { GoalSummary } from "./GoalSummary";

export function StatLines({ title, box, team, lines, onSelectPlayer }) {
  const ids = new Set([...Object.keys(box.goalsBy), ...Object.keys(box.assistsBy), ...Object.keys(box.hitsBy), ...Object.keys(box.pimBy || {}), ...Object.keys(box.shotsBy || {}), ...Object.keys(box.toiBy || {})]);
  const rows = [...ids].map((id) => { const player = team.roster.find((p) => p.id === id); return { player, g: box.goalsBy[id] || 0, a: box.assistsBy[id] || 0, h: box.hitsBy[id] || 0, pim: (box.pimBy || {})[id] || 0, s: (box.shotsBy || {})[id] || 0, pm: (box.plusMinusBy || {})[id] || 0, toi: (box.toiBy || {})[id] }; }).filter((r) => r.player && r.player.pos !== "G").sort((x, y) => (box.toiBy?.[y.player.id] || 0) - (box.toiBy?.[x.player.id] || 0));
  return (
    <div style={{ flex: 1, minWidth: 280 }}>
      <div style={{ fontFamily: "Oswald, sans-serif", fontWeight: 600, fontSize: 14, color: team.color, marginBottom: 8 }}>{title}</div>
      {rows.length === 0 && <div style={{ fontSize: 12, color: "var(--iceMuted)" }}>Aucune statistique notable.</div>}
      <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
        <thead><tr style={{ color: "var(--iceMuted)", fontSize: 11 }}><th style={{ textAlign: "left", padding: "3px 6px" }}>Joueur</th><th style={{ padding: "3px 6px" }}>TMG</th><th style={{ padding: "3px 6px" }}>B</th><th style={{ padding: "3px 6px" }}>A</th><th style={{ padding: "3px 6px" }}>T</th><th style={{ padding: "3px 6px" }}>+/-</th><th style={{ padding: "3px 6px" }}>MEC</th><th style={{ padding: "3px 6px" }}>PUN</th></tr></thead>
        <tbody>
          {rows.map(({ player, g, a, h, pim, s, pm, toi }) => player && (
            <tr key={player.id} onClick={() => onSelectPlayer(player, team)} style={{ cursor: "pointer" }} onMouseEnter={(e) => (e.currentTarget.style.background = "#ffffff0a")} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
              <td style={{ padding: "3px 6px" }}>{player.name}</td><td style={{ padding: "3px 6px", textAlign: "center", color: "var(--iceMuted)" }}>{formatTOI(toi)}</td><td style={{ padding: "3px 6px", textAlign: "center" }}>{g}</td><td style={{ padding: "3px 6px", textAlign: "center" }}>{a}</td><td style={{ padding: "3px 6px", textAlign: "center" }}>{s}</td><td style={{ padding: "3px 6px", textAlign: "center", color: pm > 0 ? "var(--win)" : pm < 0 ? "var(--loss)" : "var(--iceMuted)" }}>{pm > 0 ? "+" : ""}{pm}</td><td style={{ padding: "3px 6px", textAlign: "center" }}>{h}</td><td style={{ padding: "3px 6px", textAlign: "center" }}>{pim}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function CompareBar({ label, homeVal, awayVal, homeColor, awayColor, homeFormat, awayFormat }) {
  const hFmt = homeFormat || ((v) => v);
  const aFmt = awayFormat || homeFormat || ((v) => v);
  const max = Math.max(homeVal, awayVal, 1);
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 10, color: "var(--iceMuted)", letterSpacing: 0.5, marginBottom: 4, textAlign: "center" }}>{label}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ flex: 1, display: "flex", justifyContent: "flex-end" }}>
          <div style={{ width: `${(homeVal / max) * 100}%`, minWidth: 26, height: 20, background: homeColor, borderRadius: "3px 0 0 3px", display: "flex", alignItems: "center", justifyContent: "flex-end", padding: "0 6px" }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>{hFmt(homeVal)}</span>
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ width: `${(awayVal / max) * 100}%`, minWidth: 26, height: 20, background: awayColor, borderRadius: "0 3px 3px 0", display: "flex", alignItems: "center", padding: "0 6px" }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>{aFmt(awayVal)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function MatchCompare({ game, home, away }) {
  const { box } = game;
  const pct = (v) => `${v}%`;
  const homeFo = box.home.faceoffsTotal ? Math.round((box.home.faceoffsWon / box.home.faceoffsTotal) * 100) : 0;
  const awayFo = box.away.faceoffsTotal ? Math.round((box.away.faceoffsWon / box.away.faceoffsTotal) * 100) : 0;
  const homeBlocks = Object.values(box.home.blocksBy || {}).reduce((a, v) => a + v, 0);
  const awayBlocks = Object.values(box.away.blocksBy || {}).reduce((a, v) => a + v, 0);
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--iceMuted)", marginBottom: 10 }}>
        <span style={{ color: home.color, fontWeight: 600 }}>{home.name}</span>
        <span style={{ color: away.color, fontWeight: 600 }}>{away.name}</span>
      </div>
      <CompareBar label="BUTS" homeVal={game.homeScore} awayVal={game.awayScore} homeColor={home.color} awayColor={away.color} />
      <CompareBar label="TIRS AU BUT" homeVal={box.home.shots} awayVal={box.away.shots} homeColor={home.color} awayColor={away.color} />
      <CompareBar label="CORSI (TENTATIVES)" homeVal={box.home.corsiFor} awayVal={box.away.corsiFor} homeColor={home.color} awayColor={away.color} />
      <CompareBar label="MISE EN JEU %" homeVal={homeFo} awayVal={awayFo} homeColor={home.color} awayColor={away.color} homeFormat={pct} />
      <CompareBar label="AVANTAGE NUMÉRIQUE" homeVal={box.home.ppGoals} awayVal={box.away.ppGoals} homeColor={home.color} awayColor={away.color} homeFormat={(v) => `${v}/${box.away.penalties}`} awayFormat={(v) => `${v}/${box.home.penalties}`} />
      <CompareBar label="MINUTES DE PUNITION" homeVal={Object.values(box.home.pimBy || {}).reduce((a, v) => a + v, 0)} awayVal={Object.values(box.away.pimBy || {}).reduce((a, v) => a + v, 0)} homeColor={home.color} awayColor={away.color} />
      <CompareBar label="MISES EN ÉCHEC" homeVal={Object.values(box.home.hitsBy || {}).reduce((a, v) => a + v, 0)} awayVal={Object.values(box.away.hitsBy || {}).reduce((a, v) => a + v, 0)} homeColor={home.color} awayColor={away.color} />
      <CompareBar label="TIRS BLOQUÉS" homeVal={homeBlocks} awayVal={awayBlocks} homeColor={home.color} awayColor={away.color} />
    </div>
  );
}

export function BoxscoreView({ game, teamsById, linesByTeam, onSelectPlayer }) {
  const home = teamsById[game.home], away = teamsById[game.away];
  const { box } = game;
  return (
    <div style={{ background: "var(--navy)", border: "1px solid #ffffff22", borderRadius: 4, padding: 16, marginTop: 6, marginBottom: 10 }}>
      <MatchCompare game={game} home={home} away={away} />
      <GoalSummary goalLog={box.goalLog} home={home} away={away} onSelectPlayer={onSelectPlayer} />
      <div style={{ display: "flex", gap: 20, flexWrap: "wrap", marginBottom: 14 }}>
        <StatLines title={`${home.name} (dom.)`} box={box.home} team={home} lines={linesByTeam[home.id]} onSelectPlayer={onSelectPlayer} />
        <StatLines title={`${away.name} (visit.)`} box={box.away} team={away} lines={linesByTeam[away.id]} onSelectPlayer={onSelectPlayer} />
      </div>
      <div style={{ display: "flex", gap: 24, fontSize: 12, color: "var(--iceMuted)", borderTop: "1px solid #ffffff1a", paddingTop: 10, flexWrap: "wrap" }}>
        <span>Gardien {home.name}: {box.homeGoalie.saves}/{box.homeGoalie.shotsAgainst} arrêts</span>
        <span>Gardien {away.name}: {box.awayGoalie.saves}/{box.awayGoalie.shotsAgainst} arrêts</span>
      </div>
    </div>
  );
}
