-- =============================================================
--  PREPZO — Storage Optimization Migration
--  Run this after the main setup script (prepzo_supabase_setup.sql)
--  All statements are idempotent (safe to run more than once)
-- =============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. RESUMES — enforce one row per user so upsert works
-- ─────────────────────────────────────────────────────────────
-- This allows the app to use onConflict: 'user_id' in the upsert.
-- If someone had multiple resume rows, keep only the most recent.
DO $$
BEGIN
    -- Deduplicate: keep only latest resume per user before adding constraint
    DELETE FROM resumes
    WHERE id NOT IN (
        SELECT DISTINCT ON (user_id) id
        FROM resumes
        ORDER BY user_id, created_at DESC
    );

    -- Add unique constraint if it doesn't already exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'resumes_user_id_key' AND conrelid = 'resumes'::regclass
    ) THEN
        ALTER TABLE resumes ADD CONSTRAINT resumes_user_id_key UNIQUE (user_id);
    END IF;
END $$;


-- ─────────────────────────────────────────────────────────────
-- 2. INTERVIEW_MESSAGES — prune function for server-side cleanup
-- ─────────────────────────────────────────────────────────────
-- Optional: can be called manually from Supabase SQL Editor to
-- clean up existing data before deploying the new app version.
CREATE OR REPLACE FUNCTION prune_old_messages(
    p_user_id   uuid,
    p_max_rows  int DEFAULT 200
)
RETURNS int          -- returns number of rows deleted
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_count   int;
    v_excess  int;
    v_deleted int := 0;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM interview_messages
    WHERE user_id = p_user_id;

    IF v_count > p_max_rows THEN
        v_excess := v_count - p_max_rows;

        DELETE FROM interview_messages
        WHERE id IN (
            SELECT id FROM interview_messages
            WHERE user_id = p_user_id
            ORDER BY created_at ASC
            LIMIT v_excess
        );

        GET DIAGNOSTICS v_deleted = ROW_COUNT;
    END IF;

    RETURN v_deleted;
END;
$$;


-- ─────────────────────────────────────────────────────────────
-- 3. ONE-TIME DATA CLEANUP (run manually if needed)
-- ─────────────────────────────────────────────────────────────
-- Uncomment the lines below and run them once to clean existing data.
-- They are commented out so this file is safe to apply as a migration.

-- -- Prune all existing users down to 200 messages
-- DO $$
-- DECLARE r RECORD;
-- BEGIN
--     FOR r IN SELECT DISTINCT user_id FROM interview_messages LOOP
--         PERFORM prune_old_messages(r.user_id, 200);
--     END LOOP;
-- END $$;

-- -- Keep only latest resume per user (already handled by constraint above)
-- -- Clean up old feedback table rows (no longer written to)
-- TRUNCATE TABLE feedback;
