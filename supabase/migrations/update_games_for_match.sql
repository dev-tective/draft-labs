-- Función para reajustar games cuando cambia el best_of de un match ya iniciado.
-- Los picks de games nuevos se crean automáticamente por el trigger on_game_created.
-- Los picks de games eliminados se borran en cascada.
--
-- Fórmula: (best_of * 2) - 1
-- BO1=1  BO3=5  BO5=9  BO7=13
CREATE OR REPLACE FUNCTION update_games_for_match(p_match_id UUID)
RETURNS TABLE (
  games_added   INTEGER,
  games_removed INTEGER,
  message       TEXT
) 
LANGUAGE plpgsql
AS $$
DECLARE
  v_best_of       SMALLINT;
  v_games_needed  INTEGER;
  v_games_current INTEGER;
  v_match_exists  BOOLEAN;
  v_game_id       UUID;
  v_games_added   INTEGER := 0;
  v_games_removed INTEGER := 0;
  i               INTEGER;
BEGIN
  SELECT EXISTS(SELECT 1 FROM matches WHERE id = p_match_id) INTO v_match_exists;
  
  IF NOT v_match_exists THEN
    RETURN QUERY SELECT 0, 0, 'Match no encontrado'::TEXT;
    RETURN;
  END IF;
  
  SELECT best_of INTO v_best_of FROM matches WHERE id = p_match_id;
  
  v_games_needed := (v_best_of * 2) - 1;
  
  SELECT COUNT(*) INTO v_games_current FROM games WHERE match_id = p_match_id;
  
  -- Eliminar games sobrantes (sus picks se borran en cascada)
  IF v_games_current > v_games_needed THEN
    DELETE FROM games 
    WHERE match_id = p_match_id 
      AND game_number > v_games_needed;
    
    v_games_removed := v_games_current - v_games_needed;
    
  -- Crear games faltantes (los picks los crea el trigger on_game_created)
  ELSIF v_games_current < v_games_needed THEN
    FOR i IN (v_games_current + 1)..v_games_needed LOOP
      INSERT INTO games (match_id, game_number)
      VALUES (p_match_id, i::SMALLINT);
      
      v_games_added := v_games_added + 1;
    END LOOP;
  END IF;
  
  RETURN QUERY SELECT
    v_games_added,
    v_games_removed,
    format('Ajuste completado: %s games agregados, %s eliminados',
           v_games_added, v_games_removed)::TEXT;
END;
$$;

COMMENT ON FUNCTION update_games_for_match(UUID) IS 
'Reajusta la cantidad de games de un match cuando cambia best_of (fórmula: best_of*2-1).
Elimina games sobrantes (picks borrados en cascada) y crea los faltantes.
Los picks de games nuevos son creados automáticamente por el trigger on_game_created.';

-- Función trigger
CREATE OR REPLACE FUNCTION trigger_update_games_for_match()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Solo ejecutar si el match tiene start=true y cambió best_of o bans_per_team
  IF NEW.start = true AND (
    (NEW.best_of IS DISTINCT FROM OLD.best_of) OR 
    (NEW.bans_per_team IS DISTINCT FROM OLD.bans_per_team)
  ) THEN
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
