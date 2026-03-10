-- SP: swap_game_teams
-- Intercambia los equipos rojo y azul para un game en específico.
-- Esto da el efecto de "cambiar de lado" en el draft/pre-game.
-- Reasigna también los picks existentes para reflejar a qué equipo corresponden.

CREATE OR REPLACE FUNCTION swap_game_teams(
  p_game_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  v_old_team_red_id  UUID;
  v_old_team_blue_id UUID;
BEGIN
  -- 1. Obtener los equipos actuales para el game
  SELECT team_red_id, team_blue_id
  INTO v_old_team_red_id, v_old_team_blue_id
  FROM games
  WHERE id = p_game_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Game not found' USING ERRCODE = 'P0001';
  END IF;

  -- 2. Actualizar el game invirtiendo los team_ids
  UPDATE games
  SET team_red_id = v_old_team_blue_id,
      team_blue_id = v_old_team_red_id
  WHERE id = p_game_id;

  -- 3. Actualizar los picks que pertenecían al antiguo equipo rojo para que ahora apunten al nuevo lado azul (ya que el equipo físico es el mismo, pero cambian de lado en el draft).
  -- NOTA: Dado que los "picks" tienen un "team_id", si el equipo rojo pasa a ser el lado azul, el team_id en sí *no cambia*,
  -- PERO los picks siguen enlazados al team_id original. Sin embargo, en tu lógica, los picks no tienen concepto
  -- de "lado" (red/blue) sino de "team_id". Si el equipo es el mismo, los picks no deberían tener que
  -- cambiar de team_id, PEEERO... 
  -- Al cambiar de equipo en "games", si visualmente o en lógica se espera que el equipo con team_red_id
  -- re-genere los picks u otra cosa, podría haber conflictos de "pick_order" entre lados si los diferenciabas por lado.
  -- 
  -- En tu BBDD actual (`picks` table), el pick tiene `game_id`, `team_id`, `player_id`. 
  -- Al actualizar `team_red_id` y `team_blue_id` en `games`, el join `games.team_red_id = picks.team_id` 
  -- automáticamente los pondrá del lado correcto de la UI.
  -- Así que los registros de la tabla `picks` en realidad NO NECESITAN cambiarse. 
  -- El cambio de `team_red_id`/`team_blue_id` en la tabla `games` es suficiente.

END;
$$;
