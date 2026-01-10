-- Remove user_email column from activity_logs table
-- user_id is sufficient for audit purposes, email can be looked up when needed
ALTER TABLE public.activity_logs DROP COLUMN user_email;