-- Quote history table for daily motivational quotes
CREATE TABLE IF NOT EXISTS quote_history (
    id SERIAL PRIMARY KEY,
    quote TEXT NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_quote_history_sent_at ON quote_history(sent_at DESC);
