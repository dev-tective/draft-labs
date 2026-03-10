-- Elimina la función create_games_for_match y su trigger.
-- Los games ahora se crean exclusivamente por el SP start_match.
-- Los matches se pueden crear sin games (como prueba o borrador).

DROP TRIGGER IF EXISTS on_match_created ON matches;
DROP FUNCTION IF EXISTS trigger_create_games_for_match();
DROP FUNCTION IF EXISTS create_games_for_match(UUID);
