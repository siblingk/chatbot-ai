-- Eliminar las políticas de RLS si existen
DROP POLICY IF EXISTS "Users can vote on messages" ON votes;
DROP POLICY IF EXISTS "Users can update their votes" ON votes;
DROP POLICY IF EXISTS "Users can delete their votes" ON votes;

-- Eliminar los índices si existen
DROP INDEX IF EXISTS votes_chat_id_idx;
DROP INDEX IF EXISTS votes_message_id_idx;

-- Eliminar las restricciones de clave foránea si existen
ALTER TABLE IF EXISTS votes 
  DROP CONSTRAINT IF EXISTS votes_chat_id_fkey,
  DROP CONSTRAINT IF EXISTS votes_message_id_fkey;

-- Finalmente eliminar la tabla si existe
DROP TABLE IF EXISTS votes; 