-- Elimina el trigger on_game_created y la función create_picks_for_game.
-- La creación de picks ahora es responsabilidad del SP start_match.

DROP TRIGGER IF EXISTS on_game_created ON games;
DROP FUNCTION IF EXISTS trigger_create_picks_for_game();
DROP FUNCTION IF EXISTS create_picks_for_game(UUID);
