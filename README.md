## Installation rapide

```bash
# cloner le projet si besoin
# git clone https://github.com/LeKyzzo/pokemoBackend.git
# cd pokemoBackend

npm install
```

Je garde un fichier `.env` à la racine pour mes variables (port HTTP et connexion PG). Ajuste les valeurs si ton environnement est différent.

## Préparer la base de données

Une fois PostgreSQL en route, crée la base et applique le schéma + les données de départ :

```bash
psql -U postgres -f sql/schema.sql
psql -U postgres -f sql/seed.sql
```

Adapte l'utilisateur ou la base si tu n'utilises pas les valeurs du `.env`.

## Lancer le projet

### Mode développement

```bash
npm run dev
```

`ts-node-dev` s'occupe de recharger l'API dès que je touche au code TypeScript.

### Build + exécution

```bash
npm run build
npm start
```

Le build balance le JavaScript transpilé dans `dist/` puis `npm start` lance le serveur Node sur le port défini dans `.env` (3000 par défaut).

## Arbo rapide

- `src/` : tout le code TypeScript (domain, routes, services)
- `sql/` : scripts SQL pour créer et remplir la base
- `public/` : contenu statique si besoin (optionnel pour l'API)

## À savoir

- L'API expose des routes REST basiques pour les Pokémon, les attaques et les combats.
- Comme d'habitude, pense à sécuriser ton `.env` si tu pousses le projet ailleurs.
- Si tu changes la structure des tables, n'oublie pas de regénérer un seed cohérent.

Voilà, tu as tout pour faire tourner mon backend Pokémon en deux minutes chrono.
