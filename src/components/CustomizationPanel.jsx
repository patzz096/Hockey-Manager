import { useRef, useState } from "react";
import { useCustomization } from "../custom/CustomizationContext";
import { exportLeagueDb } from "../custom/rosterFile";
import { buildPack, parsePackFile, exportSheetCsv } from "../custom/pack";
import { saveFile } from "../ui/saveFile";
import { faceKeys } from "../custom/images";
import { h2Style, btnStyle, inputStyle } from "../ui/theme";
import { TeamCrest, ConfirmButton } from "./common";

const section = { background: "var(--navy2)", border: "1px solid #ffffff1a", borderRadius: 4, padding: 16, marginBottom: 18 };
const hint = { fontSize: 12, color: "var(--iceMuted)", lineHeight: 1.5 };

function FileButton({ label, accept, multiple, directory, onFiles, color = "var(--steel)" }) {
  const ref = useRef(null);
  const dirProps = directory ? { webkitdirectory: "", directory: "" } : {};
  return (
    <>
      <button onClick={() => ref.current?.click()} style={{ ...btnStyle(color), fontSize: 12 }}>{label}</button>
      <input ref={ref} type="file" accept={accept} multiple={multiple} {...dirProps} style={{ display: "none" }}
        onChange={(e) => { const files = [...(e.target.files || [])]; e.target.value = ""; if (files.length) onFiles(files); }} />
    </>
  );
}

// Lien vers l'éditeur de pack (page séparée, utilisable hors du jeu).
export const PACK_EDITOR_URL = "https://claude.ai/artifact/JTwgSfDMH5jbhBbcRUWZHa";

// teams : équipes de la partie en cours (pour l'export et la couverture du facepack).
export function CustomizationPanel({ teams, inGame, onNewGame }) {
  const c = useCustomization();
  const [status, setStatus] = useState(null);
  const [progress, setProgress] = useState(null);
  const teamIds = teams.map((t) => t.id);
  const info = c.teamInfo;
  const allPlayers = teams.flatMap((t) => t.roster);
  const withFace = allPlayers.filter((p) => faceKeys(p).some((k) => c.faces[k])).length;
  const dbTeams = c.rosterDb ? Object.keys(c.rosterDb.teams) : [];
  const dbPlayers = c.rosterDb ? Object.values(c.rosterDb.teams).reduce((a, l) => a + l.length, 0) : 0;

  // Import d'un pack complet, d'une base (.json) ou d'un CSV (tableur ou script LNH).
  async function importDb(files) {
    try {
      const file = files[0];
      const pack = await parsePackFile(await file.text(), file.name);
      const done = [];
      if (pack.db) {
        const known = Object.keys(pack.db.teams).filter((id) => teamIds.includes(id));
        if (known.length === 0) throw new Error("Aucune équipe reconnue (identifiants attendus : MTL, TOR, BOS...).");
        const ignored = Object.keys(pack.db.teams).filter((id) => !teamIds.includes(id));
        await c.saveRosterDb({ ...pack.db, source: pack.meta?.name || file.name, importedAt: new Date().toISOString().slice(0, 10) });
        done.push(`${known.length} équipes${ignored.length ? ` (ignorées : ${ignored.join(", ")})` : ""}`);
      }
      const info = Object.fromEntries(Object.entries(pack.teamInfo || {}).filter(([id]) => teamIds.includes(id)).map(([id, v]) => [id, { name: v.name, city: v.city, color: v.color }]));
      if (Object.keys(info).length) { await c.saveTeamInfo({ ...c.teamInfo, ...info }); done.push(`${Object.keys(info).length} fiches d'équipe`); }
      const img = await c.importPackImages({ logos: Object.fromEntries(Object.entries(pack.logos).filter(([id]) => teamIds.includes(id))), faces: pack.faces });
      if (img.logos) done.push(`${img.logos} logos`);
      if (img.faces) done.push(`${img.faces} photos`);
      if (!done.length) throw new Error("le fichier ne contient ni alignements, ni logos, ni photos.");
      setStatus({ ok: true, text: `${pack.meta?.name || file.name}${pack.meta?.author ? ` (par ${pack.meta.author})` : ""} : ${done.join(", ")} importés.${pack.db && inGame ? " Lance une nouvelle partie pour appliquer les alignements." : ""}` });
    } catch (e) {
      setStatus({ ok: false, text: `Import impossible : ${e.message}` });
    }
  }
  async function exportPack() {
    setStatus({ ok: true, text: "Préparation du pack…" });
    const pack = await buildPack(teams, c.exportImages(), { name: "Mon pack Hockey GM" });
    const text = JSON.stringify(pack);
    const r = await saveFile("hockey-gm-pack.json", text);
    setStatus(r === "declined" ? { ok: false, text: "Enregistrement annulé." } : { ok: true, text: `Pack enregistré (${Math.round(text.length / 1024)} Ko) : ${teams.length} équipes, ${Object.keys(pack.logos).length} logos, ${Object.keys(pack.faces).length} photos. Modifie-le, partage-le, puis réimporte-le ici.` });
  }
  async function exportCsv() {
    const r = await saveFile("hockey-gm-alignements.csv", exportSheetCsv(teams), "text/csv");
    setStatus(r === "declined" ? { ok: false, text: "Enregistrement annulé." } : { ok: true, text: "CSV enregistré : ouvre-le dans Excel, LibreOffice ou Google Sheets (une ligne par joueur, salaires en millions), puis réimporte-le ici." });
  }
  function setTeamField(id, field, value) {
    c.saveTeamInfo({ ...info, [id]: { ...(info[id] || {}), [field]: value } });
  }
  function resetTeam(id) {
    c.saveTeamInfo(Object.fromEntries(Object.entries(info).filter(([k]) => k !== id)));
  }

  return (
    <div>
      {inGame && <h2 style={h2Style}>Personnalisation</h2>}
      <p style={{ ...hint, marginTop: -8, marginBottom: 16 }}>Comme dans Football Manager ou Eastside Hockey Manager : charge ta propre base de données d'alignements, tes logos et ton facepack. Tout est conservé dans ce navigateur.</p>
      {status && <div style={{ ...section, borderColor: status.ok ? "var(--win)" : "var(--loss)", fontSize: 13, padding: 12 }}>{status.text}</div>}

      <div style={section}>
        <div style={{ fontFamily: "Oswald, sans-serif", fontSize: 16, marginBottom: 6 }}>Pack de personnalisation (alignements, contrats, logos, photos)</div>
        <div style={{ ...hint, marginBottom: 10 }}>
          Un pack est <strong style={{ color: "var(--ice)" }}>un seul fichier .json</strong> qui réunit tes alignements (joueurs, attributs, contrats en millions de $), les noms et couleurs des équipes, tes logos et ton facepack. Prépare-le hors du jeu, partage-le, puis importe-le ici. Trois façons de le modifier :
          <br />1. {PACK_EDITOR_URL ? <a href={PACK_EDITOR_URL} target="_blank" rel="noreferrer" style={{ color: "var(--accent)" }}>l'éditeur de pack</a> : "l'éditeur de pack"} (tableau par équipe, photos et logos par glisser-déposer) ;
          <br />2. un tableur (Excel, Google Sheets) avec « Exporter en CSV » : une ligne par joueur ;
          <br />3. un éditeur de texte, directement dans le fichier .json.
        </div>
        <div style={{ ...hint, marginBottom: 10 }}>
          Actuelle : <strong style={{ color: "var(--ice)" }}>{c.rosterDb ? `${c.rosterDb.source || "personnalisée"} — ${dbTeams.length} équipes, ${dbPlayers} joueurs (importée le ${c.rosterDb.importedAt})` : "par défaut"}</strong><br />
          Formats acceptés : pack (.json), base du jeu (.json), CSV du tableur, ou le JSON/CSV de <code>scripts/fetch_nhl_rosters.py</code>. Les équipes absentes du fichier gardent leur alignement par défaut ; un pack qui ne contient que des logos ou des photos les ajoute sans toucher aux alignements.
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <FileButton label="Importer un pack, une base ou un CSV" accept=".json,.csv,application/json,text/csv" onFiles={importDb} color="var(--red)" />
          <button onClick={exportPack} style={{ ...btnStyle("var(--win)"), fontSize: 12 }}>Exporter mon pack complet</button>
          <button onClick={exportCsv} style={{ ...btnStyle("var(--steel)"), fontSize: 12 }}>Exporter en CSV (tableur)</button>
          <button onClick={() => {
            const text = JSON.stringify(exportLeagueDb(teams), null, 1);
            navigator.clipboard?.writeText(text).then(() => setStatus({ ok: true, text: "Base copiée dans le presse-papiers : colle-la dans un fichier .json." }), () => setStatus({ ok: false, text: "Copie refusée par le navigateur : utilise « Exporter mon pack complet »." }));
          }} style={{ ...btnStyle("var(--steel)"), fontSize: 12 }}>Copier la base (JSON)</button>
          {c.rosterDb && <button onClick={() => { c.saveRosterDb(null); setStatus({ ok: true, text: `Base par défaut rétablie.${inGame ? " Lance une nouvelle partie pour l'appliquer." : ""}` }); }} style={{ ...btnStyle("var(--loss)"), fontSize: 12 }}>Revenir à la base par défaut</button>}
          {onNewGame && (inGame
            ? <ConfirmButton label="Nouvelle partie avec cette base" confirmLabel="Confirmer : la partie en cours sera perdue" color="var(--win)" onConfirm={onNewGame} />
            : <button onClick={onNewGame} style={{ ...btnStyle("var(--win)"), fontSize: 12 }}>Appliquer la base</button>)}
        </div>
      </div>

      <div style={section}>
        <div style={{ fontFamily: "Oswald, sans-serif", fontSize: 16, marginBottom: 6 }}>Facepack (photos des joueurs)</div>
        <div style={{ ...hint, marginBottom: 10 }}>
          Nomme chaque image d'après l'identifiant LNH du joueur (<code>8478402.png</code>) ou son nom (<code>connor_mcdavid.png</code>, <code>Connor McDavid.jpg</code>). Tu peux aussi choisir tout un dossier. Les images sont réduites à 160 px.<br />
          Photos chargées : <strong style={{ color: "var(--ice)" }}>{Object.keys(c.faces).length}</strong> · joueurs de la ligue couverts : <strong style={{ color: "var(--ice)" }}>{withFace}/{allPlayers.length}</strong>
          {progress && <> · import : {progress}</>}
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <FileButton label="Ajouter des photos" accept="image/*" multiple onFiles={async (f) => { const n = await c.importFaces(f, (i, t) => setProgress(`${i}/${t}`)); setProgress(null); setStatus({ ok: true, text: `${n} photos ajoutées au facepack.` }); }} color="var(--red)" />
          <FileButton label="Choisir un dossier" directory multiple onFiles={async (f) => { const n = await c.importFaces(f, (i, t) => setProgress(`${i}/${t}`)); setProgress(null); setStatus({ ok: true, text: `${n} photos ajoutées au facepack.` }); }} />
          {Object.keys(c.faces).length > 0 && <ConfirmButton label="Vider le facepack" confirmLabel="Confirmer la suppression" color="var(--loss)" onConfirm={c.clearFaces} />}
        </div>
        <div style={{ ...hint, marginTop: 8 }}>Une photo peut aussi être choisie joueur par joueur, depuis son profil.</div>
      </div>

      <div style={section}>
        <div style={{ fontFamily: "Oswald, sans-serif", fontSize: 16, marginBottom: 6 }}>Équipes et logos</div>
        <div style={{ ...hint, marginBottom: 10 }}>Nom, ville et couleur s'appliquent tout de suite. Pour importer plusieurs logos d'un coup, nomme les fichiers d'après l'identifiant de l'équipe (<code>MTL.png</code>, <code>TOR.svg</code>).</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
          <FileButton label="Importer des logos" accept="image/*" multiple onFiles={async (f) => { const ids = await c.importLogos(f, teamIds); setStatus({ ok: ids.length > 0, text: ids.length ? `Logos ajoutés : ${ids.join(", ")}.` : "Aucun fichier ne correspond à un identifiant d'équipe (ex. MTL.png)." }); }} color="var(--red)" />
          {Object.keys(c.logos).length > 0 && <ConfirmButton label="Retirer tous les logos" confirmLabel="Confirmer le retrait" color="var(--loss)" onConfirm={c.clearLogos} />}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(330px, 1fr))", gap: 8 }}>
          {teams.map((t) => (
            <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 10, background: "var(--navy)", borderRadius: 4, padding: 8, borderLeft: `4px solid ${t.color}` }}>
              <TeamCrest team={t} size={40} />
              <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
                <input aria-label={`Nom ${t.id}`} value={t.name} onChange={(e) => setTeamField(t.id, "name", e.target.value)} style={{ ...inputStyle, padding: "4px 6px", fontSize: 12, gridColumn: "1 / 3" }} />
                <input aria-label={`Ville ${t.id}`} value={t.city} onChange={(e) => setTeamField(t.id, "city", e.target.value)} style={{ ...inputStyle, padding: "4px 6px", fontSize: 12 }} />
                <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                  <input aria-label={`Couleur ${t.id}`} type="color" value={t.color} onChange={(e) => setTeamField(t.id, "color", e.target.value)} style={{ width: 28, height: 24, border: "none", background: "none", padding: 0 }} />
                  <FileButton label="Logo" accept="image/*" onFiles={(f) => c.setLogo(t.id, f[0])} />
                  {(c.logos[t.id] || info[t.id]) && <button title="Rétablir" onClick={() => { c.setLogo(t.id, null); resetTeam(t.id); }} style={{ background: "none", border: "none", color: "var(--iceMuted)", cursor: "pointer", fontSize: 12 }}>↺</button>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
