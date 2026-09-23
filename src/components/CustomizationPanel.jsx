import { useRef, useState } from "react";
import { useCustomization } from "../custom/CustomizationContext";
import { parseRosterFile, exportLeagueDb } from "../custom/rosterFile";
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

function download(filename, data) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 1)], { type: "application/json" }));
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

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

  async function importDb(files) {
    try {
      const file = files[0];
      const db = parseRosterFile(await file.text(), file.name);
      const known = Object.keys(db.teams).filter((id) => teamIds.includes(id));
      if (known.length === 0) throw new Error("Aucune équipe reconnue (identifiants attendus : MTL, TOR, BOS...).");
      const ignored = Object.keys(db.teams).filter((id) => !teamIds.includes(id));
      await c.saveRosterDb({ ...db, source: file.name, importedAt: new Date().toISOString().slice(0, 10) });
      setStatus({ ok: true, text: `${file.name} : ${known.length} équipes chargées${ignored.length ? ` (ignorées : ${ignored.join(", ")})` : ""}. ${inGame ? "Lance une nouvelle partie pour l'appliquer." : ""}` });
    } catch (e) {
      setStatus({ ok: false, text: `Import impossible : ${e.message}` });
    }
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
        <div style={{ fontFamily: "Oswald, sans-serif", fontSize: 16, marginBottom: 6 }}>Base de données (alignements)</div>
        <div style={{ ...hint, marginBottom: 10 }}>
          Actuelle : <strong style={{ color: "var(--ice)" }}>{c.rosterDb ? `${c.rosterDb.source || "personnalisée"} — ${dbTeams.length} équipes, ${dbPlayers} joueurs (importée le ${c.rosterDb.importedAt})` : "par défaut"}</strong><br />
          Formats acceptés : fichier exporté par le jeu (.json), ou le JSON/CSV de <code>scripts/fetch_nhl_rosters.py</code>. Les équipes absentes du fichier gardent leur alignement par défaut.
          Astuce : exporte la base actuelle, modifie-la dans un éditeur de texte (noms, attributs, contrats), puis réimporte-la.
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <FileButton label="Importer une base (.json / .csv)" accept=".json,.csv,application/json,text/csv" onFiles={importDb} color="var(--red)" />
          <button onClick={() => download("hockey-gm-base.json", exportLeagueDb(teams))} style={{ ...btnStyle("var(--steel)"), fontSize: 12 }}>Exporter la base actuelle</button>
          <button onClick={() => {
            const text = JSON.stringify(exportLeagueDb(teams), null, 1);
            navigator.clipboard?.writeText(text).then(() => setStatus({ ok: true, text: "Base copiée dans le presse-papiers : colle-la dans un fichier .json." }), () => setStatus({ ok: false, text: "Copie refusée par le navigateur : utilise « Exporter la base actuelle »." }));
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
