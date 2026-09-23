import { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import { getItem, setItem, deleteItem, clearStore, getAll } from "./storage";
import { faceKeys, keyFromFilename, resizeImage, isImage } from "./images";

const CustomizationContext = createContext({ logos: {}, faces: {}, rosterDb: null, teamInfo: {}, ready: true });

// Charge la personnalisation (IndexedDB) et expose des URL d'images prêtes à afficher.
export function CustomizationProvider({ children }) {
  const [ready, setReady] = useState(false);
  const [rosterDb, setRosterDb] = useState(null);
  const [teamInfo, setTeamInfoState] = useState({});
  const [logoBlobs, setLogoBlobs] = useState({});
  const [faceBlobs, setFaceBlobs] = useState({});

  useEffect(() => {
    Promise.all([getItem("settings", "rosterDb"), getItem("settings", "teamInfo"), getAll("logos"), getAll("faces")]).then(([db, info, logos, faces]) => {
      setRosterDb(db || null);
      setTeamInfoState(info || {});
      setLogoBlobs(logos || {});
      setFaceBlobs(faces || {});
      setReady(true);
    });
  }, []);

  const logos = useObjectUrls(logoBlobs);
  const faces = useObjectUrls(faceBlobs);

  const saveRosterDb = useCallback(async (db) => {
    if (db) await setItem("settings", "rosterDb", db); else await deleteItem("settings", "rosterDb");
    setRosterDb(db);
  }, []);
  const saveTeamInfo = useCallback(async (info) => { await setItem("settings", "teamInfo", info); setTeamInfoState(info); }, []);
  const setLogo = useCallback(async (teamId, file) => {
    if (!file) { await deleteItem("logos", teamId); setLogoBlobs((prev) => Object.fromEntries(Object.entries(prev).filter(([k]) => k !== teamId))); return; }
    const blob = await resizeImage(file, 192);
    await setItem("logos", teamId, blob);
    setLogoBlobs((prev) => ({ ...prev, [teamId]: blob }));
  }, []);
  // Importe plusieurs logos nommés d'après l'identifiant d'équipe (MTL.png, tor.svg...).
  const importLogos = useCallback(async (files, teamIds) => {
    const added = {};
    for (const file of files) {
      if (!isImage(file)) continue;
      const id = file.name.split(/[\\/]/).pop().replace(/\.[a-z0-9]+$/i, "").toUpperCase();
      if (!teamIds.includes(id)) continue;
      added[id] = await resizeImage(file, 192);
      await setItem("logos", id, added[id]);
    }
    setLogoBlobs((prev) => ({ ...prev, ...added }));
    return Object.keys(added);
  }, []);
  // Facepack : chaque image est rangée sous la clé tirée de son nom de fichier.
  const importFaces = useCallback(async (files, onProgress) => {
    const added = {};
    const list = [...files].filter(isImage);
    for (let i = 0; i < list.length; i++) {
      const key = keyFromFilename(list[i].name);
      added[key] = await resizeImage(list[i], 160);
      await setItem("faces", key, added[key]);
      if (onProgress && i % 20 === 0) onProgress(i + 1, list.length);
    }
    setFaceBlobs((prev) => ({ ...prev, ...added }));
    return Object.keys(added).length;
  }, []);
  const setFace = useCallback(async (player, file) => {
    const key = faceKeys(player)[0];
    if (!file) {
      await Promise.all(faceKeys(player).map((k) => deleteItem("faces", k)));
      setFaceBlobs((prev) => { const next = { ...prev }; faceKeys(player).forEach((k) => delete next[k]); return next; });
      return;
    }
    const blob = await resizeImage(file, 160);
    await setItem("faces", key, blob);
    setFaceBlobs((prev) => ({ ...prev, [key]: blob }));
  }, []);
  const clearFaces = useCallback(async () => { await clearStore("faces"); setFaceBlobs({}); }, []);
  const clearLogos = useCallback(async () => { await clearStore("logos"); setLogoBlobs({}); }, []);

  const value = useMemo(() => ({ ready, rosterDb, teamInfo, logos, faces, saveRosterDb, saveTeamInfo, setLogo, importLogos, importFaces, setFace, clearFaces, clearLogos }),
    [ready, rosterDb, teamInfo, logos, faces, saveRosterDb, saveTeamInfo, setLogo, importLogos, importFaces, setFace, clearFaces, clearLogos]);
  return <CustomizationContext.Provider value={value}>{children}</CustomizationContext.Provider>;
}

function useObjectUrls(blobs) {
  const urls = useMemo(() => Object.fromEntries(Object.entries(blobs).map(([k, b]) => [k, b instanceof Blob ? URL.createObjectURL(b) : b])), [blobs]);
  useEffect(() => () => Object.values(urls).forEach((u) => { if (typeof u === "string" && u.startsWith("blob:")) URL.revokeObjectURL(u); }), [urls]);
  return urls;
}

export function useCustomization() { return useContext(CustomizationContext); }

export function useFaceUrl(player) {
  const { faces } = useCustomization();
  if (!player) return null;
  for (const k of faceKeys(player)) if (faces[k]) return faces[k];
  return null;
}
