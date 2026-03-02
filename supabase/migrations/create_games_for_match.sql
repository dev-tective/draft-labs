-- Función para crear games y picks basándose en el best_of de un match
-- Best of 1: crea 1 game
-- Best of 3: crea 5 games (máximo que se puede llegar si van 2-2 y necesitan desempate)
-- Best of 7: crea 13 games
-- Por cada game crea picks para ambos lados (blue y red)
CREATE OR REPLACE FUNCTION create_games_for_match(p_match_id UUID)
RETURNS TABLE (
  games_created INTEGER,
  picks_created INTEGER,
  message TEXT
) 
LANGUAGE plpgsql
AS $$
DECLARE
  v_best_of SMALLINT;
  v_bans_per_team SMALLINT;
  v_games_to_create INTEGER;
  v_picks_per_side INTEGER;
  v_match_exists BOOLEAN;
  v_game_id BIGINT;
  v_total_picks INTEGER := 0;
  i INTEGER;
  j INTEGER;
BEGIN
  -- Verificar si el match existe
  SELECT EXISTS(SELECT 1 FROM matches WHERE id = p_match_id) INTO v_match_exists;
  
  IF NOT v_match_exists THEN
    RETURN QUERY SELECT 0, 0, 'Match no encontrado'::TEXT;
    RETURN;
  END IF;
  
  -- Obtener el best_of y bans_per_team del match
  SELECT best_of, bans_per_team 
  INTO v_best_of, v_bans_per_team 
  FROM matches 
  WHERE id = p_match_id;
  
  -- Determinar cuántos games crear según el best_of
  -- Fórmula: (best_of * 2) - 1
  -- BO1: 1, BO3: 5, BO5: 9, BO7: 13
  v_games_to_create := (v_best_of * 2) - 1;
  
  -- Determinar cuántos picks crear por lado (mínimo 5 o bans_per_team si es mayor)
  v_picks_per_side := GREATEST(5, v_bans_per_team);
  
  -- Crear los games y sus picks
  FOR i IN 1..v_games_to_create LOOP
    -- Crear el game
    INSERT INTO games (match_id, game_number)
    VALUES (p_match_id, i::SMALLINT)
    RETURNING id INTO v_game_id;
    
    -- Crear picks para el lado BLUE
    FOR j IN 1..v_picks_per_side LOOP
      INSERT INTO picks (game_id, team, pick_order, is_locked)
      VALUES (v_game_id, 'blue'::team_side, j::SMALLINT, false);
      v_total_picks := v_total_picks + 1;
    END LOOP;
    
    -- Crear picks para el lado RED
    FOR j IN 1..v_picks_per_side LOOP
      INSERT INTO picks (game_id, team, pick_order, is_locked)
      VALUES (v_game_id, 'red'::team_side, j::SMALLINT, false);
      v_total_picks := v_total_picks + 1;
    END LOOP;
  END LOOP;
  
  RETURN QUERY SELECT 
    v_games_to_create, 
    v_total_picks,
    format('Se crearon %s games y %s picks para el match (Best of %s, %s picks por lado)', 
           v_games_to_create, v_total_picks, v_best_of, v_picks_per_side)::TEXT;
END;
$$;

-- Comentario de la función
COMMENT ON FUNCTION create_games_for_match(UUID) IS 
'Crea games y picks para un match basándose en su best_of y bans_per_team. 
Best of 1 = 1 game, Best of 3 = 5 games, Best of 5 = 7 games, Best of 7 = 13 games.
Cada game tiene mínimo 5 picks por lado (blue/red), o más si bans_per_team es mayor.';

-- Función trigger para ejecutar create_games_for_match automáticamente
CREATE OR REPLACE FUNCTION trigger_create_games_for_match()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Llamar a la función para crear games y picks para el nuevo match
  PERFORM create_games_for_match(NEW.id);
  RETURN NEW;
END;
$$;

-- Trigger que se ejecuta después de insertar un match
CREATE TRIGGER on_match_created
  AFTER INSERT ON matches
  FOR EACH ROW
  EXECUTE FUNCTION trigger_create_games_for_match();
