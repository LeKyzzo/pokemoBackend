-- Reset propre de l'environnement de jeu
DROP SCHEMA IF EXISTS poke CASCADE;
CREATE SCHEMA poke;

SET search_path TO poke, public;

-- Dresseurs
CREATE TABLE trainer (
    id          SERIAL PRIMARY KEY,
    name        TEXT    NOT NULL UNIQUE,
    level       INTEGER NOT NULL DEFAULT 1 CHECK (level >= 1),
    experience  INTEGER NOT NULL DEFAULT 0 CHECK (experience >= 0)
);

-- Attaques disponibles dans le Pokédex
CREATE TABLE attack (
    id           SERIAL PRIMARY KEY,
    name         TEXT    NOT NULL UNIQUE,
    damage       INTEGER NOT NULL CHECK (damage >= 0),
    usage_limit  INTEGER NOT NULL CHECK (usage_limit >= 0)
);

-- Pokémon capturés (ou sauvages si trainer_id NULL)
CREATE TABLE pokemon (
    id            SERIAL PRIMARY KEY,
    name          TEXT    NOT NULL,
    max_life      INTEGER NOT NULL CHECK (max_life > 0),
    current_life  INTEGER NOT NULL CHECK (current_life >= 0 AND current_life <= max_life),
    trainer_id    INTEGER REFERENCES trainer(id) ON DELETE SET NULL
);

CREATE INDEX idx_pokemon_trainer_id ON pokemon(trainer_id);

-- Attaques connues par chaque Pokémon
CREATE TABLE pokemon_attack (
    pokemon_id   INTEGER NOT NULL REFERENCES pokemon(id) ON DELETE CASCADE,
    attack_id    INTEGER NOT NULL REFERENCES attack(id) ON DELETE CASCADE,
    usage_limit  INTEGER NOT NULL CHECK (usage_limit >= 0),
    usage_count  INTEGER NOT NULL DEFAULT 0 CHECK (usage_count >= 0 AND usage_count <= usage_limit),
    learned_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (pokemon_id, attack_id)
);

CREATE INDEX idx_pokemon_attack_attack_id ON pokemon_attack(attack_id);

-- Pas plus de quatre attaques par Pokémon
CREATE OR REPLACE FUNCTION poke.enforce_pokemon_attack_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF (SELECT COUNT(*) FROM poke.pokemon_attack WHERE pokemon_id = NEW.pokemon_id) >= 4 THEN
        RAISE EXCEPTION 'Un Pokémon ne peut pas connaître plus de quatre attaques.';
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_pokemon_attack_limit
BEFORE INSERT ON pokemon_attack
FOR EACH ROW
EXECUTE FUNCTION poke.enforce_pokemon_attack_limit();

-- Remise à zéro d'un Pokémon
CREATE OR REPLACE FUNCTION poke.heal_pokemon(p_pokemon_id INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    affected INTEGER;
BEGIN
    UPDATE poke.pokemon
    SET current_life = max_life
    WHERE id = p_pokemon_id;
    GET DIAGNOSTICS affected = ROW_COUNT;

    UPDATE poke.pokemon_attack
    SET usage_count = 0
    WHERE pokemon_id = p_pokemon_id;

    RETURN COALESCE(affected, 0);
END;
$$;

-- Soigner toute l'équipe d'un dresseur
CREATE OR REPLACE FUNCTION poke.heal_trainer_pokemons(p_trainer_id INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    affected INTEGER;
BEGIN
    UPDATE poke.pokemon
    SET current_life = max_life
    WHERE trainer_id = p_trainer_id;
    GET DIAGNOSTICS affected = ROW_COUNT;

    UPDATE poke.pokemon_attack
    SET usage_count = 0
    WHERE pokemon_id IN (SELECT id FROM poke.pokemon WHERE trainer_id = p_trainer_id);

    RETURN COALESCE(affected, 0);
END;
$$;

-- Vue pratique pour l'inspection (côté route /api/database)
CREATE OR REPLACE VIEW v_pokemon_attacks AS
SELECT
    p.id          AS pokemon_id,
    p.name        AS pokemon_name,
    p.trainer_id,
    a.id          AS attack_id,
    a.name        AS attack_name,
    a.damage,
    pa.usage_limit,
    pa.usage_count,
    pa.learned_at
FROM pokemon p
LEFT JOIN pokemon_attack pa ON pa.pokemon_id = p.id
LEFT JOIN attack a ON a.id = pa.attack_id
ORDER BY p.id, pa.attack_id;
