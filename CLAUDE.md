# Hockey GM

Jeu de gestion de hockey (React + Vite). Interface et commentaires en français.

- `npm test` (vitest), `npm run lint`, `npm run build:artifact` → `dist/index.html` autonome.
- `src/engine/` est de la logique pure, sans React : garder la simulation hors des composants.
- La simulation utilise `seededRandom`. Ne pas introduire `Math.random` dans `simulateGame` ou
  `initLeague`, sinon le déterminisme testé dans `tests/engine.test.js` est perdu.
- Nouvelles équipes réelles : un fichier par division dans `src/data/rosters/`, puis les
  enregistrer dans `REAL_ROSTERS` (`src/data/rosters/index.js`).
