import { Router } from 'express';

import AttackRepository from '../repositories/AttackRepo';
import HttpError from '../utils/HttpError';

const router = Router();

router.get('/', async (_req, res, next) => {
	try {
		const attacks = await AttackRepository.listAll();
		res.json(attacks.map((attack) => ({
			id: attack.id,
			name: attack.name,
			damage: attack.damage,
			usageLimit: attack.usageLimit
		})));
	} catch (error) {
		next(error);
	}
});

router.post('/', async (req, res, next) => {
	try {
		const name = String(req.body?.name ?? '').trim();
		const damage = Number(req.body?.damage);
		const usageLimit = Number(req.body?.usageLimit);

		if (!name) {
			throw new HttpError(400, "Le nom de l'attaque est requis.");
		}
		if (!Number.isFinite(damage) || damage < 0) {
			throw new HttpError(400, 'Les dégâts doivent être un nombre positif.');
		}
		if (!Number.isFinite(usageLimit) || usageLimit < 0) {
			throw new HttpError(400, "La limite d'usage doit être un nombre positif.");
		}

		const attack = await AttackRepository.create(name, damage, usageLimit);
		res.status(201).json({
			id: attack.id,
			name: attack.name,
			damage: attack.damage,
			usageLimit: attack.usageLimit
		});
	} catch (error) {
		next(error);
	}
});

export default router;
