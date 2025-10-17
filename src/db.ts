import { config } from 'dotenv';
import path from 'path';
import { Pool, QueryConfig, QueryResult, QueryResultRow } from 'pg';

config({ path: path.resolve(__dirname, '../.env') });

const {
	DATABASE_URL,
	PGHOST,
	PGPORT,
	PGDATABASE,
	PGUSER,
	PGPASSWORD
} = process.env;

const pool = new Pool(
	DATABASE_URL
		? { connectionString: DATABASE_URL }
		: {
			host: PGHOST,
			port: PGPORT ? Number(PGPORT) : undefined,
			database: PGDATABASE,
			user: PGUSER,
			password: PGPASSWORD
		}
);

pool.on('connect', async (client) => {
	try {
		await client.query('SET search_path TO poke, public');
	} catch (error) {
		console.error('❌ Impossible de définir le search_path sur la connexion PostgreSQL.', error);
	}
});

export const query = <T extends QueryResultRow = QueryResultRow>(
	textOrConfig: string | QueryConfig,
	values?: unknown[]
): Promise<QueryResult<T>> =>
	typeof textOrConfig === 'string'
		? pool.query<T>(textOrConfig, values)
		: pool.query<T>(textOrConfig);

export const closePool = async () => {
	await pool.end();
};

export default pool;
