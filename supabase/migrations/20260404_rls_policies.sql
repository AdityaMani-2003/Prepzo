-- ENABLE ROW LEVEL SECURITY
ALTER TABLE interview_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_messages ENABLE ROW LEVEL SECURITY;

-- INTERVIEW_SESSIONS POLICIES
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'interview_sessions_select_policy') THEN
        CREATE POLICY interview_sessions_select_policy ON interview_sessions
            FOR SELECT USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'interview_sessions_insert_policy') THEN
        CREATE POLICY interview_sessions_insert_policy ON interview_sessions
            FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'interview_sessions_update_policy') THEN
        CREATE POLICY interview_sessions_update_policy ON interview_sessions
            FOR UPDATE USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'interview_sessions_delete_policy') THEN
        CREATE POLICY interview_sessions_delete_policy ON interview_sessions
            FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;

-- INTERVIEW_MESSAGES POLICIES
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'interview_messages_select_policy') THEN
        CREATE POLICY interview_messages_select_policy ON interview_messages
            FOR SELECT USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'interview_messages_insert_policy') THEN
        CREATE POLICY interview_messages_insert_policy ON interview_messages
            FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'interview_messages_update_policy') THEN
        CREATE POLICY interview_messages_update_policy ON interview_messages
            FOR UPDATE USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'interview_messages_delete_policy') THEN
        CREATE POLICY interview_messages_delete_policy ON interview_messages
            FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;
