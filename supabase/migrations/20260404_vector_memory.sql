-- Enable the pgvector extension for Native PostGres RAG Operations
CREATE EXTENSION IF NOT EXISTS vector;

-- Create the foundational Resume Vector map
CREATE TABLE IF NOT EXISTS resume_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    embedding vector(768) NOT NULL, -- 768 dimensions directly mapping 'text-embedding-004' from Google Gemini
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Force strict Row Level Security (RLS) on the vector blocks
ALTER TABLE resume_embeddings ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'resume_embeddings_select_policy') THEN
        CREATE POLICY resume_embeddings_select_policy ON resume_embeddings
            FOR SELECT USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'resume_embeddings_insert_policy') THEN
        CREATE POLICY resume_embeddings_insert_policy ON resume_embeddings
            FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'resume_embeddings_delete_policy') THEN
        CREATE POLICY resume_embeddings_delete_policy ON resume_embeddings
            FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;

-- Optimize cosine similarity querying
-- HNSW (Hierarchical Navigable Small World) provides superior query speeds on large datasets compared to IVFFlat
CREATE INDEX IF NOT EXISTS resume_embeddings_embedding_idx ON resume_embeddings USING hnsw (embedding vector_cosine_ops);

-- Establish PostgreSQL RPC (Remote Procedure Call) mapped to the frontend logic for calculating proximity bounds
CREATE OR REPLACE FUNCTION match_resume_chunks(
    query_embedding vector(768),
    match_threshold float,
    match_count int,
    auth_user_id uuid
)
RETURNS TABLE (
    id UUID,
    content TEXT,
    similarity FLOAT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    re.id,
    re.content,
    1 - (re.embedding <=> query_embedding) AS similarity
  FROM resume_embeddings re
  WHERE re.user_id = auth_user_id 
    AND 1 - (re.embedding <=> query_embedding) > match_threshold
  ORDER BY re.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
