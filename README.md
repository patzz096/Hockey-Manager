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
      atlantique.js, metropolitaine.js, centrale.js, pacifique.js, cascades.js (inutilisé)
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
    match/                 feuille de match, sim en direct, sommaire des buts
tests/engine.test.js       tests du moteur
```

## Ce qui est fait

**Ligue et équipes**
- 32 vraies équipes LNH (noms, couleurs, division, capacité réelle de l'aréna)
- Alignements réels pour les **32 équipes** (Atlantique, Métropolitaine, Centrale, Pacifique —
  `src/data/rosters/atlantique.js`, `metropolitaine.js`, `centrale.js`, `pacifique.js`), avec
  attributs projetés à partir de vraies stats/contrats connus (approximatifs pour certains
  joueurs, en particulier les mouvements les plus récents — un import via l'API LNH reste plus
  précis, voir « Importer les vrais alignements »).
- Agents libres réels non signés (`src/data/freeAgents.js` `REAL_FREE_AGENTS`, classés par points
  de la dernière saison connue) ajoutés au marché des joueurs autonomes au démarrage, en plus des
  agents libres générés (`engine/players.js` `buildRealFreeAgents`) ; même mise en garde que les
  alignements d'équipe (approximatif, écrit de mémoire).
- Calendrier aller-retour complet (chaque équipe affronte toutes les autres, domicile/visiteur)
- Onglet **Accueil** (`components/HomeDashboard.jsx`), premier onglet et page d'atterrissage par
  défaut : dossier et rang de ton équipe, classement de sa division (avec raccourci vers le
  classement complet), résultats récents (mis à jour au fil de la simulation, victoire/défaite/
  défaite en prolongation ou tirs de barrage, adversaire, date, pointage) et meneurs au pointage
  de la ligue (avec raccourci vers les statistiques complètes) — un coup d'œil sans naviguer
  entre plusieurs onglets.

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
- Centre de dépistage (onglet Dépistage, à la FM24, `engine/scoutingZones.js`) : 9 zones à couvrir
  (Québec, Ontario, Ouest, États-Unis, Suède, Finlande, Russie, Europe centrale, professionnels).
  Équipe de dépistage : 2 dépisteurs en chef + jusqu'à 6 en renfort (marché, salaire dans les
  dépenses). Chaque dépisteur part en mission : zone ou une seule ligue, recherche générale / par
  position / par rôle, cible (cuvée ou tous les joueurs), durée (2 semaines à 3 mois, ou continue).
  Frais hebdomadaires selon l'étendue, la distance port d'attache → zone et le niveau du dépisteur.
  La couverture monte chaque semaine et les rapports sont notés A / B / C (suggestions + messagerie)
- Liste de repêchage : cuvée connue toute la saison, ajout depuis le profil, ordre par
  glisser-déposer ; le jour du repêchage, « Repêcher le n° 1 de ma liste » et choix auto selon la liste
- Ligues mineures (`engine/minorLeagues.js`) : LAH, LHJMQ, OHL, WHL, NCAA, USHL, SHL, J20, Liiga,
  U20, KHL, MHL, Extraliga, NL, DEL. Simulation rapide et déterministe des statistiques des espoirs
  et du club-école, progressive avec le calendrier, historique dans le profil
- Onglet Profondeur (inspiré du Squad Planner de FM et du Team Report d'EHM) : toute
  l'organisation (LNH, club-école, espoirs) en trois vues — patinoire (une carte par position,
  ordre de l'alignement réel, compteur de joueurs LNH en santé), tableau par position classé
  par cote, et rapport d'équipe (besoins, meneurs par catégorie, meilleurs espoirs, infirmerie)
- Contrats LNH (`engine/contracts.js`) : valeur marchande calibrée sur les vrais contrats du jeu
  (≈ 3,2 M$ à une cote de 62, 10,3 M$ à 68, 13,2 M$ à 70, maximum 20 % du plafond, minimum 850 k$ en 2026-27) ;
  contrats d'entrée selon le rang au repêchage (durée selon l'âge, primes de l'annexe A pour les
  1ers tours) ; un ou deux volets (salaire LAH, enfouissement au-delà de minimum + 375 k$) ; primes
  de rendement (recrues, 35 ans et plus sur un an) comptées sur le plafond et versées en fin de
  saison. Intérêt du joueur : équipe gagnante, proximité de sa région d'origine, rôle et temps de
  glace, attachement ; il fixe la demande de l'agent, la chance d'acceptation et la contre-offre
- Pack de personnalisation (`src/custom/pack.js`, `docs/pack-personnalisation.md`) : un seul fichier
  .json partageable (alignements, contrats en M$, attributs, équipes, logos, facepack). Export et
  import dans l'onglet Personnalisation, export CSV pour tableur (Excel en français), et éditeur
  autonome hors jeu (`npm run build:editor` → `dist/editeur-pack.html`)
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
- Calendrier daté (`engine/calendar.js`) : présaison à partir du 1er septembre, premier match qui
  compte le 7 octobre, un tour tous les 3 jours, date limite des échanges le 1er vendredi de
  mars, séries un jour sur deux, repêchage le 24 juin, agents libres le 1er juillet, nouvelle
  saison en octobre. Rapport de développement et primes automatiques au début de chaque mois
- Matchs préparatoires (présaison, `engine/league.js` buildPreseasonSchedule) : 6 matchs hors-
  concours par équipe entre le 1er septembre et le 7 octobre — le temps de signer ton personnel
  et de régler ton alignement avant que ça compte pour vrai. Exclus du classement et des
  statistiques de la saison régulière (`exhibition: true`), mais alimentent des **cotes de
  présaison** séparées (onglet Statistiques → Présaison, `engine/stats.js` ratingsOf) : rendement
  sur 10 (offensif/défensif/général) déduit des statistiques accumulées, 5/10 = rendement moyen.
  « Simuler la présaison » (le bouton habituel « Simuler la saison », relabellé) ne simule que le
  groupe en cours (présaison ou saison régulière), pour ne pas enchaîner les deux d'un coup et
  garder la fenêtre de préparation utile.
- La même cote sur 10 (offensif/défensif/général, `engine/stats.js` skaterRating/
  goalieRatingFromSavePct) est aussi affichée **par match** dans le sommaire d'un match joué
  (onglet Calendrier, ligne dépliée) : trois colonnes dans le tableau des statistiques
  individuelles de chaque équipe, et une cote de gardien basée sur son vrai % d'arrêts du match
  (plus précis que la victoire/défaite seule).
- Échanges et signatures d'agents libres gelés de la date limite jusqu'au 1er juillet
  (prolongations de contrat toujours permises)
- Classement LNH (`engine/standings.js`) : V 2 pts, DP (défaite en prolongation ou tirs de
  barrage) 1 pt, D 0 ; départage points, % de points, VR, VRP, victoires, différentiel.
  Vues division, équipes repêchées (wild card) et ligue ; fiche domicile/extérieur,
  10 derniers matchs, séquence ; palmarès des saisons
- Séries éliminatoires (`engine/playoffs.js`) : 3 premiers de chaque division + 2 équipes
  repêchées par association, tableau fixe de la LNH, séries 4 de 7 (2-2-1-1-1), prolongation
  sans tirs de barrage, jusqu'à la Coupe Stanley. Tes matchs de séries peuvent se jouer en direct.
  Ta série en cours s'ouvre automatiquement dans l'onglet Séries (avec la feuille de match de
  chaque match déjà joué) : plus besoin de dérouler la série toi-même pour la trouver
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
- Équipe de la semaine (onglet Statistiques, façon FM) : 3 attaquants, 2 défenseurs et un
  gardien, meilleurs performeurs (points, puis % d'arrêts pour le gardien) des 7 derniers
  jours de calendrier (`engine/stats.js` teamOfTheWeek)
- Plafond salarial (`engine/cap.js`) : 104 M$ en 2026-2027, 113,5 M$ en 2027-2028 (annoncés),
  puis +5 %/an (hypothèse) ; plancher ≈ 74 % ; seul l'alignement LNH compte. Échanges
  (des deux côtés), offres, prolongations et rappels refusés s'ils font dépasser le plafond
  (une équipe au-dessus peut seulement réduire). Maximum 23 joueurs dans l'alignement.
  L'ordinateur signe ses agents libres sous le plafond
- Marché vivant en saison régulière, pas seulement le 1er juillet (`engine/offseason.js`
  aiSignFreeAgentsInSeason/aiTradesAmongCpu, appelés chaque mois tant que les échanges/
  signatures sont ouverts) : quelques équipes de l'ordinateur signent un agent libre pour
  combler un trou de position, et quelques paires d'équipes s'échangent un joueur chacune pour
  la même raison (jamais ta propre équipe, jamais leur meilleur joueur au poste) — annoncé dans
  la messagerie (« Mouvements autour de la ligue »)
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
- Clic droit sur un joueur (façon FM) : menu contextuel avec voir le profil, comparer avec un
  autre joueur (attribut par attribut, deux patineurs ou deux gardiens entre eux), les actions
  déjà offertes par son profil (rappel/renvoi, ballottage, LTIR, contrat, rachat, réclamation,
  repêchage — celles à confirmation ouvrent le profil plutôt que d'agir sans confirmer), nommer
  capitaine/adjoint (badge C/A, purement honorifique) et mettre/retirer du marché des échanges
  (liste visible en tête de l'onglet Transactions, organisationnel — n'affecte pas les décisions
  de l'IA). Disponible partout où un nom de joueur est cliquable via `PlayerLink` : alignement,
  sommaire de match (onglet Calendrier), Contrats, Rôles et Stratégie.
- Personnel : directeur général (négociation de contrat, échanges, cohésion, développement),
  entraîneur-chef, adjoints, entraîneur physique, dépisteurs amateur/pro, directeur des
  finances, directeur des opérations hockey — chacun avec une cote en étoiles (pas de note
  générale chiffrée à côté, contrairement aux joueurs dépistés) et option délégation (contrôle
  manuel ou IA). Cliquer un nom (en poste ou candidat du marché) ouvre son profil, en pleine
  page comme celui d'un joueur. Le directeur des opérations hockey embauche l'ensemble du
  personnel hockey (tout sauf les finances, et lui-même) quand délégué à chaque avancement de
  mois, instantanément
  - « Personnel en poste » et « Marché des candidats » en tableau clair façon FM/EHM (nom,
    nationalité avec drapeau, âge, poste, cote, salaire) plutôt qu'une grille de cartes. Chaque
    candidat a maintenant un âge et une nationalité (`engine/staff.js`), et le bassin de
    candidats est large (24 à l'ouverture, 14 au rafraîchissement) pour varier les profils
    plutôt que retomber toujours sur les mêmes têtes
  - Dépisteurs en renfort (onglet Dépistage, `engine/scoutingZones.js` scoutRoster) : en plus
    des deux dépisteurs en chef (personnel), jusqu'à 12 dépisteurs supplémentaires peuvent être
    engagés en même temps (`MAX_EXTRA_SCOUTS`), chacun avec sa propre mission (zone, recherche,
    cible, durée) — le marché de ces dépisteurs a aussi une nationalité/âge et un bassin élargi
    (20 candidats à l'ouverture et au rafraîchissement)
  - Choisir qui dépiste un joueur précis (onglet « Dépistage » du profil joueur,
    `engine/scouting.js` scoutOptions) : la demande de dépistage propose désormais tous les
    dépisteurs disponibles (les deux en chef, plus tous ceux en renfort), pas seulement le
    dépisteur en chef assigné automatiquement selon l'âge du joueur — chacun affiché avec sa
    cote pour ce joueur (avec la pénalité de -15 % hors spécialité), et le délai de mission qui en
    découle. Avec un seul dépisteur disponible, l'assignation reste automatique (rien à choisir).
  - Cible « Agents libres seulement » pour la mission de zone du dépisteur pro/en renfort
    (`ScoutingCenter` MissionEditor, `App.jsx` candidatesOf) : corrige les agents libres qui
    n'étaient à peu près jamais dépistés par la mission générale « tous les joueurs » — un bassin
    partagé avec les effectifs des 31 autres équipes, où un agent libre (presque toujours de
    calibre inférieur, puisque personne n'a voulu de lui) se fait éclipser par des centaines de
    joueurs de la LNH bien plus intéressants dans le tirage pondéré par la valeur du joueur (voir
    `weeklyScouting`). Cette cible donne aux agents libres un bassin dédié, sans concurrence.
  - 11 critères de valeur communs à **tout** le personnel (`engine/staff.js`
    STAFF_ATTR_LABELS, échelle interne 20-99 affichée sur /20 comme les joueurs) : coaching
    gardien, coaching attaquant, coaching défenseur, évaluation de l'aptitude, évaluation du
    potentiel, physiothérapie, développement des jeunes joueurs, motivation, gestion d'équipe,
    négociation, finance. Chaque candidat porte les 11 critères dès sa génération, quel que soit
    le poste visé — un même profil pourrait donc convenir à plus d'un poste — mais reste
    spécialisé dans le poste visé : les critères pertinents pour ce poste sont tirés dans une
    plage normale (40-95/99), les autres nettement plus bas (15-50/99), pour éviter un
    entraîneur-chef aussi doué en finance qu'en coaching. Les salaires de base par poste
    (STAFF_BASE_SALARY) sont calés sur la réalité de la LNH plutôt que sur l'échelle des joueurs :
    DG et entraîneur-chef bien payés (jusqu'à quelques millions pour les meilleurs), personnel de
    soutien (adjoints, dépisteurs, entraîneur physique, communications) nettement moins, de la
    centaine de milliers à quelques centaines de milliers par saison. La **cote générale**
    d'un candidat (celle affichée en étoiles) est la moyenne des critères pertinents pour le
    poste visé (STAFF_ATTRS : ex. l'entraîneur-chef sur coaching ×3 + développement des jeunes +
    motivation + gestion d'équipe, un dépisteur sur évaluation aptitude/potentiel, le directeur
    des finances sur finance + négociation) ; seul le directeur des communications, hors de ces
    11 critères (relations médias, sans équivalent ici), garde une cote générale non détaillée.
    Le développement des jeunes joueurs (entraîneur-chef/adjoints/physique), la précision/
    rapidité des rapports de dépistage, et les primes de performance mensuelles (finances selon
    le profit, entraîneurs selon les victoires, dépisteur pro selon le développement des jeunes)
    utilisent directement cette cote générale
  - Dépisteurs asymétriques (`PRIMARY_KEY`) : le dépisteur professionnel est spécialisé en
    évaluation de l'**aptitude** (il juge des joueurs déjà actifs), l'amateur en évaluation du
    **potentiel** (il juge des espoirs) — chacun reste correct, mais nettement moins bon, sur
    l'autre dimension.
  - L'entraîneur-chef influence directement le jeu : ses critères coaching attaquant/défenseur/
    gardien et développement des jeunes alimentent la progression des joueurs (comme avant), et
    son critère **Gestion d'équipe** conditionne la fiabilité des propositions automatiques
    (« Alignement automatique », « Meilleures unités », « Meilleur système pour mon effectif ») :
    avec une gestion d'équipe faible (ou aucun entraîneur-chef en poste), ces boutons peuvent
    proposer un alignement ou une stratégie qui n'est pas réellement le meilleur choix, façon
    « ce n'est pas parce qu'un système est marqué meilleur choix qu'un entraîneur médiocre va le
    retenir » (`engine/lines.js` buildLines, `engine/strategy.js` bestStrategy, uniquement pour
    ton équipe : les 31 autres gardent un alignement toujours optimal)
  - Embauche manuelle façon négociation de contrat de joueur (`engine/staff.js`
    evaluateStaffOffer) : une offre de salaire n'est pas acceptée sur-le-champ, le candidat
    répond après un délai de 1 à 3 jours, avec une probabilité d'acceptation qui dépend de
    l'écart entre l'offre et son salaire demandé ; un refus donne une contre-proposition, et
    trop de refus d'affilée (3) le font se retirer de toute négociation pour le reste de la
    saison (même mécanique que `MAX_OFFER_ATTEMPTS` côté joueurs)
- Entraînement façon FM24 (`engine/training.js`, onglet dédié « Entraînement », séparé de
  Personnel) : condition physique par
  joueur (récupère avec le repos, chute avec les matchs joués, atténuée par l'endurance —
  module les cotes d'équipe via `conditionFactor`) et cohésion tactique de ton équipe (chute
  quand tu changes de système, remonte à l'entraînement, détermine la part de l'adéquation à
  ta stratégie réellement réalisée en match). Quatre programmes hebdomadaires (équilibré,
  préparation physique, travail tactique, repos), délégable comme les finances et
  les opérations hockey. L'entraîneur physique accélère la récupération de la condition,
  contribue au développement des joueurs et à la progression de la cohésion. En sim en
  direct, l'énergie de chaque joueur (initialisée à sa condition) baisse avec son temps de
  glace et se voit sur les trios/paires du sélecteur de mise en jeu (« état de forme ») —
  de quoi rendre coûteux d'envoyer toujours le trio no 1. Séances planifiables directement
  dans l'onglet Entraînement, jusqu'à 2 par jour (matin et après-midi) — un jour de match
  n'en permet qu'une, le matin, puisque le match compte pour l'autre case : le programme
  par défaut ne s'applique que les semaines sans séance planifiée ; en délégué, l'IA choisit
  et affiche ses propres séances chaque jour
- Calendrier mensuel pour ton équipe (`MonthlyCalendar`, onglet **Entraînement**) : matchs
  (pour contexte) et séances d'entraînement du mois sur une grille classique (case
  matin/après-midi par jour), navigation mois par mois, séance planifiée ou annulée d'un clic
- Calendrier de la ligue (onglet **Calendrier**) réaliste façon LNH : les 32 équipes ne
  jouent jamais toutes le même soir — chaque ronde du calendrier aller-retour est étalée sur
  quelques jours consécutifs (`slot`/`gameDay`, `src/engine/calendar.js` et `league.js`).
  Vue « Calendrier complet » et vue « Mon équipe seulement » affichent la même liste groupée
  par jour, simplement filtrée à ton équipe. Le bouton **Simuler la journée** ne simule que
  les matchs de la prochaine journée où il y en a (peut être un sous-ensemble d'une ronde)
- Finances : billetterie à 3 paliers, stationnement, 10 items de concession, marchandise
  itemisée (chandail, casquette, t-shirt, souvenir — `engine/finance.js`), installations
  améliorables, bilan détaillé par match local (billetterie, concessions, marchandise,
  stationnement, contrat de diffusion, dépenses)
- Contrat de diffusion télé (`engine/finance.js` `negotiateTvDeal`) : revenu fixe par saison
  (versé au prorata de chaque match local), renégocié tous les 4 ans en saison morte selon
  l'engagement des partisans et le dossier de l'équipe — une équipe populaire et gagnante
  décroche un bien meilleur contrat. Directeur des communications (nouveau rôle de personnel,
  auto-embauché par le directeur des opérations hockey délégué) : améliore la négociation du
  contrat de diffusion, l'affluence et la progression de l'engagement des partisans
- Note d'expérience client (0-100) : reflète tes prix (billets, concessions, marchandise) par
  rapport à leur prix de base et le niveau de tes installations — instantanée, se dégrade vite
  si tu gonfles les prix
- Note d'engagement des partisans (0-100, évolue lentement d'un mois à l'autre selon
  l'affluence récente, les victoires et l'investissement marketing) : détermine les ventes de
  marchandise et la valeur du prochain contrat de diffusion
- Transactions : échanges, agents libres, contrats, page de profondeur (LNH/LAH/prospects)
  avec rappels/renvois.
  - Onglet Échanges : espace sous le plafond des deux équipes et rang au classement affichés
    d'un coup d'œil (avec écusson), filtre par position (attaquants/défenseurs/gardiens) sur
    chaque alignement, âge et contrat (salaire × années) visibles par joueur en plus de la cote,
    et ajout rapide à l'offre pour tes joueurs déjà mis sur le marché des échanges
  - Négociation de contrat façon FM24 (`engine/contracts.js`) :
  - Offre envoyée à l'agent, réponse après un délai de 1 à 3 jours (`business` pending
    offers, résolue dans `advanceDays`) plutôt qu'instantanée — un message confirme l'envoi,
    un second la décision une fois le délai écoulé.
  - Montant et durée ajustables au curseur ou saisis directement au clavier (`ContractOfferModal`) :
    le champ chiffré affiche et accepte le montant complet en dollars (ex. `2850000`), avec
    l'équivalent formaté juste à côté, plutôt qu'un montant en milliers peu lisible. Même
    principe pour l'offre de salaire à un candidat du personnel (`StaffProfileModal`).
  - Attentes du joueur estimées par ton directeur général plutôt que révélées telles quelles :
    plage floue autour de la vraie demande, resserrée selon le critère **Négociation** du DG
    (`gmEstimate`, plus pertinent ici que sa cote générale qui mélange aussi finance/gestion
    d'équipe/motivation) — sans DG en poste, estimation à l'aveugle (plage maximale). Même
    principe pour évaluer un échange (`TransactionsCenter`, valeur envoyée/reçue et verdict favorable/équilibré/
    défavorable selon le critère Négociation du DG).
  - La **chance d'acceptation affichée en direct** dans l'offre de contrat n'est plus le vrai
    calcul exact : elle est brouillée selon le critère Négociation du DG (même principe que
    l'estimation ci-dessus, écart stable pour un joueur donné) — un DG doué lit la situation avec
    précision, un DG faible ou l'absence de DG peut te faire croire une offre plus ou moins
    solide qu'elle ne l'est vraiment (la vraie décision, elle, reste toujours calculée sur les
    valeurs exactes). Le volet deux volets affiche aussi une suggestion de salaire LAH du
    directeur des finances, resserrée selon son critère **Finance**.
  - L'équipe adverse refuse une proposition trop favorable pour toi (`engine/trades.js`
    evaluateTradeForCpu) : elle évalue toujours sur les vraies valeurs de son effectif et du
    tien (sans le flou du dépistage qui s'applique à toi), avec la même échelle de valeur (cote
    actuelle + supplément de potentiel pour les jeunes + surplus/déficit de contrat par rapport à
    la valeur marchande du joueur, voir `tradeValue`) que l'aperçu affiché avant de proposer
    l'échange. Refus dès qu'elle y perdrait de la valeur nette (± 3 % de variation aléatoire,
    pour ne pas être un seuil parfaitement net), ajusté selon le critère **Négociation** de ton
    DG : un bon négociateur obtient un rabais (l'ordinateur accepte de recevoir un peu moins de
    valeur que ce qu'il envoie), un DG faible doit au contraire surpayer pour faire accepter le
    même échange. Refus aussi si elle cède, au-dessus d'un seuil de qualité, un joueur nettement
    plus valable (plus de 15 %) qu'aucune pièce reçue en retour — pas seulement son meilleur
    joueur envoyé contre le meilleur reçu : CHAQUE bon joueur envoyé doit trouver une pièce
    comparable côté reçu (appariement du plus valable au moins valable, chaque pièce reçue
    comptant une seule fois), pour empêcher de consolider deux bons joueurs contre une pile de
    pièces de profondeur qui, additionnées, atteint la même valeur nominale totale. Réponse « typique »
    variée (façon DG
    réel) à l'acceptation comme au refus (`engine/trades.js` tradeResponseLine), annoncée par
    message du DG de l'équipe adverse ; un refus explique aussi la raison (valeur insuffisante
    ou joueur trop précieux cédé)
  - Choix de repêchage échangeables (ronde + équipe d'origine, repêchage à venir seulement,
    `engine/draft.js` ownedPicks/pickKey, `pickTrades` dans App.jsx remis à zéro chaque nouvelle
    saison) : liste par ronde sous chaque alignement dans l'onglet Échanges, avec la valeur
    approximative du choix (`engine/trades.js` pickValue, décroissante selon la ronde) et le nom
    de l'équipe d'origine quand le choix a déjà changé de mains ; entre dans l'évaluation du DG et
    dans celle de l'IA adverse au même titre qu'un joueur. Une fois échangé, le choix apparaît
    dans le tableau « Tes choix » du Repêchage avec son équipe d'origine.
  - Trop d'offres refusées d'affilée pour un même joueur font monter ses attentes
    (`frustrationMultiplier`) puis, au-delà de 3 refus, il refuse toute négociation pour le
    reste de la saison (`MAX_OFFER_ATTEMPTS`, remis à zéro en début de saison).
  - Message de refus détaillé : raison la plus déterminante en premier (salaire trop bas par
    rapport à ses attentes, durée qui ne correspond pas, refus d'un contrat à deux volets pour un
    joueur de calibre LNH), puis les facteurs d'intérêt encore défavorables (proximité, rôle,
    etc.) — plutôt qu'un refus sans explication. Même principe pour une offre de salaire refusée
    par un candidat du personnel (`StaffProfileModal`).
  - Prime à la signature désormais comptée sur le plafond salarial, étalée sur la durée
    d'origine du contrat (`capHit`/`payroll`, `contract.originalYears`).
  - Primes de rendement façon FM24, permises sur n'importe quel contrat (maximum plus élevé
    pour un contrat d'entrée ou 35 ans et plus sur un an) : buts, passes, points, +/-, matchs
    joués, victoires pour les gardiens (`BONUS_KINDS`), avec des suggestions rapides
    préremplies (ex. 15 buts et plus, 50 points et plus, 40 victoires et plus) ; payées en fin
    de saison régulière selon les statistiques réellement atteintes
- Messagerie interne recevant tous les rapports (progression, finances, transactions, dépistage),
  avec un bouton « Tout marquer comme lu » quand des messages non lus s'accumulent
- Petit cadenas sur les onglets hors saison pour ce qu'ils proposent (Séries avant les
  séries, Repêchage hors saison morte, Transactions/Agents libres hors des fenêtres
  ouvertes) : l'onglet reste consultable, le badge prévient juste qu'il n'y a rien à y faire
  pour l'instant

**Interface**
- Onglet Alignement (`RosterTable`) en tableau dense façon FHM, une ligne par joueur : drapeau
  de nationalité, humeur (`engine/contracts.js` playerHappiness, déduite à la volée des mêmes
  facteurs que l'intérêt à signer — temps de glace/rôle, équipe gagnante, proximité de chez lui,
  attachement à l'équipe, puisqu'aucun moral persistant n'est stocké sur le joueur), % d'adéquation
  à son rôle assigné (`roleFit` + `roleOf`, coloré vert/or/rouge), en plus des cotes en étoiles,
  de la forme et du contrat désormais scindé en deux colonnes (salaire, durée + type de volet)
  plutôt qu'un texte long. Filtre **Actif (LNH)** / **Organisation complète (LNH+LAH)** pour voir
  aussi le club-école dans le même tableau.
  - Impacts de l'humeur : en plus de la négociation de contrat (déjà la même mécanique), un léger
    effet sur le rendement en match (`engine/simulation.js` moraleFactor, ± 5 % maximum selon
    l'humeur, appliqué seulement à ton équipe) et un risque de demande d'échange en cas de
    mécontentement prolongé (App.jsx monthlyTick : après 3 mois sous le seuil, le joueur demande
    à être échangé — un seul message tant qu'il reste mécontent).
- Joueurs cliquables partout (composant `PlayerLink`) : alignement, trios (double-clic),
  profondeur, statistiques, feuille de match, sommaire des buts (buteur et passeurs),
  échanges, agents libres, contrats, rapport de progression, et liens « Profils » dans les
  messages qui citent des joueurs
- Profil du personnel (`StaffProfileModal`) en pleine page ; profil joueur (`PlayerModal`) en
  fenêtre flottante compacte (comme à l'origine)
- Mode "Sim en direct" avec horloge de période, sommaire de buts et stats en temps réel
  (uniquement pour le prochain match à jouer — les matchs déjà joués n'ont qu'une feuille de
  match statique, pas de rejeu « en direct »)
- Sommaire des buts d'un match joué : chaque but est annoté du rang de la saison de son
  buteur (ex. « 12e but de la saison »), calculé chronologiquement selon le jour réel du match
  (`engine/stats.js` seasonGoalNumber, engine/calendar.js gameDay)
- Icône enveloppe (messagerie, avec pastille des non lus) juste à côté du nom de l'équipe en
  haut à gauche, plutôt qu'un onglet séparé dans la liste de navigation
- Choix du trio et de la paire de défense pour chaque mise au jeu, en sim en direct (bouton
  « Choisir le trio et la paire ») : avantage du dernier changement comme dans la vraie LNH — les
  visiteurs envoient toujours leur ligne en premier (visible), l'équipe locale réplique en
  dernier ; à l'étranger, la réplique des locaux reste cachée jusqu'au prochain arrêt.
  L'ordinateur adapte son choix à l'écart au score et au moment du match (trio offensif en
  retard, paire défensive en avance en fin de match). Le trio et la paire envoyés concentrent
  presque tout le temps de glace et les tirs de la mise au jeu (`engine/lines.js`, `lines.shift`,
  `engine/simulation.js` `aiPickShift`) — mais seulement pour une durée réaliste (1 minute) :
  si le prochain arrêt de jeu tarde, l'adjoint reprend un déploiement normal pour le reste du
  segment plutôt que de laisser ce trio seul sur la glace plusieurs minutes d'affilée
  (`App.jsx` `runLiveSegment`) ; le déploiement "auto" habituel reste disponible en un clic
- Filtres et tri sur presque tous les tableaux (division, équipe, colonnes)

## Ce qui reste incomplet ou en cours

1. **Règles simplifiées** : rachats calculés pour des salaires constants ; l'âge de
   signature des joueurs des alignements de départ est estimé ; pas de joueurs blessés
   en séries remis en LTIR hors saison, ni de clauses de non-mouvement ou de primes.
2. Quelques approximations assumées : +/- approximatif (pas de simulation ligne par ligne
   réelle), côtés gauche/droite des joueurs réels assignés en alternance (pas vérifiés un par
   un), plusieurs numéros de chandail/contrats de joueurs récemment échangés approximatifs —
   notamment pour la Centrale et le Pacifique (`centrale.js`/`pacifique.js`), écrits de mémoire
   plutôt qu'importés de l'API LNH ; un import (voir « Importer les vrais alignements ») reste
   la façon la plus fiable de les corriger.

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
  la façon la plus rapide de corriger ou rafraîchir un alignement (voir « Importer les vrais
  alignements »). La conversion en attributs est rapide, alors que chercher chaque joueur sur
  le web coûte cher.
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

1. Affiner les alignements Centrale/Pacifique avec un import réel (API LNH, voir « Importer les
   vrais alignements ») plutôt que les valeurs approximatives écrites de mémoire.
