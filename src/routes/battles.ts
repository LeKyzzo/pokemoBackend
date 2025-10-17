import { Router } from 'express';

import BattleServices from '../services/BattleServices';
import HttpError from '../utils/HttpError';

const router = Router();

const parseId = (raw: unknown, label: string): number => {
	const value = Number(raw);
	if (!Number.isInteger(value) || value <= 0) {
		throw new HttpError(400, `${label} doit être un entier positif.`);
	}
	return value;
};

const parseBodyIds = (body: unknown): { trainerAId: number; trainerBId: number } => {
	const trainerAId = parseId((body as { trainerAId?: unknown })?.trainerAId, 'Identifiant du dresseur A');
	const trainerBId = parseId((body as { trainerBId?: unknown })?.trainerBId, 'Identifiant du dresseur B');
	return { trainerAId, trainerBId };
};

router.post('/random', async (req, res, next) => {
	try {
		const { trainerAId, trainerBId } = parseBodyIds(req.body);
		const result = await BattleServices.randomChallenge(trainerAId, trainerBId);
		res.json(result);
	} catch (error) {
		next(error);
	}
});

router.post('/deterministic', async (req, res, next) => {
	try {
		const { trainerAId, trainerBId } = parseBodyIds(req.body);
		const result = await BattleServices.deterministicChallenge(trainerAId, trainerBId);
		res.json(result);
	} catch (error) {
		next(error);
	}
});

router.post('/arena/random', async (req, res, next) => {
	try {
		const { trainerAId, trainerBId } = parseBodyIds(req.body);
		const battlesCountRaw = Number((req.body as { battlesCount?: unknown })?.battlesCount ?? 100);
		const battlesCount = Number.isInteger(battlesCountRaw) && battlesCountRaw > 0 ? battlesCountRaw : 100;
		const result = await BattleServices.randomArena(trainerAId, trainerBId, battlesCount);
		res.json(result);
	} catch (error) {
		next(error);
	}
});

router.post('/arena/deterministic', async (req, res, next) => {
	try {
		const { trainerAId, trainerBId } = parseBodyIds(req.body);
		const battlesCountRaw = Number((req.body as { battlesCount?: unknown })?.battlesCount ?? 100);
		const battlesCount = Number.isInteger(battlesCountRaw) && battlesCountRaw > 0 ? battlesCountRaw : 100;
		const result = await BattleServices.deterministicArena(trainerAId, trainerBId, battlesCount);
		res.json(result);
	} catch (error) {
		next(error);
	}
});

export default router;
