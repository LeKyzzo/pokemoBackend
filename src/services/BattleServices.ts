import Pokemon from '../domain/Pokemon';
import Trainer from '../domain/Trainer';
import TrainerRepository from '../repositories/Trainer';
import HttpError from '../utils/HttpError';

export type BattleMode =
	| 'random-duel'
	| 'deterministic-duel'
	| 'arena-random'
	| 'arena-deterministic';

export interface ParticipantRef {
	trainerId: number | null;
	trainerName: string;
	pokemonName: string;
}

export interface DuelTurn {
	round: number;
	actor: ParticipantRef;
	target: ParticipantRef;
	action: 'attack' | 'skip';
	attackName?: string;
	damage?: number;
	targetRemainingLife: number;
}

export interface DuelResult {
	mode: Extract<BattleMode, 'random-duel' | 'deterministic-duel'>;
	trainerA: { id: number | null; name: string; pokemon: string };
	trainerB: { id: number | null; name: string; pokemon: string };
	winner: ParticipantRef | null;
	loser: ParticipantRef | null;
	totalRounds: number;
	reason: 'knockout' | 'stalemate' | 'max-rounds';
	turns: DuelTurn[];
}

export interface ArenaResult {
	mode: Extract<BattleMode, 'arena-random' | 'arena-deterministic'>;
	totalBattles: number;
	battles: DuelResult[];
	scoreboard: Array<{ trainerId: number | null; trainerName: string; wins: number; losses: number; draws: number }>;
	champion: { trainerId: number | null; trainerName: string } | null;
	notes: string[];
}

type SelectionStrategy = 'random' | 'strongest';

interface DuelOptions {
	trainerA: Trainer;
	trainerB: Trainer;
	selection: SelectionStrategy;
	healBefore: boolean;
	maxRounds?: number;
	mode: DuelResult['mode'];
}

export default class BattleServices {
	static async randomChallenge(trainerAId: number, trainerBId: number): Promise<DuelResult> {
		const [trainerA, trainerB] = await this.loadTrainers(trainerAId, trainerBId);
		return this.runDuel({
			trainerA: trainerA.clone(),
			trainerB: trainerB.clone(),
			selection: 'random',
			healBefore: true,
			mode: 'random-duel'
		});
	}

	static async deterministicChallenge(trainerAId: number, trainerBId: number): Promise<DuelResult> {
		const [trainerA, trainerB] = await this.loadTrainers(trainerAId, trainerBId);
		return this.runDuel({
			trainerA: trainerA.clone(),
			trainerB: trainerB.clone(),
			selection: 'strongest',
			healBefore: false,
			mode: 'deterministic-duel'
		});
	}

	static async randomArena(trainerAId: number, trainerBId: number, battlesCount = 100): Promise<ArenaResult> {
		const [trainerA, trainerB] = await this.loadTrainers(trainerAId, trainerBId);
		const battles: DuelResult[] = [];
		let trainerAWins = 0;
		let trainerBWins = 0;
		let draws = 0;

		for (let i = 0; i < battlesCount; i += 1) {
			const duel = this.runDuel({
				trainerA: trainerA.clone(),
				trainerB: trainerB.clone(),
				selection: 'random',
				healBefore: true,
				mode: 'random-duel'
			});
			battles.push(duel);
			if (duel.winner?.trainerId === trainerA.id) {
				trainerAWins += 1;
			} else if (duel.winner?.trainerId === trainerB.id) {
				trainerBWins += 1;
			} else {
				draws += 1;
			}
		}

		const scoreboard = [
			{ trainerId: trainerA.id, trainerName: trainerA.name, wins: trainerAWins, losses: trainerBWins, draws },
			{ trainerId: trainerB.id, trainerName: trainerB.name, wins: trainerBWins, losses: trainerAWins, draws }
		];

		const champion = this.pickChampionByLevel(trainerA, trainerB);

		return {
			mode: 'arena-random',
			totalBattles: battles.length,
			battles,
			scoreboard,
			champion,
			notes: [
				'Classement basé en priorité sur le niveau actuel des dresseurs, puis leur expérience en cas d\'égalité.',
				'Chaque duel a été joué avec des équipes totalement soignées et des Pokémon choisis aléatoirement.'
			]
		};
	}

	static async deterministicArena(
		trainerAId: number,
		trainerBId: number,
		battlesCount = 100
	): Promise<ArenaResult> {
		const [trainerA, trainerB] = await this.loadTrainers(trainerAId, trainerBId);
		const cloneA = trainerA.clone();
		const cloneB = trainerB.clone();

		const battles: DuelResult[] = [];
		let trainerAWins = 0;
		let trainerBWins = 0;
		let draws = 0;

	for (let i = 0; i < battlesCount; i += 1) {
			if (!cloneA.aliveTeam.length || !cloneB.aliveTeam.length) {
				break;
			}
			const duel = this.runDuel({
				trainerA: cloneA,
				trainerB: cloneB,
				selection: 'strongest',
				healBefore: false,
				mode: 'deterministic-duel'
			});
			battles.push(duel);
			if (duel.winner?.trainerId === trainerA.id) {
				trainerAWins += 1;
			} else if (duel.winner?.trainerId === trainerB.id) {
				trainerBWins += 1;
			} else {
				draws += 1;
			}
			cloneA.discardFainted();
			cloneB.discardFainted();
		}

		const scoreboard = [
			{ trainerId: trainerA.id, trainerName: trainerA.name, wins: trainerAWins, losses: trainerBWins, draws },
			{ trainerId: trainerB.id, trainerName: trainerB.name, wins: trainerBWins, losses: trainerAWins, draws }
		];

		const champion = this.pickChampionByRemainingTeam(cloneA, cloneB) ?? null;

		return {
			mode: 'arena-deterministic',
			totalBattles: battles.length,
			battles,
			scoreboard,
			champion,
			notes: [
				'Les équipes gardent leur état entre chaque duel. Lorsqu\'un Pokémon est K.O., il ne participe plus aux combats suivants.',
				'L\'arène se termine dès qu\'un dresseur n\'a plus de Pokémon ou lorsque la limite de combats est atteinte.'
			]
		};
	}

	private static runDuel(options: DuelOptions): DuelResult {
		const { trainerA, trainerB, selection, healBefore, maxRounds = 200, mode } = options;

		if (healBefore) {
			trainerA.healTeam();
			trainerB.healTeam();
		}

		const pokemonA = this.selectPokemon(trainerA, selection);
		const pokemonB = this.selectPokemon(trainerB, selection);

		if (!pokemonA || !pokemonB) {
			throw new HttpError(400, 'Chaque dresseur doit posséder au moins un Pokémon prêt au combat.');
		}

		const turns: DuelTurn[] = [];
		let round = 0;
		let reason: DuelResult['reason'] = 'knockout';
		let consecutiveSkips = 0;

		let attackerTrainer = trainerA;
		let attackerPokemon = pokemonA;
		let defenderTrainer = trainerB;
		let defenderPokemon = pokemonB;

		while (attackerPokemon.isAlive && defenderPokemon.isAlive) {
			round += 1;
			if (round > maxRounds) {
				reason = 'max-rounds';
				break;
			}

			const execution = attackerPokemon.attack(defenderPokemon);
			const turn: DuelTurn = {
				round,
				actor: this.makeParticipant(attackerTrainer, attackerPokemon),
				target: this.makeParticipant(defenderTrainer, defenderPokemon),
				action: execution ? 'attack' : 'skip',
				attackName: execution?.attack.name,
				damage: execution?.damage,
				targetRemainingLife: defenderPokemon.currentLife
			};
			turns.push(turn);

			if (execution) {
				consecutiveSkips = 0;
			} else {
				consecutiveSkips += 1;
			}

			if (!defenderPokemon.isAlive) {
				break;
			}

			if (consecutiveSkips >= 2) {
				reason = 'stalemate';
				break;
			}

			[attackerTrainer, defenderTrainer] = [defenderTrainer, attackerTrainer];
			[attackerPokemon, defenderPokemon] = [defenderPokemon, attackerPokemon];
		}

		const winnerPokemon = pokemonA.isAlive ? pokemonA : pokemonB.isAlive ? pokemonB : null;
		const winnerTrainer = winnerPokemon === pokemonA ? trainerA : winnerPokemon === pokemonB ? trainerB : null;

		const loserPokemon = winnerPokemon === pokemonA ? pokemonB : winnerPokemon === pokemonB ? pokemonA : null;
		const loserTrainer = loserPokemon === pokemonA ? trainerA : loserPokemon === pokemonB ? trainerB : null;

		if (reason !== 'knockout' && !winnerTrainer) {
			consecutiveSkips = 2; // force draw state
		}

		return {
			mode,
			trainerA: { id: trainerA.id, name: trainerA.name, pokemon: pokemonA.name },
			trainerB: { id: trainerB.id, name: trainerB.name, pokemon: pokemonB.name },
			winner: winnerTrainer && winnerPokemon
				? this.makeParticipant(winnerTrainer, winnerPokemon)
				: null,
			loser: loserTrainer && loserPokemon
				? this.makeParticipant(loserTrainer, loserPokemon)
				: null,
			totalRounds: turns.length,
			reason: winnerTrainer ? 'knockout' : reason === 'max-rounds' ? 'max-rounds' : 'stalemate',
			turns
		};
	}

	private static makeParticipant(trainer: Trainer, pokemon: Pokemon): ParticipantRef {
		return {
			trainerId: trainer.id,
			trainerName: trainer.name,
			pokemonName: pokemon.name
		};
	}

	private static selectPokemon(trainer: Trainer, strategy: SelectionStrategy): Pokemon | null {
		if (strategy === 'strongest') {
			return trainer.strongestPokemon();
		}
		return trainer.randomPokemon();
	}

	private static async loadTrainers(trainerAId: number, trainerBId: number): Promise<[Trainer, Trainer]> {
		if (trainerAId === trainerBId) {
			throw new HttpError(400, 'Choisissez deux dresseurs différents.');
		}

		const [trainerA, trainerB] = await Promise.all([
			TrainerRepository.loadWithPokemons(trainerAId),
			TrainerRepository.loadWithPokemons(trainerBId)
		]);

		if (!trainerA) {
			throw new HttpError(404, `Dresseur ${trainerAId} introuvable.`);
		}
		if (!trainerB) {
			throw new HttpError(404, `Dresseur ${trainerBId} introuvable.`);
		}
		if (!trainerA.team.length) {
			throw new HttpError(400, `${trainerA.name} n'a aucun Pokémon.`);
		}
		if (!trainerB.team.length) {
			throw new HttpError(400, `${trainerB.name} n'a aucun Pokémon.`);
		}

		return [trainerA, trainerB];
	}

	private static pickChampionByLevel(trainerA: Trainer, trainerB: Trainer): { trainerId: number | null; trainerName: string } | null {
		if (trainerA.level > trainerB.level) {
			return { trainerId: trainerA.id, trainerName: trainerA.name };
		}
		if (trainerB.level > trainerA.level) {
			return { trainerId: trainerB.id, trainerName: trainerB.name };
		}
		if (trainerA.experience > trainerB.experience) {
			return { trainerId: trainerA.id, trainerName: trainerA.name };
		}
		if (trainerB.experience > trainerA.experience) {
			return { trainerId: trainerB.id, trainerName: trainerB.name };
		}
		return null;
	}

	private static pickChampionByRemainingTeam(trainerA: Trainer, trainerB: Trainer): { trainerId: number | null; trainerName: string } | null {
		const aliveA = trainerA.aliveTeam.length;
		const aliveB = trainerB.aliveTeam.length;
		if (aliveA > aliveB) {
			return { trainerId: trainerA.id, trainerName: trainerA.name };
		}
		if (aliveB > aliveA) {
			return { trainerId: trainerB.id, trainerName: trainerB.name };
		}
		return this.pickChampionByLevel(trainerA, trainerB);
	}
}
