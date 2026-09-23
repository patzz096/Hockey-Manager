export function getScoutInfo(player, ownerTeamId, myTeamId, staff, scoutKnowledge) {
  const explicit = scoutKnowledge[player.id];
  if (explicit) return explicit;
  if (ownerTeamId === myTeamId) {
    const best = Math.max(staff?.scoutAmateur?.rating || 0, staff?.scoutPro?.rating || 0, 45);
    return { known: true, month: null, scoutName: "Personnel interne", quality: best };
  }
  return { known: false, month: null, scoutName: null, quality: 0 };
}
