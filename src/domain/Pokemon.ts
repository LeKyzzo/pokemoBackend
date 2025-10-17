import Attack from './Attack';

export interface AttackExecution {
    attack: Attack;
    damage: number;
}

export default class Pokemon {
    private _currentLife: number;
    private attacks: Attack[];

    constructor(
        public readonly id: number | null,
        public readonly name: string,
        public readonly maxLife: number,
        currentLife?: number,
        attacks: Attack[] = []
    ) {
        if (!name) {
            throw new Error('Le nom du Pokémon est requis.');
        }
        if (maxLife <= 0) {
            throw new Error('Les points de vie maximum doivent être positifs.');
        }

        this._currentLife = Math.min(currentLife ?? maxLife, maxLife);
        if (this._currentLife < 0) {
            this._currentLife = 0;
        }

        this.attacks = attacks.map((attack) => attack.clone());
    }

    get currentLife(): number {
        return this._currentLife;
    }

    set currentLife(value: number) {
        this._currentLife = Math.max(0, Math.min(this.maxLife, Math.floor(value)));
    }

    get isAlive(): boolean {
        return this._currentLife > 0;
    }

    get knownAttacks(): Attack[] {
        return this.attacks.map((attack) => attack.clone());
    }

    learnAttack(attack: Attack): void {
        const exists = this.attacks.some(
            (known) => (attack.id !== null && known.id === attack.id) || known.name === attack.name
        );
        if (exists) {
            return;
        }
        if (this.attacks.length >= 4) {
            throw new Error(`${this.name} connaît déjà quatre attaques.`);
        }
        this.attacks.push(attack.clone());
    }

    /**
     * Méthode utilisée lors du chargement depuis la base de données.
     * Elle remplace une attaque existante portant le même identifiant
     * afin de refléter le compteur d'usage stocké.
     */
    addOrReplaceAttack(attack: Attack): void {
        const clone = attack.clone();
        const index = this.attacks.findIndex(
            (known) => (clone.id !== null && known.id === clone.id) || known.name === clone.name
        );
        if (index >= 0) {
            this.attacks[index] = clone;
            return;
        }
        if (this.attacks.length >= 4) {
            // La base de données applique déjà la contrainte, donc on remplace le plus ancien.
            this.attacks.shift();
        }
        this.attacks.push(clone);
    }

    heal(): void {
        this._currentLife = this.maxLife;
        this.attacks.forEach((attack) => attack.resetUsage());
    }

    takeDamage(amount: number): void {
        if (amount <= 0) {
            return;
        }
        this._currentLife = Math.max(0, this._currentLife - Math.floor(amount));
    }

    chooseRandomAvailableAttack(): Attack | null {
        const available = this.attacks.filter((attack) => attack.canUse());
        if (!available.length) {
            return null;
        }
        const index = Math.floor(Math.random() * available.length);
        return available[index];
    }

    attack(target: Pokemon): AttackExecution | null {
        if (!this.isAlive) {
            return null;
        }
        const attack = this.chooseRandomAvailableAttack();
        if (!attack) {
            return null;
        }
        const damage = attack.use();
        target.takeDamage(damage);
        return { attack, damage };
    }

    clone(): Pokemon {
        return new Pokemon(
            this.id,
            this.name,
            this.maxLife,
            this._currentLife,
            this.attacks.map((attack) => attack.clone())
        );
    }

    toJSON() {
        return {
            id: this.id,
            name: this.name,
            maxLife: this.maxLife,
            currentLife: this._currentLife,
            attacks: this.attacks.map((attack) => ({
                id: attack.id,
                name: attack.name,
                damage: attack.damage,
                usageLimit: attack.usageLimit,
                usageCount: attack.usageCount
            }))
        };
    }
}
