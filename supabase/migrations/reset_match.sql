-- SP: reset_match
-- Resetea un match: borra todos sus games (los picks se eliminan en cascada),
-- establece start=false y opcionalmente elimina los teams indicados.
--
-- Parámetros:
--   p_match_id    UUID    - ID del match a resetear
--   p_team_ids    UUID[]  - IDs de los teams a eliminar (array vacío = no eliminar ninguno)
--
-- Lanza excepciones:
--   P0001 - Match no encontrado

CREATE OR REPLACE FUNCTION reset_match(
  p_match_id  UUID,
  p_team_ids  UUID[] DEFAULT '{}'
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN

  -- =========================================================
  -- 1. Verificar que el match existe
  -- =========================================================
  IF NOT EXISTS (SELECT 1 FROM matches WHERE id = p_match_id) THEN
    RAISE EXCEPTION 'Match not found'
      USING ERRCODE = 'P0001';
  END IF;

  -- =========================================================
  -- 2. Eliminar todos los games del match
  --    Los picks se eliminan en cascada por FK
  -- =========================================================
  DELETE FROM games WHERE match_id = p_match_id;

  -- =========================================================
  -- 3. Eliminar los teams indicados (y sus players en cascada)
  --    Solo los que pertenezcan a este match por seguridad
  -- =========================================================
  IF array_length(p_team_ids, 1) > 0 THEN
    DELETE FROM teams
    WHERE id = ANY(p_team_ids)
      AND match_id = p_match_id;
  END IF;

  -- =========================================================
  -- 4. Marcar el match como no iniciado
  -- =========================================================
  UPDATE matches
  SET start = false
  WHERE id = p_match_id;

END;
$$;

COMMENT ON FUNCTION reset_match(UUID, UUID[]) IS
'Resetea un match: elimina todos sus games (picks en cascada), pone start=false
y opcionalmente borra los teams pasados en p_team_ids (con sus players en cascada).
Solo se eliminan teams que pertenezcan al match indicado.';
