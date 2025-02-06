-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "vector" WITH SCHEMA "public";

-- Create user roles enum and add to auth.users
CREATE TYPE auth.user_role AS ENUM ('user', 'admin');
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS role auth.user_role NOT NULL DEFAULT 'user';

-- Create chats table
CREATE TABLE IF NOT EXISTS public.chats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create messages table
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_id UUID NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create file_uploads table
CREATE TABLE IF NOT EXISTS public.file_uploads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    chat_id UUID NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
    bucket_id TEXT NOT NULL DEFAULT 'chat_attachments',
    storage_path TEXT NOT NULL,
    filename TEXT NOT NULL,
    original_name TEXT NOT NULL,
    content_type TEXT NOT NULL,
    size INTEGER NOT NULL,
    url TEXT NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT file_uploads_unique_version UNIQUE (bucket_id, storage_path, version),
    CONSTRAINT file_uploads_unique_per_chat UNIQUE (user_id, chat_id, filename, version)
);

-- Create votes table
CREATE TABLE IF NOT EXISTS public.votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    vote BOOLEAN NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(message_id, user_id)
);

-- Enable RLS on all tables
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own chats"
    ON public.chats FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own chats"
    ON public.chats FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view messages in their chats"
    ON public.messages FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.chats
            WHERE id = messages.chat_id
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert messages in their chats"
    ON public.messages FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.chats
            WHERE id = chat_id
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert their own files"
    ON public.file_uploads FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own files"
    ON public.file_uploads FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own files"
    ON public.file_uploads FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- Create admin functions
CREATE OR REPLACE FUNCTION auth.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT role = 'admin'
    FROM auth.users
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION auth.set_user_role(user_id UUID, new_role auth.user_role)
RETURNS void AS $$
BEGIN
  IF NOT auth.is_admin() THEN
    RAISE EXCEPTION 'Only administrators can change user roles';
  END IF;

  UPDATE auth.users
  SET role = new_role
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create admin view
CREATE OR REPLACE VIEW auth.users_with_roles AS
SELECT 
  id,
  email,
  role,
  created_at,
  last_sign_in_at,
  raw_user_meta_data
FROM auth.users;

ALTER VIEW auth.users_with_roles OWNER TO authenticated;
GRANT ALL ON auth.users_with_roles TO authenticated;

CREATE POLICY admin_view_users
  ON auth.users_with_roles
  FOR SELECT
  TO authenticated
  USING (auth.is_admin());

-- Create indexes
CREATE INDEX IF NOT EXISTS chats_user_id_idx ON public.chats(user_id);
CREATE INDEX IF NOT EXISTS messages_chat_id_idx ON public.messages(chat_id);
CREATE INDEX IF NOT EXISTS file_uploads_user_id_idx ON public.file_uploads(user_id);
CREATE INDEX IF NOT EXISTS file_uploads_chat_id_idx ON public.file_uploads(chat_id);
CREATE INDEX IF NOT EXISTS votes_message_id_idx ON public.votes(message_id);
CREATE INDEX IF NOT EXISTS votes_user_id_idx ON public.votes(user_id);
