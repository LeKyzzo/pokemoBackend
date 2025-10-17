INSERT INTO trainers (name) VALUES
('Sacha') ON CONFLICT DO NOTHING,
('Ondine') ON CONFLICT DO NOTHING;


INSERT INTO pokemons (name, max_life_point, life_point, trainer_id) VALUES
('Pikachu', 35, 35, (SELECT id FROM trainers WHERE name='Sacha')),
('Salamèche', 39, 39, (SELECT id FROM trainers WHERE name='Sacha')),
('Stari', 30, 30, (SELECT id FROM trainers WHERE name='Ondine')),
('Bulbizarre', 45, 45, (SELECT id FROM trainers WHERE name='Ondine'))
ON CONFLICT DO NOTHING;


INSERT INTO attacks (name, damage, usage_limit) VALUES
('Tonnerre', 10, 10),
('Éclair', 6, 15),
('Flammèche', 8, 12),
('Fouet Lianes', 7, 12),
('Pistolet à O', 7, 12)
ON CONFLICT DO NOTHING;


DO $$
DECLARE pk INT; at INT; BEGIN
SELECT id INTO pk FROM pokemons WHERE name='Pikachu';
SELECT id INTO at FROM attacks WHERE name='Tonnerre';
IF pk IS NOT NULL AND at IS NOT NULL THEN
INSERT INTO pokemon_attacks(pokemon_id, attack_id) VALUES (pk, at)
ON CONFLICT DO NOTHING;
END IF;
SELECT id INTO at FROM attacks WHERE name='Éclair';
IF pk IS NOT NULL AND at IS NOT NULL THEN
INSERT INTO pokemon_attacks(pokemon_id, attack_id) VALUES (pk, at)
ON CONFLICT DO NOTHING;
END IF;
END $$;