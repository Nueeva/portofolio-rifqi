BEGIN;
CREATE TABLE IF NOT EXISTS content_records (
 resource text NOT NULL, id text NOT NULL, data jsonb NOT NULL CHECK(jsonb_typeof(data)='object'),
 updated_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(resource,id)
);
CREATE INDEX IF NOT EXISTS content_resource_idx ON content_records(resource);
CREATE TABLE IF NOT EXISTS app_users (id uuid PRIMARY KEY DEFAULT gen_random_uuid(),email text UNIQUE NOT NULL,password_hash text NOT NULL,is_admin boolean NOT NULL DEFAULT false,verified boolean NOT NULL DEFAULT false,created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS app_sessions(token_hash text PRIMARY KEY,user_id uuid NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,expires_at timestamptz NOT NULL);
CREATE TABLE IF NOT EXISTS auth_tokens(token_hash text PRIMARY KEY,user_id uuid NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,purpose text NOT NULL CHECK(purpose IN ('reset','verify')),expires_at timestamptz NOT NULL);
CREATE TABLE IF NOT EXISTS challenges(token_hash text PRIMARY KEY,ip text NOT NULL,expires_at timestamptz NOT NULL);
CREATE TABLE IF NOT EXISTS login_attempts(ip text NOT NULL,email_hash text NOT NULL,created_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS login_attempt_time ON login_attempts(created_at);
CREATE TABLE IF NOT EXISTS uploaded_files(bucket text NOT NULL,path text NOT NULL,filename text NOT NULL,mime text NOT NULL,size integer NOT NULL,created_at timestamptz NOT NULL DEFAULT now(),PRIMARY KEY(bucket,path));
COMMIT;
