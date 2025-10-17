import cors from 'cors';
import express, { NextFunction, Request, Response } from 'express';

import { query } from './db';

const app = express();

app.use(cors());
app.use(express.json());

const tableQueries: Record<string, string> = {
    trainers: 'SELECT * FROM poke.trainer ORDER BY id',
    pokemons: 'SELECT * FROM poke.pokemon ORDER BY id',
    attacks: 'SELECT * FROM poke.attack ORDER BY id',
    pokemon_attacks:
        'SELECT * FROM poke.pokemon_attack ORDER BY pokemon_id, attack_id',
    pokemon_attacks_view:
        'SELECT * FROM poke.v_pokemon_attacks ORDER BY pokemon_id, attack_name'
};

app.get('/api/database', async (_req, res, next) => {
    try {
        const snapshot: Record<string, unknown[]> = {};
        for (const [key, sql] of Object.entries(tableQueries)) {
            const { rows } = await query(sql);
            snapshot[key] = rows;
        }

        res.json(snapshot);
        return;
    } catch (error) {
        next(error);
    }
});

const htmlPage = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Pokémon DB Viewer</title>
  <style>
    :root {
      color-scheme: light dark;
      --bg: #f7f7fb;
      --fg: #212121;
      --accent: #ffcc00;
      --border: #d0d0e0;
    }

    @media (prefers-color-scheme: dark) {
      :root {
        --bg: #1c1c23;
        --fg: #f2f2f7;
        --border: #2f2f3a;
      }
    }

    body {
      margin: 0 auto;
      padding: 2rem 1.5rem 4rem;
      max-width: 1100px;
      font-family: 'Segoe UI', Roboto, sans-serif;
      background: var(--bg);
      color: var(--fg);
    }

    header {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    h1 {
      margin: 0;
      font-size: clamp(1.7rem, 3vw, 2.4rem);
    }

    button {
      background: var(--accent);
      border: none;
      border-radius: 0.75rem;
      padding: 0.65rem 1.2rem;
      font-weight: 600;
      color: #212121;
      cursor: pointer;
      box-shadow: 0 6px 14px rgba(0,0,0,0.08);
      transition: transform 0.15s ease, box-shadow 0.15s ease;
    }

    button:hover {
      transform: translateY(-1px);
      box-shadow: 0 10px 20px rgba(0,0,0,0.12);
    }

    section {
      margin-top: 2.5rem;
    }

    section h2 {
      margin-bottom: 0.75rem;
      font-size: 1.25rem;
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    section h2::before {
      content: '';
      display: inline-block;
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background: var(--accent);
      box-shadow: 0 0 0 4px rgba(255, 204, 0, 0.25);
    }

    .table-wrapper {
      overflow-x: auto;
      border: 1px solid var(--border);
      border-radius: 0.9rem;
      background: rgba(255,255,255,0.85);
      backdrop-filter: blur(12px);
      box-shadow: 0 18px 38px rgba(15, 23, 42, 0.12);
    }

    table {
      width: 100%;
      border-collapse: collapse;
      min-width: 500px;
    }

    thead {
      background: rgba(33, 150, 243, 0.08);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      font-size: 0.75rem;
    }

    th, td {
      padding: 0.9rem 1rem;
      border-bottom: 1px solid var(--border);
      text-align: left;
      vertical-align: top;
    }

    tbody tr:hover {
      background: rgba(255, 204, 0, 0.12);
    }

    .empty {
      font-style: italic;
      color: rgba(0,0,0,0.45);
      padding: 1rem;
    }

    pre {
      max-height: 400px;
      overflow: auto;
      padding: 1rem;
      border-radius: 0.75rem;
      background: rgba(0,0,0,0.85);
      color: #f5f5f5;
      font-size: 0.85rem;
    }
  </style>
</head>
<body>
  <header>
    <div>
      <h1>Explorateur de base Pokémon</h1>
      <p>Chargement direct depuis PostgreSQL avec votre configuration .env.</p>
    </div>
    <button id="refresh" type="button">Actualiser</button>
  </header>

  <main>
    <p>Chaque section ci-dessous reflète le contenu en temps réel des tables clés du schéma <code>poke</code>.</p>

    <section id="trainers">
      <h2>Dresseurs</h2>
      <div class="table-wrapper" id="trainers-data"></div>
    </section>

    <section id="pokemons">
      <h2>Pokémon</h2>
      <div class="table-wrapper" id="pokemons-data"></div>
    </section>

    <section id="attacks">
      <h2>Attaques</h2>
      <div class="table-wrapper" id="attacks-data"></div>
    </section>

    <section id="pokemon-attacks">
      <h2>Attaques par Pokémon</h2>
      <div class="table-wrapper" id="pokemon_attacks-data"></div>
    </section>

    <section id="pokemon-attacks-view">
      <h2>Vue détaillée (v_pokemon_attacks)</h2>
      <div class="table-wrapper" id="pokemon_attacks_view-data"></div>
    </section>

    <section>
      <h2>Données brutes JSON</h2>
      <pre id="raw"></pre>
    </section>
  </main>

  <script>
    const sections = [
      { key: 'trainers', container: 'trainers-data' },
      { key: 'pokemons', container: 'pokemons-data' },
      { key: 'attacks', container: 'attacks-data' },
      { key: 'pokemon_attacks', container: 'pokemon_attacks-data' },
      { key: 'pokemon_attacks_view', container: 'pokemon_attacks_view-data' }
    ];

    function renderTable(containerId, rows) {
      const container = document.getElementById(containerId);
      container.innerHTML = '';

      if (!rows || rows.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'empty';
        empty.textContent = 'Aucune donnée à afficher.';
        container.appendChild(empty);
        return;
      }

      const table = document.createElement('table');
      const thead = document.createElement('thead');
      const headerRow = document.createElement('tr');
      const columns = Object.keys(rows[0]);

      columns.forEach((key) => {
        const th = document.createElement('th');
        th.textContent = key;
        headerRow.appendChild(th);
      });

      thead.appendChild(headerRow);
      table.appendChild(thead);

      const tbody = document.createElement('tbody');
      rows.forEach((row) => {
        const tr = document.createElement('tr');
        columns.forEach((key) => {
          const td = document.createElement('td');
          const value = row[key];
          td.textContent = value === null || typeof value === 'undefined'
            ? ''
            : String(value);
          tr.appendChild(td);
        });
        tbody.appendChild(tr);
      });

      table.appendChild(tbody);
      container.appendChild(table);
    }

    async function loadSnapshot() {
      const rawEl = document.getElementById('raw');
      rawEl.textContent = 'Chargement...';
      try {
        const response = await fetch('/api/database');
        if (!response.ok) {
          throw new Error('Impossible de charger les données (' + response.status + ').');
        }
        const data = await response.json();
        sections.forEach((section) => {
          renderTable(section.container, data[section.key]);
        });
        rawEl.textContent = JSON.stringify(data, null, 2);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        rawEl.textContent = 'Erreur: ' + message;
      }
    }

    document.getElementById('refresh').addEventListener('click', loadSnapshot);
    loadSnapshot();
  </script>
</body>
</html>`;

app.get('/', (_req, res) => {
    res.type('html').send(htmlPage);
});

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    console.error(error);
    const message =
        error instanceof Error ? error.message : 'Erreur inattendue côté serveur';
    res.status(500).json({ message });
});

const PORT = Number(process.env.PORT ?? 3000);

if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => {
        const url = new URL(`http://localhost:${PORT}`);
        console.log(`🚀 Interface prête sur ${url.href}`);
    });
}

export default app;
