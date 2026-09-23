import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { parseRosterFile, parseCsv, exportLeagueDb } from "../src/custom/rosterFile";
import { keyFromFilename, faceKeys } from "../src/custom/images";
import { initLeague } from "../src/engine/league";

const sample = readFileSync(new URL("./fixtures/nhl-sample.json", import.meta.url), "utf8").replaceAll('"XXX"', '"CHI"');

describe("personnalisation", () => {
  it("lit le JSON du script LNH", () => {
    const db = parseRosterFile(sample, "alignement_complet_nhl.json");
    expect(db.teams.CHI).toHaveLength(23);
  });

  it("lit le CSV du script LNH (BOM, guillemets, point-virgule)", () => {
    const csv = "\uFEFFequipe,prenom,nom,position,tire_la_main,date_naissance,pj\nCHI,\"Jean, fils\",Tremblay,D,R,2000-01-01,50\nCHI,Luc;Roy,C,L,1999-01-01,\n";
    const rows = parseCsv(csv.replace(/^\uFEFF/, ""));
    expect(rows[0].prenom).toBe("Jean, fils");
    const db = parseRosterFile(csv, "a.csv");
    expect(db.teams.CHI[0]).toMatchObject({ name: "Jean, fils Tremblay", pos: "RD" });
  });

  it("exporte puis réimporte la ligue sans perte", () => {
    const lg = initLeague();
    const db = parseRosterFile(JSON.stringify(exportLeagueDb(lg.teams)), "base.json");
    const again = initLeague(db);
    const a = lg.teams.find((t) => t.id === "MTL").roster, b = again.teams.find((t) => t.id === "MTL").roster;
    expect(b.map((p) => [p.name, p.ovr, p.potential, p.contract.salary])).toEqual(a.map((p) => [p.name, p.ovr, p.potential, p.contract.salary]));
  });

  it("applique la base et les infos d'équipe à la nouvelle ligue", () => {
    const db = parseRosterFile(sample, "x.json");
    const lg = initLeague({ teams: db.teams, teamInfo: { CHI: { name: "Castors de Chicago", color: "#123456" } } });
    const chi = lg.teams.find((t) => t.id === "CHI");
    expect(chi).toMatchObject({ name: "Castors de Chicago", color: "#123456", city: "Chicago" });
    expect(chi.roster.some((p) => p.name === "Joueur Vedette")).toBe(true);
  });

  it("rejette une position invalide", () => {
    expect(() => parseRosterFile(JSON.stringify({ format: "hockey-gm-db", teams: { MTL: [{ name: "X", pos: "Z" }] } }))).toThrow(/position/);
  });

  it("associe les fichiers du facepack aux joueurs", () => {
    expect(keyFromFilename("faces/8478402.png")).toBe("8478402");
    expect(keyFromFilename("Connor McDavid.JPG")).toBe("connor_mcdavid");
    expect(faceKeys({ name: "Jérémy Côté" })).toEqual(["jeremy_cote"]);
    expect(faceKeys({ name: "A B", nhlId: 42 })).toEqual(["42", "a_b"]);
  });
});
