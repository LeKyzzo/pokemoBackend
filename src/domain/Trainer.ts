import Pokemon from './Pokemon';

export default class Trainer {
	private pokemons: Pokemon[];

	constructor(
		public readonly id: number | null,
		public readonly name: string,
		private _level = 1,
		private _experience = 0,
		pokemons: Pokemon[] = []
	) {
		if (!name) {
			throw new Error('Le nom du dresseur est requis.');
		}
		if (_level < 1) {
			throw new Error('Le niveau doit être supérieur ou égal à 1.');
		}
		if (_experience < 0) {
			throw new Error("L'expérience ne peut pas être négative.");
		}

		this.pokemons = pokemons.map((pokemon) => pokemon.clone());
	}

	get level(): number {
		return this._level;
	}

	get experience(): number {
		return this._experience;
	}

	get team(): Pokemon[] {
		return this.pokemons.map((pokemon) => pokemon.clone());
	}

	get aliveTeam(): Pokemon[] {
		return this.pokemons.filter((pokemon) => pokemon.isAlive).map((pokemon) => pokemon.clone());
	}

	addPokemon(pokemon: Pokemon): void {
		this.pokemons.push(pokemon.clone());
	}

	replaceTeam(pokemons: Pokemon[]): void {
		this.pokemons = pokemons.map((pokemon) => pokemon.clone());
	}

	healTeam(): void {
		this.pokemons.forEach((pokemon) => pokemon.heal());
	}

	discardFainted(): void {
		this.pokemons = this.pokemons.filter((pokemon) => pokemon.isAlive);
	}

	gainExperience(amount: number): void {
		if (amount <= 0) {
			return;
		}
		this._experience += Math.floor(amount);
		while (this._experience >= 10) {
			this._experience -= 10;
			this._level += 1;
		}
	}

	strongestPokemon(): Pokemon | null {
		if (!this.pokemons.length) {
			return null;
		}
		return this.pokemons
			.slice()
			.sort((a, b) => {
				if (b.currentLife === a.currentLife) {
					return b.maxLife - a.maxLife;
				}
				return b.currentLife - a.currentLife;
			})[0];
	}

	randomPokemon(): Pokemon | null {
		const available = this.pokemons.filter((pokemon) => pokemon.isAlive);
		if (!available.length) {
			return null;
		}
		const index = Math.floor(Math.random() * available.length);
		return available[index];
	}

	clone(): Trainer {
		return new Trainer(this.id, this.name, this._level, this._experience, this.pokemons);
	}

	toJSON() {
		return {
			id: this.id,
			name: this.name,
			level: this._level,
			experience: this._experience,
			pokemons: this.pokemons.map((pokemon) => pokemon.toJSON())
		};
	}
}
