import Attack from '../domain/Attack';
import Pokemon from '../domain/Pokemon';
import { query } from '../db';
import AttackRepository from './AttackRepo';

interface PokemonRow {
	id: number;
	name: string;
	max_life: number;
	current_life: number;
	trainer_id: number | null;
}

interface PokemonWithAttackRow {
	pokemon_id: number;
	pokemon_name: string;
	max_life: number;
	current_life: number;
	trainer_id: number | null;
	attack_id: number | null;
	attack_name: string | null;
	damage: number | null;
	usage_limit: number | null;
	usage_count: number | null;
}

export interface CreatePokemonInput {
	name: string;
	maxLife: number;
	trainerId?: number | null;
}

export default class PokemonRepository {
	static async create({ name, maxLife, trainerId = null }: CreatePokemonInput): Promise<Pokemon> {
		const { rows } = await query<PokemonRow>(
			`INSERT INTO poke.pokemon (name, max_life, current_life, trainer_id)
			 VALUES ($1, $2, $2, $3)
			 RETURNING id, name, max_life, current_life, trainer_id`,
			[name, maxLife, trainerId]
		);
		const row = rows[0];
		if (!row) {
			throw new Error("Impossible de créer le Pokémon");
		}
		return new Pokemon(row.id, row.name, row.max_life, row.current_life);
	}

	static async findById(id: number): Promise<Pokemon | null> {
		const rows = await this.fetchWithAttacks('WHERE p.id = $1', [id]);
		return rows[0] ?? null;
	}

	static async listByTrainerId(trainerId: number): Promise<Pokemon[]> {
		return this.fetchWithAttacks('WHERE p.trainer_id = $1', [trainerId]);
	}

	static async teachAttack(pokemonId: number, attackId: number): Promise<void> {
		const attack = await AttackRepository.findById(attackId);
		if (!attack) {
			throw new Error("Attaque introuvable");
		}
		await query(
			`INSERT INTO poke.pokemon_attack (pokemon_id, attack_id, usage_limit, usage_count)
			 VALUES ($1, $2, $3, 0)
			 ON CONFLICT (pokemon_id, attack_id)
			 DO UPDATE SET usage_limit = EXCLUDED.usage_limit, usage_count = 0`,
			[pokemonId, attackId, attack.usageLimit]
		);
	}

	static async healPokemon(pokemonId: number): Promise<void> {
		await query('SELECT poke.heal_pokemon($1) AS healed', [pokemonId]);
	}

	static async healTrainer(teamOwnerId: number): Promise<void> {
		await query('SELECT poke.heal_trainer_pokemons($1) AS healed', [teamOwnerId]);
	}

	private static async fetchWithAttacks(whereClause: string, values: unknown[]): Promise<Pokemon[]> {
		const { rows } = await query<PokemonWithAttackRow>(
			`SELECT
				p.id AS pokemon_id,
				p.name AS pokemon_name,
				p.max_life,
				p.current_life,
				p.trainer_id,
				pa.attack_id,
				a.name AS attack_name,
				a.damage,
				pa.usage_limit,
				pa.usage_count
			 FROM poke.pokemon p
			 LEFT JOIN poke.pokemon_attack pa ON pa.pokemon_id = p.id
			 LEFT JOIN poke.attack a ON a.id = pa.attack_id
			 ${whereClause}
			 ORDER BY p.id, pa.attack_id`,
			values
		);

		const grouped = new Map<number, Pokemon>();

		rows.forEach((row) => {
			let pokemon = grouped.get(row.pokemon_id);
			if (!pokemon) {
				pokemon = new Pokemon(
					row.pokemon_id,
					row.pokemon_name,
					row.max_life,
					row.current_life
				);
				grouped.set(row.pokemon_id, pokemon);
			}

			if (row.attack_id !== null && row.attack_name && row.damage !== null && row.usage_limit !== null) {
				const attack = new Attack(
					row.attack_id,
					row.attack_name,
					row.damage,
					row.usage_limit,
					row.usage_count ?? 0
				);
				pokemon.addOrReplaceAttack(attack);
			}
		});

		return Array.from(grouped.values());
	}
}
