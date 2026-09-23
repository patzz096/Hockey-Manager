export function formatTOI(min) {
  if (min == null) return "—";
  const m = Math.floor(min);
  const s = Math.round((min - m) * 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function starsText(value) {
  const rounded = Math.round(value * 2) / 2;
  const full = Math.floor(rounded);
  const half = rounded - full >= 0.5;
  return "★".repeat(full) + (half ? "⯨" : "") + "☆".repeat(Math.max(0, 5 - full - (half ? 1 : 0)));
}

export function contractLabel(contract) {
  if (!contract) return "Agent libre";
  return `${contract.years} an${contract.years > 1 ? "s" : ""} · ${contract.salary}k$${contract.noTrade ? " · NTC" : ""}`;
}

export function draftLabel(player) {
  return player.draftPick ? `${player.draftPick}e rang (${player.draftYear})` : "Non repêché";
}
