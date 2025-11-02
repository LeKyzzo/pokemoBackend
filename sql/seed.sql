SET search_path TO poke, public;

TRUNCATE TABLE pokemon_attack, pokemon, trainer, attack RESTART IDENTITY CASCADE;

-- Attaques de base
INSERT INTO attack (name, damage, usage_limit) VALUES
    ('Éclair', 35, 15),
    ('Tonnerre', 90, 10),
    ('Queue de Fer', 40, 20),
    ('Vive-Attaque', 30, 30),
    ('Flammèche', 40, 25),
    ('Lance-Flammes', 95, 15),
    ('Draco-Souffle', 80, 20),
    ('Bulles d''O', 40, 30),
    ('Hydrocanon', 110, 5),
    ('Jet-Pierres', 50, 20),
    ('Tomberoche', 75, 10);

-- Dresseurs prêts à combattre
INSERT INTO trainer (name, level, experience) VALUES
    ('Sacha', 7, 4),
    ('Ondine', 6, 2),
    ('Pierre', 5, 8),
    ('Giovanni', 8, 1);

-- Pokémon (ceux avec trainer_id NULL sont sauvages)
INSERT INTO pokemon (name, max_life, current_life, trainer_id) VALUES
    ('Pikachu', 120, 98, (SELECT id FROM trainer WHERE name = 'Sacha')),
    ('Dracaufeu', 180, 180, (SELECT id FROM trainer WHERE name = 'Sacha')),
    ('Bulbizarre', 150, 112, (SELECT id FROM trainer WHERE name = 'Sacha')),
    ('Stari', 130, 130, (SELECT id FROM trainer WHERE name = 'Ondine')),
    ('Lokhlass', 200, 170, (SELECT id FROM trainer WHERE name = 'Ondine')),
    ('Onix', 160, 145, (SELECT id FROM trainer WHERE name = 'Pierre')),
    ('Racaillou', 110, 110, (SELECT id FROM trainer WHERE name = 'Pierre')),
    ('Miaouss', 100, 86, (SELECT id FROM trainer WHERE name = 'Giovanni')),
    ('Ronflex', 220, 200, NULL);

-- Attaques connues par Pokémon
INSERT INTO pokemon_attack (pokemon_id, attack_id, usage_limit, usage_count) VALUES
    ((SELECT id FROM pokemon WHERE name = 'Pikachu'), (SELECT id FROM attack WHERE name = 'Éclair'), 15, 5),
    ((SELECT id FROM pokemon WHERE name = 'Pikachu'), (SELECT id FROM attack WHERE name = 'Tonnerre'), 10, 2),
    ((SELECT id FROM pokemon WHERE name = 'Pikachu'), (SELECT id FROM attack WHERE name = 'Queue de Fer'), 20, 4),
    ((SELECT id FROM pokemon WHERE name = 'Pikachu'), (SELECT id FROM attack WHERE name = 'Vive-Attaque'), 30, 12),

    ((SELECT id FROM pokemon WHERE name = 'Dracaufeu'), (SELECT id FROM attack WHERE name = 'Flammèche'), 25, 6),
    ((SELECT id FROM pokemon WHERE name = 'Dracaufeu'), (SELECT id FROM attack WHERE name = 'Lance-Flammes'), 15, 3),
    ((SELECT id FROM pokemon WHERE name = 'Dracaufeu'), (SELECT id FROM attack WHERE name = 'Draco-Souffle'), 20, 1),

    ((SELECT id FROM pokemon WHERE name = 'Bulbizarre'), (SELECT id FROM attack WHERE name = 'Vive-Attaque'), 30, 5),
    ((SELECT id FROM pokemon WHERE name = 'Bulbizarre'), (SELECT id FROM attack WHERE name = 'Éclair'), 15, 0),

    ((SELECT id FROM pokemon WHERE name = 'Stari'), (SELECT id FROM attack WHERE name = 'Bulles d''O'), 30, 9),
    ((SELECT id FROM pokemon WHERE name = 'Stari'), (SELECT id FROM attack WHERE name = 'Hydrocanon'), 5, 1),

    ((SELECT id FROM pokemon WHERE name = 'Lokhlass'), (SELECT id FROM attack WHERE name = 'Bulles d''O'), 30, 4),
    ((SELECT id FROM pokemon WHERE name = 'Lokhlass'), (SELECT id FROM attack WHERE name = 'Hydrocanon'), 5, 0),

    ((SELECT id FROM pokemon WHERE name = 'Onix'), (SELECT id FROM attack WHERE name = 'Jet-Pierres'), 20, 6),
    ((SELECT id FROM pokemon WHERE name = 'Onix'), (SELECT id FROM attack WHERE name = 'Tomberoche'), 10, 2),

    ((SELECT id FROM pokemon WHERE name = 'Racaillou'), (SELECT id FROM attack WHERE name = 'Jet-Pierres'), 20, 1),

    ((SELECT id FROM pokemon WHERE name = 'Miaouss'), (SELECT id FROM attack WHERE name = 'Vive-Attaque'), 30, 7),

    ((SELECT id FROM pokemon WHERE name = 'Ronflex'), (SELECT id FROM attack WHERE name = 'Tonnerre'), 10, 0),
    ((SELECT id FROM pokemon WHERE name = 'Ronflex'), (SELECT id FROM attack WHERE name = 'Queue de Fer'), 20, 0);
