export function GoalSummary({ goalLog, home, away }) {
  if (!goalLog || goalLog.length === 0) return <div style={{ fontSize: 12, color: "var(--iceMuted)", marginBottom: 14 }}>Aucun but.</div>;
  const periods = [1, 2, 3];
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 11, color: "var(--iceMuted)", marginBottom: 8, letterSpacing: 0.5 }}>SOMMAIRE DES BUTS</div>
      {periods.map((p) => {
        const goals = goalLog.filter((g) => g.period === p);
        if (goals.length === 0) return null;
        return (
          <div key={p} style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 11, color: "var(--iceMuted)", background: "#ffffff0a", padding: "3px 8px", borderRadius: 3, marginBottom: 6, display: "inline-block" }}>{p}RE PÉRIODE</div>
            {goals.map((g, i) => {
              const team = g.side === "home" ? home : away;
              const scorer = team.roster.find((pl) => pl.id === g.scorerId);
              const assists = g.assistIds.map((id) => team.roster.find((pl) => pl.id === id)?.name).filter(Boolean);
              return (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0", fontSize: 13 }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: team.color, flexShrink: 0 }} />
                  <span style={{ flex: 1 }}>{scorer?.name || "?"} {assists.length > 0 && <span style={{ color: "var(--iceMuted)" }}>({assists.join(", ")})</span>}</span>
                  {g.type === "PP" && <span style={{ fontSize: 10, background: "#D9A40433", color: "#D9A404", padding: "1px 6px", borderRadius: 3 }}>AN</span>}
                  <span style={{ fontSize: 11, color: "var(--iceMuted)" }}>{team.name}</span>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
