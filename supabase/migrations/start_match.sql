-- SP: start_match
-- Inicia un match: crea los games con equipos asignados y los picks
-- con los jugadores activos de cada equipo. Todo en una sola transacción.
--
-- Parámetros:
--   p_match_id     UUID    - ID del match a iniciar
--   p_team_red_id  UUID    - ID del equipo que empieza como ROJO en el game 1
--   p_team_blue_id UUID    - ID del equipo que empieza como AZUL en el game 1
--   p_invert       BOOLEAN - Si es true, los equipos invierten de lado en cada game par
--                            (game 1: A=rojo B=azul, game 2: B=rojo A=azul, etc.)
--
-- Lanza excepciones (catchable como notificaciones en el cliente):
--   P0001 - Match no encontrado o ya iniciado
--   P0002 - El match no tiene 2 equipos
--   P0003 - Ambos team IDs son iguales
--   P0004 - El equipo rojo no pertenece al match
--   P0005 - El equipo azul no pertenece al match
--   P0006 - Equipo rojo sin jugadores activos
--   P0007 - Equipo azul sin jugadores activos

CREATE OR REPLACE FUNCTION start_match(
  p_match_id     UUID,
  p_team_red_id  UUID,
  p_team_blue_id UUID,
  p_invert       BOOLEAN DEFAULT false
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  v_best_of         SMALLINT;
  v_bans_per_team   SMALLINT;
  v_picks_per_side  INTEGER;
  v_games_to_create INTEGER;
  v_game_id         UUID;
  v_game_red_id     UUID;
  v_game_blue_id    UUID;
  v_player          RECORD;
  v_pick_order      SMALLINT;
  i                 INTEGER;
BEGIN

  -- =========================================================
  -- 1. Verificar que el match existe y no ha sido iniciado
  -- =========================================================
  SELECT best_of, bans_per_team
  INTO v_best_of, v_bans_per_team
  FROM matches
  WHERE id = p_match_id
    AND start = false;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Match not found or already started'
      USING ERRCODE = 'P0001';
  END IF;

  -- =========================================================
  -- 2. Verificar que el match tiene exactamente 2 equipos
  -- =========================================================
  IF (SELECT COUNT(*) FROM teams WHERE match_id = p_match_id) < 2 THEN
    RAISE EXCEPTION 'Match must have 2 teams before it can be started'
      USING ERRCODE = 'P0002';
  END IF;

  -- =========================================================
  -- 3. Verificar que los equipos son distintos y pertenecen al match
  -- =========================================================
  IF p_team_red_id = p_team_blue_id THEN
    RAISE EXCEPTION 'Red team and blue team cannot be the same'
      USING ERRCODE = 'P0003';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM teams WHERE id = p_team_red_id AND match_id = p_match_id
  ) THEN
    RAISE EXCEPTION 'Red team does not belong to this match'
      USING ERRCODE = 'P0004';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM teams WHERE id = p_team_blue_id AND match_id = p_match_id
  ) THEN
    RAISE EXCEPTION 'Blue team does not belong to this match'
      USING ERRCODE = 'P0005';
  END IF;

  -- =========================================================
  -- 4. Verificar que cada equipo tiene al menos 5 jugadores activos
  --    (sin restricción de lane para permitir partidas informales)
  -- =========================================================
  IF (SELECT COUNT(*) FROM players WHERE team_id = p_team_red_id AND is_active = true) < 5 THEN
    RAISE EXCEPTION 'Red team needs at least 5 active players (currently has %)',
      (SELECT COUNT(*) FROM players WHERE team_id = p_team_red_id AND is_active = true)
      USING ERRCODE = 'P0006';
  END IF;

  IF (SELECT COUNT(*) FROM players WHERE team_id = p_team_blue_id AND is_active = true) < 5 THEN
    RAISE EXCEPTION 'Blue team needs at least 5 active players (currently has %)',
      (SELECT COUNT(*) FROM players WHERE team_id = p_team_blue_id AND is_active = true)
      USING ERRCODE = 'P0007';
  END IF;

  -- =========================================================
  -- 5. Calcular la cantidad de picks por equipo por game
  --    picks_por_lado = GREATEST(5, bans_per_team)
  --    Fórmula games: best_of * 2 - 1
  --    BO1=1  BO3=5  BO5=9  BO7=13
  --
  --    p_invert = false → mismo lado en todos los games
  --    p_invert = true  → equipos invierten en games pares (2, 4, 6…)
  -- =========================================================
  v_picks_per_side  := GREATEST(5, v_bans_per_team);
  v_games_to_create := (v_best_of * 2) - 1;

  FOR i IN 1..v_games_to_create LOOP

    -- Determinar qué equipo va en cada lado para este game
    IF p_invert AND (i % 2 = 0) THEN
      v_game_red_id  := p_team_blue_id;
      v_game_blue_id := p_team_red_id;
    ELSE
      v_game_red_id  := p_team_red_id;
      v_game_blue_id := p_team_blue_id;
    END IF;

    -- Insertar el game
    INSERT INTO games (match_id, game_number, team_red_id, team_blue_id)
    VALUES (p_match_id, i::SMALLINT, v_game_red_id, v_game_blue_id)
    RETURNING id INTO v_game_id;

    -- ---------------------------------------------------------
    -- Picks del equipo ROJO
    -- Los jugadores activos se asignan en orden; slots restantes
    -- quedan con player_id = NULL si hay menos que v_picks_per_side
    -- ---------------------------------------------------------
    v_pick_order := 1;
    FOR v_player IN
      SELECT id, "order"
      FROM players
      WHERE team_id = v_game_red_id
        AND is_active = true
      ORDER BY "order" ASC NULLS LAST
      LIMIT v_picks_per_side
    LOOP
      INSERT INTO picks (game_id, team_id, player_id, pick_order)
      VALUES (
        v_game_id,
        v_game_red_id,
        v_player.id,
        COALESCE(v_player."order", v_pick_order)
      );
      v_pick_order := v_pick_order + 1;
    END LOOP;

    -- Relleno con slots vacíos si hay menos jugadores que picks requeridos
    WHILE v_pick_order <= v_picks_per_side LOOP
      INSERT INTO picks (game_id, team_id, player_id, pick_order)
      VALUES (v_game_id, v_game_red_id, NULL, v_pick_order);
      v_pick_order := v_pick_order + 1;
    END LOOP;

    -- ---------------------------------------------------------
    -- Picks del equipo AZUL
    -- ---------------------------------------------------------
    v_pick_order := 1;
    FOR v_player IN
      SELECT id, "order"
      FROM players
      WHERE team_id = v_game_blue_id
        AND is_active = true
      ORDER BY "order" ASC NULLS LAST
      LIMIT v_picks_per_side
    LOOP
      INSERT INTO picks (game_id, team_id, player_id, pick_order)
      VALUES (
        v_game_id,
        v_game_blue_id,
        v_player.id,
        COALESCE(v_player."order", v_pick_order)
      );
      v_pick_order := v_pick_order + 1;
    END LOOP;

    WHILE v_pick_order <= v_picks_per_side LOOP
      INSERT INTO picks (game_id, team_id, player_id, pick_order)
      VALUES (v_game_id, v_game_blue_id, NULL, v_pick_order);
      v_pick_order := v_pick_order + 1;
    END LOOP;

  END LOOP;

  -- =========================================================
  -- 6. Marcar el match como iniciado
  -- =========================================================
  UPDATE matches
  SET start = true
  WHERE id = p_match_id;

END;
$$;

COMMENT ON FUNCTION start_match(UUID, UUID, UUID, BOOLEAN) IS
'Inicia un match en una sola transacción: valida equipos y jugadores activos (sin restricción de lane),
crea (best_of*2-1) games con team_red_id y team_blue_id, y genera los picks por jugador activo.
picks_por_lado = GREATEST(5, bans_per_team). Con p_invert=true los equipos invierten en games pares.
Lanza excepciones para que el cliente las capture como notificaciones.';
