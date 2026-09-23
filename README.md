# Hockey GM — Jeu de simulation de gestion de hockey

Prototype de jeu de gestion façon **Franchise Hockey Manager / Football Manager 24**, où le
joueur agit comme directeur général d'une équipe de la LNH (32 vraies équipes). Construit
comme un artefact React à fichier unique (`hockey_gm_prototype.jsx`), pensé pour être publié
via l'outil Artifact de Claude.ai.

## État actuel

Le fichier principal fait plusieurs milliers de lignes et contient **tout** : moteur de
simulation, génération de joueurs, données réelles de 16/32 équipes, et toute l'interface
(React, un seul fichier, pas de build step). C'est fonctionnel mais devenu lourd à éditer —
d'où la reprise dans Claude Code.

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

## Pour aller plus vite avec moins de données

Le fichier unique est le principal frein : chaque édition doit relire/chercher dans un bloc de
plusieurs milliers de lignes. Recommandé avant de continuer :

- **Séparer en modules** : `engine/` (simulation, génération de joueurs), `data/rosters/`
  (un fichier par équipe ou par division), `components/` (un fichier par écran/onglet),
  `App.jsx` (état global + orchestration)
- **Fournir les données de joueurs toi-même** plutôt que par recherche web équipe par équipe
  (CSV/JSON avec nom, position, âge, stats) — la conversion en attributs est rapide, la
  recherche web par joueur est ce qui coûte le plus cher
- Grouper plusieurs demandes liées dans un même message plutôt qu'une à la fois

## Fonctions clés à connaître (moteur)

| Fonction | Rôle |
|---|---|
| `initLeague()` | Construit les 32 équipes, agents libres, personnel, repêchage au démarrage |
| `buildRoster` / `buildRealRoster` | Génère un alignement procédural ou depuis des données réelles |
| `simulateGame` / `simulateChunk` | Simule un match complet ou une tranche de 5 min |
| `computeOvr`, `starsFor`, `attr20` | Conversion attributs internes (0-99) → cote → étoiles/  20 |
| `getScoutInfo` | Détermine si un joueur est "connu" et avec quelle qualité |
| `getStrategyMultipliers` / `STRATEGY_ENGINE` | Effet des stratégies selon le profil d'effectif |
| `computeGameFinance` | Revenus/dépenses d'un match local |

## Structure des données principales

```
player = { id, name, number, pos, age, nationality, attrs:{...}, ovr, potential,
           contract:{years,salary,noTrade}, draftPick, draftYear }
team   = { id, city, name, color, division, capacity, roster:[player], lines:{...} }
lines  = { forwards:[{LW,C,RW}x4], defense:[{LD,RD}x3], goalies:{starter,backup},
           pp:[5 ids], pk:[4 ids], strategy:{...}, mentality:{...} }
business = { cash, ticketTiers, facilities, parking, concessionItems, staff, delegation, log }
```

## Comment reprendre dans Claude Code

1. Récupère `hockey_gm_prototype.jsx` depuis cette conversation.
2. Demande à Claude Code de le scinder selon la structure suggérée ci-dessus avant d'ajouter
   de nouvelles fonctionnalités — ça réduira le coût de chaque édition future.
3. Priorité suggérée : terminer le délai de dépistage (section "incomplet" ci-dessus), puis
   le clic universel sur les joueurs, avant d'attaquer les équipes manquantes.
