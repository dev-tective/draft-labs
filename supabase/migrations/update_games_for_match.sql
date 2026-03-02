-- Función para actualizar/reajustar games y picks cuando cambia el best_of o bans_per_team
CREATE OR REPLACE FUNCTION update_games_for_match(p_match_id UUID)
RETURNS TABLE (
  games_added INTEGER,
  games_removed INTEGER,
  picks_adjusted INTEGER,
  message TEXT
) 
LANGUAGE plpgsql
AS $$
DECLARE
  v_best_of SMALLINT;
  v_bans_per_team SMALLINT;
  v_games_needed INTEGER;
  v_games_current INTEGER;
  v_picks_per_side INTEGER;
  v_match_exists BOOLEAN;
  v_game_id BIGINT;
  v_games_added INTEGER := 0;
  v_games_removed INTEGER := 0;
  v_picks_adjusted INTEGER := 0;
  v_current_picks INTEGER;
  i INTEGER;
  j INTEGER;
BEGIN
  -- Verificar si el match existe
  SELECT EXISTS(SELECT 1 FROM matches WHERE id = p_match_id) INTO v_match_exists;
  
  IF NOT v_match_exists THEN
    RETURN QUERY SELECT 0, 0, 0, 'Match no encontrado'::TEXT;
    RETURN;
  END IF;
  
  -- Obtener el best_of y bans_per_team del match
  SELECT best_of, bans_per_team 
  INTO v_best_of, v_bans_per_team 
  FROM matches 
  WHERE id = p_match_id;
  
  -- Calcular cuántos games debería tener
  v_games_needed := v_best_of;
  
  -- Determinar cuántos picks debe tener cada lado (mínimo 5)
  v_picks_per_side := GREATEST(5, v_bans_per_team);
  
  -- Contar cuántos games tiene actualmente
  SELECT COUNT(*) INTO v_games_current FROM games WHERE match_id = p_match_id;
  
  -- AJUSTAR GAMES: Eliminar sobrantes o crear faltantes
  IF v_games_current > v_games_needed THEN
    -- Hay más games de los necesarios, eliminar los sobrantes
    DELETE FROM games 
    WHERE match_id = p_match_id 
      AND game_number > v_games_needed;
    
    v_games_removed := v_games_current - v_games_needed;
    
  ELSIF v_games_current < v_games_needed THEN
    -- Faltan games, crear los necesarios
    FOR i IN (v_games_current + 1)..v_games_needed LOOP
      INSERT INTO games (match_id, game_number)
      VALUES (p_match_id, i::SMALLINT)
      RETURNING id INTO v_game_id;
      
      -- Crear picks para el nuevo game
      -- Lado BLUE
      FOR j IN 1..v_picks_per_side LOOP
        INSERT INTO picks (game_id, team, pick_order, is_locked)
        VALUES (v_game_id, 'blue'::team_side, j::SMALLINT, false);
        v_picks_adjusted := v_picks_adjusted + 1;
      END LOOP;
      
      -- Lado RED
      FOR j IN 1..v_picks_per_side LOOP
        INSERT INTO picks (game_id, team, pick_order, is_locked)
        VALUES (v_game_id, 'red'::team_side, j::SMALLINT, false);
        v_picks_adjusted := v_picks_adjusted + 1;
      END LOOP;
      
      v_games_added := v_games_added + 1;
    END LOOP;
  END IF;
  
  -- AJUSTAR PICKS: Para todos los games existentes, verificar cantidad de picks
  FOR v_game_id IN SELECT id FROM games WHERE match_id = p_match_id LOOP
    -- Ajustar picks para BLUE
    SELECT COUNT(*) INTO v_current_picks 
    FROM picks 
    WHERE game_id = v_game_id AND team = 'blue'::team_side;
    
    IF v_current_picks > v_picks_per_side THEN
      -- Eliminar picks sobrantes (de mayor pick_order)
      DELETE FROM picks 
      WHERE game_id = v_game_id 
        AND team = 'blue'::team_side 
        AND pick_order > v_picks_per_side;
      v_picks_adjusted := v_picks_adjusted + (v_current_picks - v_picks_per_side);
      
    ELSIF v_current_picks < v_picks_per_side THEN
      -- Crear picks faltantes
      FOR j IN (v_current_picks + 1)..v_picks_per_side LOOP
        INSERT INTO picks (game_id, team, pick_order, is_locked)
        VALUES (v_game_id, 'blue'::team_side, j::SMALLINT, false);
        v_picks_adjusted := v_picks_adjusted + 1;
      END LOOP;
    END IF;
    
    -- Ajustar picks para RED
    SELECT COUNT(*) INTO v_current_picks 
    FROM picks 
    WHERE game_id = v_game_id AND team = 'red'::team_side;
    
    IF v_current_picks > v_picks_per_side THEN
      -- Eliminar picks sobrantes
      DELETE FROM picks 
      WHERE game_id = v_game_id 
        AND team = 'red'::team_side 
        AND pick_order > v_picks_per_side;
      v_picks_adjusted := v_picks_adjusted + (v_current_picks - v_picks_per_side);
      
    ELSIF v_current_picks < v_picks_per_side THEN
      -- Crear picks faltantes
      FOR j IN (v_current_picks + 1)..v_picks_per_side LOOP
        INSERT INTO picks (game_id, team, pick_order, is_locked)
        VALUES (v_game_id, 'red'::team_side, j::SMALLINT, false);
        v_picks_adjusted := v_picks_adjusted + 1;
      END LOOP;
    END IF;
  END LOOP;
  
  RETURN QUERY SELECT 
    v_games_added,
    v_games_removed,
    v_picks_adjusted,
    format('Ajuste completado: %s games agregados, %s eliminados, %s picks ajustados', 
           v_games_added, v_games_removed, v_picks_adjusted)::TEXT;
END;
$$;

-- Comentario de la función
COMMENT ON FUNCTION update_games_for_match(UUID) IS 
'Actualiza games y picks de un match cuando cambia best_of o bans_per_team.
Elimina games sobrantes, crea faltantes, y ajusta picks (mínimo 5 por lado).';

-- Función trigger para ejecutar update_games_for_match automáticamente
CREATE OR REPLACE FUNCTION trigger_update_games_for_match()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Solo ejecutar si cambió best_of o bans_per_team
  IF (NEW.best_of IS DISTINCT FROM OLD.best_of) OR 
     (NEW.bans_per_team IS DISTINCT FROM OLD.bans_per_team) THEN
    PERFORM update_games_for_match(NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger que se ejecuta después de actualizar un match
CREATE TRIGGER on_match_updated
  AFTER UPDATE ON matches
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_games_for_match();
