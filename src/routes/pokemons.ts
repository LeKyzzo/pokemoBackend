import { Router } from 'express';

import AttackRepository from '../repositories/AttackRepo';
import PokemonRepository from '../repositories/PockemonRepo';
import HttpError from '../utils/HttpError';

const router = Router();

const parseId = (raw: unknown, label: string): number => {
	const value = Number(raw);
	if (!Number.isInteger(value) || value <= 0) {
		throw new HttpError(400, `${label} doit être un entier positif.`);
	}
	return value;
};

router.post('/', async (req, res, next) => {
	try {
		const name = String(req.body?.name ?? '').trim();
		const maxLife = Number(req.body?.maxLife);
		const trainerIdRaw = req.body?.trainerId;
		const trainerId = trainerIdRaw === undefined || trainerIdRaw === null ? null : parseId(trainerIdRaw, 'Identifiant du dresseur');

		if (!name) {
			throw new HttpError(400, 'Le nom du Pokémon est requis.');
		}
		if (!Number.isFinite(maxLife) || maxLife <= 0) {
			throw new HttpError(400, 'Les points de vie doivent être un nombre positif.');
		}

		const pokemon = await PokemonRepository.create({ name, maxLife, trainerId });
		res.status(201).json(pokemon.toJSON());
	} catch (error) {
		next(error);
	}
});

router.get('/:id', async (req, res, next) => {
	try {
		const id = parseId(req.params.id, 'Identifiant du Pokémon');
		const pokemon = await PokemonRepository.findById(id);
		if (!pokemon) {
			throw new HttpError(404, `Pokémon ${id} introuvable.`);
		}
		res.json(pokemon.toJSON());
	} catch (error) {
		next(error);
	}
});

router.get('/trainer/:trainerId', async (req, res, next) => {
	try {
		const trainerId = parseId(req.params.trainerId, 'Identifiant du dresseur');
		const pokemons = await PokemonRepository.listByTrainerId(trainerId);
		res.json(pokemons.map((pokemon) => pokemon.toJSON()));
	} catch (error) {
		next(error);
	}
});

router.post('/:id/attacks', async (req, res, next) => {
	try {
		const pokemonId = parseId(req.params.id, 'Identifiant du Pokémon');
		const attackId = parseId(req.body?.attackId, 'Identifiant de l\'attaque');
		const attack = await AttackRepository.findById(attackId);
		if (!attack) {
			throw new HttpError(404, `Attaque ${attackId} introuvable.`);
		}
		await PokemonRepository.teachAttack(pokemonId, attackId);
		const pokemon = await PokemonRepository.findById(pokemonId);
		if (!pokemon) {
			throw new HttpError(404, `Pokémon ${pokemonId} introuvable.`);
		}
		res.status(200).json(pokemon.toJSON());
	} catch (error) {
		next(error);
	}
});

router.post('/:id/heal', async (req, res, next) => {
	try {
		const pokemonId = parseId(req.params.id, 'Identifiant du Pokémon');
		await PokemonRepository.healPokemon(pokemonId);
		const pokemon = await PokemonRepository.findById(pokemonId);
		if (!pokemon) {
			throw new HttpError(404, `Pokémon ${pokemonId} introuvable.`);
		}
		res.json(pokemon.toJSON());
	} catch (error) {
		next(error);
	}
});

export default router;
