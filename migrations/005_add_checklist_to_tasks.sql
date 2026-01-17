-- Add checklist column to tasks table
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS checklist JSONB DEFAULT '[]'::jsonb;

-- Add index for checklist queries (optional but recommended)
CREATE INDEX IF NOT EXISTS idx_tasks_checklist ON tasks USING GIN (checklist);
