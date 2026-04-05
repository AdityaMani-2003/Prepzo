-- Enable RLS for analytical tables
ALTER TABLE interview_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid duplicates
DROP POLICY IF EXISTS "Allow insert sessions" ON interview_sessions;
DROP POLICY IF EXISTS "Allow select sessions" ON interview_sessions;
DROP POLICY IF EXISTS "Allow insert messages" ON interview_messages;
DROP POLICY IF EXISTS "Allow select messages" ON interview_messages;

-- Create Policies for interview_sessions
CREATE POLICY "Allow insert sessions"
ON interview_sessions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow select sessions"
ON interview_sessions
FOR SELECT
USING (auth.uid() = user_id);

-- Create Policies for interview_messages
CREATE POLICY "Allow insert messages"
ON interview_messages
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow select messages"
ON interview_messages
FOR SELECT
USING (auth.uid() = user_id);
