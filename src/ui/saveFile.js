// Enregistre un fichier pour le joueur. Dans la version publiée (claude.ai), les téléchargements
// passent par la capacité « downloads » (le joueur confirme) ; ailleurs, par un lien classique.
// Renvoie "saved", "declined" ou "fallback".
export async function saveFile(filename, data, mime = "application/json") {
  if (typeof window !== "undefined" && window.claude?.use) {
    try {
      const downloads = await window.claude.use("downloads");
      if (downloads) {
        await downloads.save({ filename, data });
        return "saved";
      }
    } catch (e) {
      if (e?.code === "declined") return "declined";
      if (e?.code === "rate_limited") return "declined";
    }
  }
  const url = URL.createObjectURL(data instanceof Blob ? data : new Blob([data], { type: mime }));
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
  return "fallback";
}
