CREATE TABLE IF NOT EXISTS trainers (
id SERIAL PRIMARY KEY,
name TEXT NOT NULL UNIQUE,
level INT NOT NULL DEFAULT 1,
experience INT NOT NULL DEFAULT 0
);


CREATE TABLE IF NOT EXISTS pokemons (
id SERIAL PRIMARY KEY,
name TEXT NOT NULL,
max_life_point INT NOT NULL CHECK (max_life_point > 0),
life_point INT NOT NULL CHECK (life_point >= 0),
trainer_id INT REFERENCES trainers(id) ON DELETE SET NULL
);


CREATE TABLE IF NOT EXISTS attacks (
id SERIAL PRIMARY KEY,
name TEXT NOT NULL UNIQUE,
damage INT NOT NULL CHECK (damage > 0),
usage_limit INT NOT NULL CHECK (usage_limit > 0)
);


CREATE TABLE IF NOT EXISTS pokemon_attacks (
pokemon_id INT REFERENCES pokemons(id) ON DELETE CASCADE,
attack_id INT REFERENCES attacks(id) ON DELETE CASCADE,
usage_count INT NOT NULL DEFAULT 0,
PRIMARY KEY (pokemon_id, attack_id)
);


CREATE VIEW IF NOT EXISTS pokemon_with_trainer AS
SELECT p.*, t.name AS trainer_name
FROM pokemons p LEFT JOIN trainers t ON t.id = p.trainer_id;