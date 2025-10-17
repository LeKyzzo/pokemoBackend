import { Router } from 'express';

import TrainerRepository from '../repositories/Trainer';
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

router.get('/', async (_req, res, next) => {
	try {
		const trainers = await TrainerRepository.listAll();
		res.json(trainers.map((trainer) => trainer.toJSON()));
	} catch (error) {
		next(error);
	}
});

router.post('/', async (req, res, next) => {
	try {
		const name = String(req.body?.name ?? '').trim();
		if (!name) {
			throw new HttpError(400, 'Le nom du dresseur est requis.');
		}
		const trainer = await TrainerRepository.create(name);
		res.status(201).json(trainer.toJSON());
	} catch (error) {
		next(error);
	}
});

router.get('/:id', async (req, res, next) => {
	try {
		const id = parseId(req.params.id, 'Identifiant du dresseur');
		const trainer = await TrainerRepository.loadWithPokemons(id);
		if (!trainer) {
			throw new HttpError(404, `Dresseur ${id} introuvable.`);
		}
		res.json(trainer.toJSON());
	} catch (error) {
		next(error);
	}
});

router.post('/:id/heal', async (req, res, next) => {
	try {
		const id = parseId(req.params.id, 'Identifiant du dresseur');
		await TrainerRepository.healTeam(id);
		const trainer = await TrainerRepository.loadWithPokemons(id);
		if (!trainer) {
			throw new HttpError(404, `Dresseur ${id} introuvable.`);
		}
		res.json(trainer.toJSON());
	} catch (error) {
		next(error);
	}
});

router.post('/:id/heal-team', async (req, res, next) => {
	try {
		const id = parseId(req.params.id, 'Identifiant du dresseur');
		await TrainerRepository.healTeam(id);
		res.status(204).send();
	} catch (error) {
		next(error);
	}
});

router.post('/:id/add-pokemon', async (req, res, next) => {
	try {
		const trainerId = parseId(req.params.id, 'Identifiant du dresseur');
		const name = String(req.body?.name ?? '').trim();
		const maxLife = Number(req.body?.maxLife);
		if (!name) {
			throw new HttpError(400, 'Le nom du Pokémon est requis.');
		}
		if (!Number.isFinite(maxLife) || maxLife <= 0) {
			throw new HttpError(400, 'Les points de vie doivent être un entier positif.');
		}
		const pokemon = await PokemonRepository.create({ name, maxLife, trainerId });
		res.status(201).json(pokemon.toJSON());
	} catch (error) {
		next(error);
	}
});

export default router;
