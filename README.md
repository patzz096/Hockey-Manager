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
- Système de dépistage ("fog of war") : les joueurs des autres équipes et les agents libres
  restent cachés (cote/attributs invisibles) tant qu'un rapport n'a pas été reçu
  (`src/engine/scouting.js`) :
  - demande depuis l'onglet **Dépistage** du profil du joueur (case à cocher : cocher pour
    envoyer un dépisteur, décocher pour annuler), ou le bouton « Dépister » des listes
  - dépisteur amateur pour les 20 ans et moins, pro pour les autres ; si le poste est vide,
    l'autre dépisteur s'en charge à 85 % de sa cote, sinon le personnel interne (8/20)
  - délai en jours (1 ronde = 1 jour, un mois = 30 jours) : de 1 jour pour un dépisteur 20/20
    à 5-6 jours pour un faible ; notification dans la messagerie au départ et à la réception
  - précision selon la note du dépisteur (/20) : avec un 4/20, la cote estimée s'écarte de ~5
    points en moyenne et le potentiel de ~8 ; avec un 20/20, moins de 1 et ~1,5 point
  - le rapport donne l'habileté actuelle, le potentiel (long terme) et une note générale en
    étoiles (relatives à ton effectif ; le potentiel pèse plus chez les jeunes), avec la
    fiabilité et un texte forces/faiblesses. Les attributs de l'onglet Profil sont les
    valeurs estimées par ce rapport
  - comme dans FM, tes propres joueurs sont aussi vus à travers ton personnel
    (`staffViewPlayer`) : alignement, trios, profondeur, contrats et choix automatiques
    utilisent les valeurs estimées par ton dépisteur ; embaucher un meilleur dépisteur rend
    ces valeurs plus justes. Le moteur de simulation utilise toujours les vraies valeurs

**Moteur de simulation**
- Simulation par match complet (`simulateGame`) ou en mode direct : le jeu se joue jusqu'au
  prochain coup de sifflet, à un moment variable (1 min 30 à 7 min de jeu, `nextStoppage`), ou
  jusqu'à la fin de la période ; l'horloge descend de 20:00 à 00:00 comme à la télé. Les
  trios et la stratégie modifiés s'appliquent dès la mise au jeu suivante
- **Modèle fondé sur les tirs** (`src/engine/simulation.js`, constantes dans `SIM`) : volume de
  tirs (attaque contre défense adverse), puis probabilité de but par tir (finition contre
  gardien), puis avantages numériques issus des punitions. Chaque but est attribué à un joueur
  qui a tiré ; Corsi = tirs + tirs ratés + tirs bloqués. Le match est simulé période par
  période avec un effet de pointage (l'équipe menée pousse, celle qui mène protège). Égalité :
  prolongation (but crédité à un joueur) ou tirs de barrage (+1 au score, sans buteur)
- Calibrage vérifié par `tests/simulation-calibration.test.js` sur 3 saisons : ~3,1 buts et
  ~31 tirs par équipe, % d'arrêts ~.905, AN ~19 %, ~0,06 but en DN par équipe, ~55 % de victoires à domicile, ~7 % de
  matchs à 5 buts d'écart ou plus, et le gagnant d'un écrasement domine nettement aux tirs
- Buts, passes, tirs, mises en échec, punitions, avantage/désavantage numérique, mises au jeu,
  tirs bloqués, +/-, temps de glace — tous simulés par joueur selon ses attributs réels
- Rôles des joueurs (`engine/roles.js`, d'après le guide « Archétypes de joueurs »,
  `docs/archetypes-joueurs.md`) : attaquants (fabricant de jeu, franc-tireur, attaquant de
  puissance, deux sens, énergie), défenseurs (offensif, défensif, deux sens), gardien
  papillon. Onglet Rôles : rôle demandé à chaque joueur, adéquation selon ses attributs clés,
  archétype naturel, fiche du rôle (attributs, priorité tactique, exemples LNH, effets),
  avertissements (rôle mal placé dans l'alignement) et conseils de composition des trios et
  paires. En match, le rôle change qui tire, passe, frappe, bloque et gagne les mises au jeu ;
  un contre-emploi est joué à moitié et moins bien
- Onglet Profondeur (inspiré du Squad Planner de FM et du Team Report d'EHM) : toute
  l'organisation (LNH, club-école, espoirs) en trois vues — patinoire (une carte par position,
  ordre de l'alignement réel, compteur de joueurs LNH en santé), tableau par position classé
  par cote, et rapport d'équipe (besoins, meneurs par catégorie, meilleurs espoirs, infirmerie)
- Gestion du joueur dans son profil : rappel, renvoi au club-école ou ballottage, LTIR, nouveau
  contrat, rachat, réclamation au ballottage, offre à un agent libre et repêchage se font dans
  le volet « Gestion du joueur » (les listes n'ont plus de boutons à côté des joueurs)
- Planificateur tactique (onglet Trios, à la Football Manager) : schéma de la patinoire à
  gauche, tableau Poste / Rôle / Aptitude / Joueur à droite, réservistes en bas. On glisse un
  joueur sur un poste (ou clic-clic) ; un joueur déjà placé échange sa place. Trois vues :
  égalité numérique, avantage numérique, désavantage numérique
- Unités spéciales (`engine/specialTeams.js`) : deux unités d'AN (62 % / 38 % du temps) et de DN
  (55 % / 45 %). Systèmes d'AN : 1-3-1, parapluie, surcharge côté fort, 2-1-2 ; de DN : boîte,
  losange, triangle + 1, pression agressive. Chaque poste (quart-arrière, tireur sur réception,
  écran devant le filet, chasseur…) a son profil d'attributs ; l'adéquation de l'unité module
  tirs, qualité des chances et buts en infériorité (type « SH », pastille DN au sommaire)
- Systèmes de jeu (`engine/strategy.js`, d'après le guide « Stratégies NHL et profils de
  joueurs ») : 5 phases (zone défensive, sortie de zone, zone offensive, échec avant, repli
  défensif) × 5 systèmes. Chaque système décrit le profil qui lui convient ou non ; l'adéquation
  de l'effectif (attributs pondérés par groupe — défenseurs, centres, ailiers… — et par temps de
  glace) module ses effets sur le volume et la qualité des tirs pour/contre et les punitions.
  Un système mal adapté peut se retourner contre l'équipe. Onglet Stratégie : adéquation de
  chaque système, meilleur choix, effets chiffrés, joueurs les mieux et les moins adaptés,
  effet combiné ; plus les curseurs de mentalité
- Auto-optimisation (meilleures lignes, meilleure stratégie, meilleur alignement spécial)

**Saison (modèle LNH)**
- Calendrier daté (`engine/calendar.js`) : premier match le 7 octobre, un tour tous les 3 jours,
  date limite des échanges le 1er vendredi de mars, séries un jour sur deux, repêchage le
  24 juin, agents libres le 1er juillet, nouvelle saison en octobre. Rapport de développement
  et primes automatiques au début de chaque mois
- Échanges et signatures d'agents libres gelés de la date limite jusqu'au 1er juillet
  (prolongations de contrat toujours permises)
- Classement LNH (`engine/standings.js`) : V 2 pts, DP (défaite en prolongation ou tirs de
  barrage) 1 pt, D 0 ; départage points, % de points, VR, VRP, victoires, différentiel.
  Vues division, équipes repêchées (wild card) et ligue ; fiche domicile/extérieur,
  10 derniers matchs, séquence ; palmarès des saisons
- Séries éliminatoires (`engine/playoffs.js`) : 3 premiers de chaque division + 2 équipes
  repêchées par association, tableau fixe de la LNH, séries 4 de 7 (2-2-1-1-1), prolongation
  sans tirs de barrage, jusqu'à la Coupe Stanley. Tes matchs de séries peuvent se jouer en direct
- Repêchage (`engine/draft.js`) : 7 rondes, ordre selon le classement (hors séries d'abord,
  puis par ronde d'élimination, champion en dernier). Loterie LNH (`runDraftLottery`) :
  16 équipes, 2 tirages, chances de 18,5 % à 0,5 %, montée maximale de 10 rangs (une équipe
  tirée trop loin monte de 10 rangs et le choix revient au pire dossier restant). Une équipe
  qui a gagné 2 loteries en 5 ans est exclue des tirages. Classement des
  espoirs selon ton dépisteur, rapport de dépistage possible sur chaque espoir, choix
  automatiques des autres équipes. Les repêchés vont au club-école (contrat 3 ans, 950 k$)
- 1er juillet (`engine/offseason.js`) : contrats avancés d'une saison, contrats échus →
  agents libres (l'ordinateur réengage une partie des siens), les autres équipes comblent
  leurs besoins par position. Nouvelle saison : tout le monde vieillit d'un an (déclin après
  33 ans), nouveau calendrier, statistiques archivées dans la carrière de chaque joueur

- Statistiques des séries cumulées à part (onglet Statistiques : saison régulière / séries,
  buts gagnants) et archivées dans la carrière (S = saison, SÉ = séries)
- Plafond salarial (`engine/cap.js`) : 104 M$ en 2026-2027, 113,5 M$ en 2027-2028 (annoncés),
  puis +5 %/an (hypothèse) ; plancher ≈ 74 % ; seul l'alignement LNH compte. Échanges
  (des deux côtés), offres, prolongations et rappels refusés s'ils font dépasser le plafond
  (une équipe au-dessus peut seulement réduire). Maximum 23 joueurs dans l'alignement.
  L'ordinateur signe ses agents libres sous le plafond
- Rachats de contrat (entre la fin des séries et le 1er juillet) : 2/3 du salaire restant
  (1/3 avant 26 ans), étalé sur le double des années restantes ; le joueur devient agent
  libre et le paiement annuel compte en cap mort (`buyoutTerms`)
- Rétention de salaire dans les échanges : jusqu'à 50 %, 3 contrats retenus à la fois ; la
  part retenue reste en cap mort jusqu'à la fin du contrat. Le cap mort est aussi payé dans
  les finances. Liste du cap mort dans l'onglet Contrats
- Blessures (`engine/injuries.js`) : environ 1 blessure par équipe tous les 6 matchs, surtout
  au jour le jour, parfois des semaines ou des mois ; les blessés sont remplacés dans les
  trios par le meilleur disponible (saison, séries et direct). Infirmerie dans Profondeur
- LTIR : un joueur absent 24 jours et plus peut y être placé ; sa place est libérée et son
  salaire devient un allègement qui permet de dépasser le plafond jusqu'à son retour
- Ballottage (`engine/waivers.js`) : l'exemption suit la table de la convention LNH selon
  l'âge à la signature du premier contrat (ex. signé à 18-20 ans : 3 saisons ou 160 matchs ;
  25 ans et plus : aucune exemption en pratique). Un joueur non exempté renvoyé au
  club-école passe 24 heures au ballottage ; les équipes peuvent le
  réclamer avec son contrat, priorité au pire classement. L'ordinateur place ses joueurs en
  trop (au-delà de 23) et fait des mouvements d'effectif chaque mois ; tu peux les réclamer
  (onglet Transactions)

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
- Joueurs cliquables partout (composant `PlayerLink`) : alignement, trios (double-clic),
  profondeur, statistiques, feuille de match, sommaire des buts (buteur et passeurs),
  visionneur de match, échanges, agents libres, contrats, rapport de progression, et liens
  « Profils » dans les messages qui citent des joueurs
- Visionneur de match animé 2D (rejeu du résultat déjà simulé, pas une physique en direct)
- Mode "Sim en direct" avec horloge de période, sommaire de buts et stats en temps réel
- Filtres et tri sur presque tous les tableaux (division, équipe, colonnes)

## Ce qui reste incomplet ou en cours

1. **16 équipes** (Centrale + Pacifique) sans vrais joueurs — voir section suivante.
2. **Règles simplifiées** : rachats calculés pour des salaires constants ; l'âge de
   signature des joueurs des alignements de départ est estimé ; pas de joueurs blessés
   en séries remis en LTIR hors saison, ni de clauses de non-mouvement ou de primes.
3. Quelques approximations assumées : +/- approximatif (pas de simulation ligne par ligne
   réelle), côtés gauche/droite des joueurs réels assignés en alternance (pas vérifiés un par
   un), plusieurs numéros de chandail/contrats de joueurs récemment échangés approximatifs.

## Personnalisation (façon FM / EHM)

Accessible depuis l'écran de choix d'équipe (bouton **Personnalisation**) ou l'onglet du même
nom en cours de partie. Tout est conservé dans le navigateur (IndexedDB, `src/custom/`).

- **Base de données** : importe tes propres alignements. Formats acceptés : le fichier exporté
  par le jeu, ou le JSON/CSV de `scripts/fetch_nhl_rosters.py`. « Exporter la base actuelle »
  produit un JSON complet (joueurs, attributs, potentiel, contrats, infos d'équipe) à modifier
  dans un éditeur de texte puis réimporter. Les équipes absentes du fichier gardent leur
  alignement par défaut. Une nouvelle base s'applique à la nouvelle partie.
- **Équipes** : nom, ville et couleur, appliqués tout de suite.
- **Logos** : un par équipe, ou en lot avec des fichiers nommés `MTL.png`, `TOR.svg`...
- **Facepack** : ajout de photos en lot ou d'un dossier entier. Chaque fichier est nommé
  d'après l'identifiant LNH (`8478402.png`) ou le nom du joueur (`connor_mcdavid.png`,
  `Connor McDavid.jpg`). Une photo peut aussi être choisie depuis le profil d'un joueur. Les
  photos s'affichent dans le profil et l'alignement, et sont réduites à 160 px.

## Importer les vrais alignements (API LNH)

L'API de la LNH n'est pas accessible depuis Claude Code, donc la récupération se fait sur ton
ordinateur :

```bash
pip install requests pandas
python scripts/fetch_nhl_rosters.py        # ~10 min : alignements + stats LNH des 2 dernières saisons
node scripts/import-nhl-rosters.mjs alignement_complet_nhl.json         # équipes sans alignement fait main
node scripts/import-nhl-rosters.mjs alignement_complet_nhl.json --all   # ou remplacer les 32 équipes
```

L'importateur écrit `src/data/rosters/nhl-import.json`, lu par `REAL_ROSTERS`. La conversion
(`src/data/nhlImport.js`) produit :
- la position réelle, et le côté des défenseurs selon leur tir (fini l'alternance) ;
- l'âge, la nationalité, la taille, le poids et la main de tir réels ;
- des attributs dérivés des stats : points, buts et passes par match, tirs, temps de glace,
  +/-, punitions, poids, % de mises au jeu ; pour les gardiens, % d'arrêts et moyenne ;
- une échelle calibrée sur les alignements faits à la main (vérifiée dans
  `tests/nhlImport.test.js`).

Les joueurs avec moins de 10 matchs LNH reçoivent un profil neutre d'espoir. L'API ne donne
pas les contrats : ils sont générés, comme avant.

## Notes techniques

- **Données de joueurs** : fournir un CSV ou un JSON (nom, position, âge, stats, contrat) reste
  la façon la plus rapide d'ajouter les 16 équipes manquantes. La conversion en attributs est
  rapide, alors que chercher chaque joueur sur le web coûte cher.
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
| `createScoutReport`, `scoutingDelay` | `engine/scouting.js` | Rapport estimé selon la cote du dépisteur, délai de la mission |
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

1. Ajouter les 16 équipes des divisions Centrale et Pacifique (voir « Ce qui reste incomplet », point 1).
