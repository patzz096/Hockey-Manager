# Pack de personnalisation Hockey GM

Un **pack** est un seul fichier `.json` qui réunit tout ce qu'on peut personnaliser : alignements,
contrats, attributs, noms et couleurs des équipes, logos et facepack. On le prépare hors du jeu,
on le partage tel quel, puis on l'importe dans l'onglet **Personnalisation** du jeu
(« Importer un pack, une base ou un CSV »).

## Trois façons de le préparer

1. **L'éditeur de pack** (page autonome, `npm run build:editor` → `dist/editeur-pack.html`) :
   équipes à gauche, joueurs en tableau, contrats en millions de $, attributs de 1 à 99,
   logos et photos par glisser-déposer, « Enregistrer le pack ». Il démarre avec la base du jeu
   et peut rouvrir n'importe quel pack.
2. **Un tableur** : dans le jeu, « Exporter en CSV (tableur) » produit une ligne par joueur
   (séparateur `;`, décimales à virgule, comme Excel en français). Modifie-le dans Excel,
   LibreOffice ou Google Sheets, puis réimporte le `.csv`. Le CSV ne contient pas d'images.
3. **Un éditeur de texte**, directement dans le `.json`.

## Format

```json
{
  "format": "hockey-gm-pack",
  "version": 2,
  "name": "Ligue 2027 corrigée",
  "author": "Pat",
  "teamInfo": { "MTL": { "name": "Canadiens de Montréal", "city": "Montréal", "color": "#AF1E2D" } },
  "teams": {
    "MTL": [
      {
        "name": "Nick Suzuki", "pos": "C", "age": 27, "nationality": "CA", "number": 14, "potential": 71,
        "contract": { "years": 7, "salaryM": 7.875, "type": "one" },
        "attrs": { "passing": 88, "offensiveRead": 90, "leadership": 92 }
      }
    ]
  },
  "logos": { "MTL": "data:image/png;base64,..." },
  "faces": { "8480018": "data:image/png;base64,...", "nick_suzuki": "data:image/png;base64,..." }
}
```

- Toutes les parties sont facultatives : un pack peut ne contenir que des logos ou que des photos.
- `pos` : `C`, `LW`, `RW`, `LD`, `RD` ou `G`.
- `contract.salaryM` : salaire annuel en **millions de $** (`7.875` = 7 875 000 $). Le jeu accepte
  aussi `salary` en milliers de $ (`7875`) ou en dollars (`7875000`).
- `contract.type` : `"one"` (un volet) ou `"two"` (deux volets, avec `ahlSalaryM`, salaire dans la LAH).
- Attributs de 1 à 99 (le jeu les affiche sur 20). Un attribut absent vaut 60.
- Photos : la clé est l'identifiant LNH du joueur (`nhlId`) ou son nom normalisé
  (`cole_caufield`). Images PNG ou JPEG en `data:` ; le jeu les réduit à 160 px (logos 192 px).
- Identifiants d'équipe : `ANA BOS BUF CGY CAR CHI COL CBJ DAL DET EDM FLA LAK MIN MTL NSH NJD NYI
  NYR OTT PHI PIT SJS SEA STL TBL TOR UTA VAN VGK WSH WPG`.

## Dans le jeu

- Logos et photos : ajoutés tout de suite.
- Alignements et contrats : appliqués à la prochaine partie (« Nouvelle partie avec cette base »).
- « Exporter mon pack complet » produit un pack de ta ligue actuelle (images comprises), à
  retoucher dans l'éditeur et à partager.
