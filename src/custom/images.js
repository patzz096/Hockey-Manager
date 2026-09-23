// Clé d'un visage dans le facepack : l'identifiant LNH si connu, sinon le nom normalisé.
// Noms de fichiers acceptés : 8478402.png, connor_mcdavid.png, Connor McDavid.jpg...
export function slugName(name) {
  return String(name || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
}
export function faceKeys(player) {
  return [player.nhlId != null ? String(player.nhlId) : null, slugName(player.name)].filter(Boolean);
}
// Nom de fichier -> clé (sans extension ni dossier).
export function keyFromFilename(filename) {
  const base = filename.split(/[\\/]/).pop().replace(/\.[a-z0-9]+$/i, "");
  return /^\d+$/.test(base) ? base : slugName(base);
}

// Réduit l'image (côté le plus long = max px) pour garder un facepack léger.
export async function resizeImage(file, max = 160) {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    return await new Promise((resolve) => canvas.toBlob((b) => resolve(b || file), "image/png"));
  } catch {
    return file;
  }
}
export const isImage = (file) => /^image\//.test(file.type) || /\.(png|jpe?g|gif|webp|svg)$/i.test(file.name);
