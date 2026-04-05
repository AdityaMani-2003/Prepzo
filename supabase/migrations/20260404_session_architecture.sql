-- Rename legacy interviews table if it exists
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'interviews') THEN
    ALTER TABLE interviews RENAME TO interviews_legacy;
  END IF;
END $$;

-- Create Interview Sessions Table
CREATE TABLE IF NOT EXISTS interview_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    role TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    CONSTRAINT fk_user
      FOREIGN KEY(user_id) 
      REFERENCES auth.users(id)
      ON DELETE CASCADE
);

-- Create Interview Messages Table
CREATE TABLE IF NOT EXISTS interview_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL,
    user_id UUID NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('question', 'answer', 'evaluation')),
    content TEXT NOT NULL,
    score NUMERIC,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    CONSTRAINT fk_session
      FOREIGN KEY(session_id) 
      REFERENCES interview_sessions(id)
      ON DELETE CASCADE,
      
    CONSTRAINT fk_user_message
      FOREIGN KEY(user_id) 
      REFERENCES auth.users(id)
      ON DELETE CASCADE
);
