

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pgsodium" WITH SCHEMA "pgsodium";








ALTER SCHEMA "public" OWNER TO "postgres";


CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pg_trgm" WITH SCHEMA "public";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO public.users (id, email, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.created_at, now()),
    COALESCE(NEW.updated_at, now())
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_updated_at"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."chats" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "title" "text",
    "user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."chats" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."documents" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "title" "text" NOT NULL,
    "content" "text",
    "user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."documents" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."messages" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "chat_id" "uuid" NOT NULL,
    "role" "text" NOT NULL,
    "content" "jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."suggestions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "document_id" "uuid" NOT NULL,
    "document_created_at" timestamp with time zone NOT NULL,
    "original_text" "text" NOT NULL,
    "suggested_text" "text" NOT NULL,
    "description" "text",
    "is_resolved" boolean DEFAULT false NOT NULL,
    "user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."suggestions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "email" character varying(64) NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "admin" boolean DEFAULT true
);


ALTER TABLE "public"."users" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."votes" (
    "chat_id" "uuid" NOT NULL,
    "message_id" "uuid" NOT NULL,
    "is_upvoted" boolean NOT NULL
);


ALTER TABLE "public"."votes" OWNER TO "postgres";


ALTER TABLE ONLY "public"."chats"
    ADD CONSTRAINT "chats_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."documents"
    ADD CONSTRAINT "documents_id_created_at_key" UNIQUE ("id", "created_at");



ALTER TABLE ONLY "public"."documents"
    ADD CONSTRAINT "documents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."suggestions"
    ADD CONSTRAINT "suggestions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."votes"
    ADD CONSTRAINT "votes_pkey" PRIMARY KEY ("chat_id", "message_id");



CREATE INDEX "idx_chats_created_at" ON "public"."chats" USING "btree" ("created_at");



CREATE INDEX "idx_chats_updated_at" ON "public"."chats" USING "btree" ("updated_at");



CREATE INDEX "idx_chats_user_id" ON "public"."chats" USING "btree" ("user_id");



CREATE INDEX "idx_documents_content_gin" ON "public"."documents" USING "gin" ("content" "public"."gin_trgm_ops");



CREATE INDEX "idx_documents_created_at" ON "public"."documents" USING "btree" ("created_at");



CREATE INDEX "idx_documents_title_gin" ON "public"."documents" USING "gin" ("title" "public"."gin_trgm_ops");



CREATE INDEX "idx_documents_user_id" ON "public"."documents" USING "btree" ("user_id");



CREATE INDEX "idx_messages_chat_id" ON "public"."messages" USING "btree" ("chat_id");



CREATE INDEX "idx_messages_created_at" ON "public"."messages" USING "btree" ("created_at");



CREATE INDEX "idx_messages_role" ON "public"."messages" USING "btree" ("role");



CREATE INDEX "idx_suggestions_created_at" ON "public"."suggestions" USING "btree" ("created_at");



CREATE INDEX "idx_suggestions_document_id" ON "public"."suggestions" USING "btree" ("document_id");



CREATE INDEX "idx_suggestions_is_resolved" ON "public"."suggestions" USING "btree" ("is_resolved");



CREATE INDEX "idx_suggestions_unresolved" ON "public"."suggestions" USING "btree" ("created_at") WHERE (NOT "is_resolved");



CREATE INDEX "idx_suggestions_user_id" ON "public"."suggestions" USING "btree" ("user_id");



CREATE INDEX "idx_users_created_at" ON "public"."users" USING "btree" ("created_at");



CREATE INDEX "idx_users_email" ON "public"."users" USING "btree" ("email");



CREATE INDEX "idx_votes_chat_id" ON "public"."votes" USING "btree" ("chat_id");



CREATE INDEX "idx_votes_composite" ON "public"."votes" USING "btree" ("message_id", "chat_id");



CREATE INDEX "idx_votes_message_id" ON "public"."votes" USING "btree" ("message_id");



CREATE OR REPLACE TRIGGER "handle_chats_updated_at" BEFORE UPDATE ON "public"."chats" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "handle_users_updated_at" BEFORE UPDATE ON "public"."users" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "handle_votes_updated_at" BEFORE UPDATE ON "public"."votes" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



ALTER TABLE ONLY "public"."chats"
    ADD CONSTRAINT "chats_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."documents"
    ADD CONSTRAINT "documents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_chat_id_fkey" FOREIGN KEY ("chat_id") REFERENCES "public"."chats"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."suggestions"
    ADD CONSTRAINT "suggestions_document_id_document_created_at_fkey" FOREIGN KEY ("document_id", "document_created_at") REFERENCES "public"."documents"("id", "created_at") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."suggestions"
    ADD CONSTRAINT "suggestions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."votes"
    ADD CONSTRAINT "votes_chat_id_fkey" FOREIGN KEY ("chat_id") REFERENCES "public"."chats"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."votes"
    ADD CONSTRAINT "votes_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "public"."messages"("id") ON DELETE CASCADE;



CREATE POLICY "Users can create messages in their chats" ON "public"."messages" FOR INSERT WITH CHECK (("auth"."uid"() IN ( SELECT "chats"."user_id"
   FROM "public"."chats"
  WHERE ("chats"."id" = "messages"."chat_id"))));



CREATE POLICY "Users can create own chats" ON "public"."chats" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can create own documents" ON "public"."documents" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can create own suggestions" ON "public"."suggestions" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can create votes on their chats" ON "public"."votes" FOR INSERT WITH CHECK (("auth"."uid"() IN ( SELECT "chats"."user_id"
   FROM "public"."chats"
  WHERE ("chats"."id" = "votes"."chat_id"))));



CREATE POLICY "Users can delete own chats" ON "public"."chats" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete own documents" ON "public"."documents" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete votes on their chats" ON "public"."votes" FOR DELETE USING (("auth"."uid"() IN ( SELECT "chats"."user_id"
   FROM "public"."chats"
  WHERE ("chats"."id" = "votes"."chat_id"))));



CREATE POLICY "Users can update own chats" ON "public"."chats" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own documents" ON "public"."documents" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own profile" ON "public"."users" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can update votes on their chats" ON "public"."votes" FOR UPDATE USING (("auth"."uid"() IN ( SELECT "chats"."user_id"
   FROM "public"."chats"
  WHERE ("chats"."id" = "votes"."chat_id"))));



CREATE POLICY "Users can view messages from their chats" ON "public"."messages" TO "authenticated" USING ((("chat_id" IN ( SELECT "chats"."id"
   FROM "public"."chats"
  WHERE ("chats"."user_id" = "auth"."uid"()))) OR (EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."admin" = true))))));



CREATE POLICY "Users can view own chats" ON "public"."chats" TO "authenticated" USING ((("auth"."uid"() = "user_id") OR (EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."admin" = true))))));



CREATE POLICY "Users can view own documents" ON "public"."documents" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own profile" ON "public"."users" FOR SELECT USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can view own row" ON "public"."users" TO "authenticated" USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can view own suggestions" ON "public"."suggestions" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view votes on their chats" ON "public"."votes" FOR SELECT USING (("auth"."uid"() IN ( SELECT "chats"."user_id"
   FROM "public"."chats"
  WHERE ("chats"."id" = "votes"."chat_id"))));



ALTER TABLE "public"."chats" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."documents" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."messages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."suggestions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."votes" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


REVOKE USAGE ON SCHEMA "public" FROM PUBLIC;
GRANT USAGE ON SCHEMA "public" TO "authenticated";



































































































































































































GRANT ALL ON TABLE "public"."chats" TO "authenticated";



GRANT ALL ON TABLE "public"."messages" TO "authenticated";



GRANT ALL ON TABLE "public"."users" TO "authenticated";



























RESET ALL;
