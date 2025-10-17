import Trainer from '../domain/Trainer';
import { query } from '../db';
import PokemonRepository from './PockemonRepo';

interface TrainerRow {
	id: number;
	name: string;
	level: number;
	experience: number;
}

export default class TrainerRepository {
	static async listAll(): Promise<Trainer[]> {
		const { rows } = await query<TrainerRow>(
			'SELECT id, name, level, experience FROM poke.trainer ORDER BY id'
		);
		return rows.map((row) => new Trainer(row.id, row.name, row.level, row.experience));
	}

	static async findById(id: number): Promise<Trainer | null> {
		const { rows } = await query<TrainerRow>(
			'SELECT id, name, level, experience FROM poke.trainer WHERE id = $1',
			[id]
		);
		const row = rows[0];
		if (!row) {
			return null;
		}
		return new Trainer(row.id, row.name, row.level, row.experience);
	}

	static async create(name: string): Promise<Trainer> {
		const { rows } = await query<TrainerRow>(
			`INSERT INTO poke.trainer (name)
			 VALUES ($1)
			 RETURNING id, name, level, experience`,
			[name]
		);
		const row = rows[0];
		if (!row) {
			throw new Error("Impossible de créer le dresseur");
		}
		return new Trainer(row.id, row.name, row.level, row.experience);
	}

	static async loadWithPokemons(id: number): Promise<Trainer | null> {
		const trainer = await this.findById(id);
		if (!trainer) {
			return null;
		}
		const pokemons = await PokemonRepository.listByTrainerId(id);
		trainer.replaceTeam(pokemons);
		return trainer;
	}

	static async healTeam(trainerId: number): Promise<void> {
		await PokemonRepository.healTrainer(trainerId);
	}
}
