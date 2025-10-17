export default class Attack {
	private _usageCount: number;

	constructor(
		public readonly id: number | null,
		public readonly name: string,
		public readonly damage: number,
		public readonly usageLimit: number,
		usageCount = 0
	) {
		if (!name) {
			throw new Error('Le nom de l\'attaque est requis.');
		}
		if (damage < 0) {
			throw new Error('Les dégâts doivent être positifs.');
		}
		if (usageLimit < 0) {
			throw new Error('La limite d\'usage doit être positive.');
		}
		if (usageCount < 0) {
			throw new Error('Le compteur d\'usage doit être positif.');
		}

		this._usageCount = Math.min(usageCount, usageLimit);
	}

	get usageCount(): number {
		return this._usageCount;
	}

	get remainingUses(): number {
		return Math.max(this.usageLimit - this._usageCount, 0);
	}

	canUse(): boolean {
		return this.remainingUses > 0;
	}

	use(): number {
		if (!this.canUse()) {
			throw new Error(`L\'attaque ${this.name} n\'a plus d\'utilisation disponible.`);
		}
		this._usageCount += 1;
		return this.damage;
	}

	resetUsage(): void {
		this._usageCount = 0;
	}

	describe(): string {
		return `${this.name} · ${this.damage} dmg · ${this.remainingUses}/${this.usageLimit} usages restants`;
	}

	clone(): Attack {
		return new Attack(this.id, this.name, this.damage, this.usageLimit, this._usageCount);
	}
}
