# Hockey GM — Jeu de simulation de gestion de hockey

Prototype de jeu de gestion façon **Franchise Hockey Manager / Football Manager 24**, où le
joueur agit comme directeur général d'une équipe de la LNH (32 vraies équipes). Construit
en React (Vite), et regroupable en un seul fichier HTML pour être publié via l'outil Artifact
de Claude.ai.

## État actuel

Le prototype d'origine (`hockey_gm_prototype.jsx`, un seul fichier de 3 362 lignes, conservé
dans l'historique git) a été découpé en modules ES sous `src/`, avec un projet Vite pour le
lancer en local et le regrouper en un seul fichier HTML publiable comme artefact.
Le découpage ne change rien au comportement : avec la même graine, une saison complète
simulée donne un résultat identique au bit près à celui du fichier d'origine.

## Démarrer

```bash
npm install
npm run dev              # serveur de développement (http://localhost:5173)
npm test                 # tests du moteur (vitest)
npm run lint             # ESLint
npm run build:artifact   # dist/index.html autonome (JS en ligne), à publier comme artefact
```

## Structure

```
src/
  main.jsx                 point d'entrée React
  App.jsx                  état global + orchestration (HockeyGM)
  data/
    teams.js               32 équipes (TEAM_SEED)
    names.js               prénoms/noms générés, drapeaux et nationalités
    rosters/               alignements réels, un fichier par division
      index.js             REAL_ROSTERS : identifiant d'équipe → données
      atlantique.js, metropolitaine.js, cascades.js (inutilisé)
  engine/                  logique pure, sans React
    random.js              RNG à graine, poisson, tirage pondéré
    attributes.js          catégories d'attributs, cote (computeOvr), /20, étoiles
    players.js             génération de joueurs, agents libres, club-école, repêchage
    lines.js               trios/paires par défaut, rôle d'un joueur dans l'alignement
    strategy.js            systèmes de jeu et multiplicateurs selon le profil d'effectif
    simulation.js          simulateGame, simulateChunk (direct), feuille de match
    league.js              initLeague, calendrier, classement
    contracts.js           salaires attendus, évaluation d'une offre
    finance.js             billetterie, concessions, stationnement, bilan de match
    staff.js               rôles et marché du personnel
    scouting.js            getScoutInfo (brouillard de dépistage)
  ui/                      thème (couleurs, styles), formatage, hook de tri
  components/              un fichier par écran ou onglet
    match/                 feuille de match, sim en direct, visionneur, sommaire des buts
tests/engine.test.js       tests du moteur
```

## Ce qui est fait

**Ligue et équipes**
- 32 vraies équipes LNH (noms, couleurs, division, capacité réelle de l'aréna)
- Alignements réels pour 16 équipes (Atlantique + Métropolitaine + Caroline), avec attributs
  projetés à partir de vraies stats/contrats trouvés par recherche web. **16 équipes restantes
  (Centrale + Pacifique) sont encore en joueurs générés procéduralement.**
- Calendrier aller-retour complet (chaque équipe affronte toutes les autres, domicile/visiteur)

**Joueurs**
- Attributs sur échelle /20 (façon FM), répartis en 4 catégories pour les patineurs
  (offensive, défensive, mentale, physique) et 3 pour les gardiens
- Positions précises : C, AG (LW), AD (RW), DG (LD), DD (RD), G — plus générique W/D
- Cote actuelle et potentiel affichés en **étoiles sur 5**, relatives à la moyenne de
  l'effectif qui évalue (`teamOvrBenchmark` + `starsFor`)
- Nationalité avec drapeau, contrat (années/salaire/clause de non-échange), rang de repêchage
- Système de dépistage ("fog of war") : les joueurs des autres équipes sont cachés
  (cote/attributs invisibles) tant qu'ils n'ont pas été dépistés à la demande — voir
  `scoutKnowledge`, `getScoutInfo`, `requestScouting`

**Moteur de simulation**
- Simulation par match complet (`simulateGame`) ou par tranche de 5 minutes en mode direct
  (`simulateChunk`, 12 tranches/match) pour ajuster trios/stratégie en cours de match
- Buts, passes, tirs, mises en échec, punitions, avantage/désavantage numérique, mises au jeu,
  tirs bloqués, +/-, temps de glace — tous simulés par joueur selon ses attributs réels
- Stratégies façon coaching NHL (forecheck, système défensif, entrée/sortie de zone) +
  curseurs de mentalité (agressivité, pincement, discipline), avec effet réellement dépendant
  du profil de l'effectif (pas de constantes fixes)
- Auto-optimisation (meilleures lignes, meilleure stratégie, meilleur alignement spécial)

**Gestion**
- Trios/paires/gardiens éditables par glisser-déposer ou clic-clic (échange), sur un schéma
  de patinoire façon FM24, avec liste de joueurs par position à droite
- Personnel : entraîneur-chef, adjoints (avec compétence de développement séparée),
  dépisteurs amateur/pro, directeur des finances, directeur des opérations hockey — avec
  primes de performance et option délégation (contrôle manuel ou IA)
- Finances : billetterie à 3 paliers, stationnement, 10 items de concession, installations
  améliorables, bilan détaillé par match local
- Transactions : échanges, agents libres (négociation d'offre avec moteur de décision du
  joueur), contrats, page de profondeur (LNH/LAH/prospects) avec rappels/renvois
- Messagerie interne recevant tous les rapports (progression, finances, transactions, dépistage)

**Interface**
- Visionneur de match animé 2D (rejeu du résultat déjà simulé, pas une physique en direct)
- Mode "Sim en direct" avec horloge de période, sommaire de buts et stats en temps réel
- Filtres et tri sur presque tous les tableaux (division, équipe, colonnes)

## Ce qui reste incomplet ou en cours

1. **Système de délai de dépistage** — demandé mais pas terminé : actuellement
   `requestScouting` révèle un joueur instantanément. Il faut ajouter un compteur de jours
   (`currentDay`), une file de demandes en attente (`pendingScouts`), et résoudre les rapports
   après un délai (plus rapide si le dépisteur est meilleur), avec message de notification à
   la réception. Voir la dernière partie de la conversation pour le plan détaillé déjà rédigé.
2. **Clic sur un joueur "peu importe l'endroit"** — pas encore universel. Manquent : noms de
   buteurs/passeurs dans `GoalSummary`, lignes de `TransactionsCenter` (RosterPicker),
   `FreeAgentsPanel`, `ContractsPanel`.
3. **16 équipes** (Centrale + Pacifique) sans vrais joueurs — voir section suivante.
4. **Statistiques de carrière multi-saisons** — pas d'historique d'une saison à l'autre (pas
   de mécanique de fin de saison/nouvelle saison implémentée du tout).
5. Quelques approximations assumées : ordre chronologique des buts non réellement chronométré
   (réparti aléatoirement par période), +/- approximatif (pas de simulation ligne par ligne
   réelle), côtés gauche/droite des joueurs réels assignés en alternance (pas vérifiés un par
   un), plusieurs numéros de chandail/contrats de joueurs récemment échangés approximatifs.

## Notes techniques

- **Données de joueurs** : fournir un CSV ou un JSON (nom, position, âge, stats, contrat) reste
  la façon la plus rapide d'ajouter les 16 équipes manquantes. La conversion en attributs est
  rapide, alors que chercher chaque joueur sur le web coûte cher.
- **Bogue connu** : `buildRealRoster` (`src/engine/players.js`) ne recopie pas `nationality`,
  donc les joueurs réels s'affichent sans drapeau (« Nationalité — »).
- **Code mort retiré au découpage** : une première version de `LineupPitch` était écrasée par
  une seconde définition portant le même nom. C'est interdit dans un module ES, où la
  compilation échoue. Seule la version réellement utilisée a été gardée.
- **Code inutilisé conservé** : `CASCADES_ROSTER_DATA` et `buildNamedRoster`.

## Fonctions clés à connaître (moteur)

| Fonction | Fichier | Rôle |
|---|---|---|
| `initLeague()` | `engine/league.js` | Construit les 32 équipes, agents libres, personnel, repêchage au démarrage |
| `buildRoster` / `buildRealRoster` | `engine/players.js` | Génère un alignement procédural ou depuis des données réelles |
| `simulateGame` / `simulateChunk` | `engine/simulation.js` | Simule un match complet ou une tranche de 5 min |
| `computeOvr`, `starsFor`, `attr20` | `engine/attributes.js` | Conversion attributs internes (0-99) → cote → étoiles / 20 |
| `getScoutInfo` | `engine/scouting.js` | Détermine si un joueur est "connu" et avec quelle qualité |
| `getStrategyMultipliers` / `STRATEGY_ENGINE` | `engine/strategy.js` | Effet des stratégies selon le profil d'effectif |
| `computeGameFinance` | `engine/finance.js` | Revenus/dépenses d'un match local |

## Structure des données principales

```
player = { id, name, number, pos, age, nationality, attrs:{...}, ovr, potential,
           contract:{years,salary,noTrade}, draftPick, draftYear }
team   = { id, city, name, color, division, capacity, roster:[player], lines:{...} }
lines  = { forwards:[{LW,C,RW}x4], defense:[{LD,RD}x3], goalies:{starter,backup},
           pp:[5 ids], pk:[4 ids], strategy:{...}, mentality:{...} }
business = { cash, ticketTiers, facilities, parking, concessionItems, staff, delegation, log }
```

## Prochaines étapes

1. Terminer le délai de dépistage (voir « Ce qui reste incomplet », point 1).
2. Rendre un joueur cliquable partout (point 2).
3. Ajouter les 16 équipes des divisions Centrale et Pacifique (point 3).
