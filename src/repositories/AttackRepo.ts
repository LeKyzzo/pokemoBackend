import Attack from '../domain/Attack';
import { query } from '../db';

interface AttackRow {
	id: number;
	name: string;
	damage: number;
	usage_limit: number;
}

export default class AttackRepository {
	static async listAll(): Promise<Attack[]> {
		const { rows } = await query<AttackRow>(
			'SELECT id, name, damage, usage_limit FROM poke.attack ORDER BY id'
		);
		return rows.map((row) => new Attack(row.id, row.name, row.damage, row.usage_limit));
	}

	static async findById(id: number): Promise<Attack | null> {
		const { rows } = await query<AttackRow>(
			'SELECT id, name, damage, usage_limit FROM poke.attack WHERE id = $1',
			[id]
		);
		const row = rows[0];
		if (!row) {
			return null;
		}
		return new Attack(row.id, row.name, row.damage, row.usage_limit);
	}

	static async create(name: string, damage: number, usageLimit: number): Promise<Attack> {
		const { rows } = await query<AttackRow>(
			'INSERT INTO poke.attack (name, damage, usage_limit) VALUES ($1, $2, $3) RETURNING id, name, damage, usage_limit',
			[name, damage, usageLimit]
		);
		const row = rows[0];
		if (!row) {
			throw new Error("Impossible de créer l'attaque");
		}
		return new Attack(row.id, row.name, row.damage, row.usage_limit);
	}
}
