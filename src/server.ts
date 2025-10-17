import path from 'path';
import cors from 'cors';
import express, { NextFunction, Request, Response } from 'express';

import { query } from './db';
import battlesRouter from './routes/battles';
import attacksRouter from './routes/attacks';
import pokemonsRouter from './routes/pokemons';
import trainersRouter from './routes/trainers';
import HttpError from './utils/HttpError';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
});

app.use('/api/trainers', trainersRouter);
app.use('/api/pokemons', pokemonsRouter);
app.use('/api/attacks', attacksRouter);
app.use('/api/battles', battlesRouter);

const tableQueries: Record<string, string> = {
    trainers: 'SELECT * FROM poke.trainer ORDER BY id',
    pokemons: 'SELECT * FROM poke.pokemon ORDER BY id',
    attacks: 'SELECT * FROM poke.attack ORDER BY id',
    pokemon_attacks: 'SELECT * FROM poke.pokemon_attack ORDER BY pokemon_id, attack_id',
    pokemon_attacks_view: 'SELECT * FROM poke.v_pokemon_attacks ORDER BY pokemon_id, attack_name'
};

app.get('/api/database', async (_req, res, next) => {
    try {
        const snapshot: Record<string, unknown[]> = {};
        for (const [key, sql] of Object.entries(tableQueries)) {
            const { rows } = await query(sql);
            snapshot[key] = rows;
        }
        res.json(snapshot);
    } catch (error) {
        next(error);
    }
});

const publicDir = path.resolve(__dirname, '../public');
app.use(express.static(publicDir));

app.get('/', (_req, res, next) => {
    res.sendFile(path.join(publicDir, 'index.html'), (error) => {
        if (error) {
            next(error);
        }
    });
});

app.use((req, _res, next) => {
    next(new HttpError(404, `Route ${req.method} ${req.path} introuvable`));
});

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (error instanceof HttpError) {
        res.status(error.status).json({ message: error.message });
        return;
    }

    if (error instanceof Error && typeof (error as { status?: number }).status === 'number') {
        const status = (error as { status?: number }).status ?? 500;
        res.status(status).json({ message: error.message });
        return;
    }

    console.error(error);
    const message = error instanceof Error ? error.message : 'Erreur inattendue côté serveur';
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
