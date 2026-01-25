-- Migration: Add last_reminder_sent_at field to tasks table
-- Date: 2026-01-25
-- Description: Track when the last reminder notification was sent for a task

-- Add last_reminder_sent_at column to tasks table
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS last_reminder_sent_at TIMESTAMP;

-- Add index for efficient querying of tasks that need reminders
CREATE INDEX IF NOT EXISTS idx_tasks_last_reminder
ON tasks(last_reminder_sent_at)
WHERE status IN ('pending', 'in_progress') AND deadline IS NOT NULL;

-- Add index for tasks with upcoming deadlines
CREATE INDEX IF NOT EXISTS idx_tasks_deadline_status
ON tasks(deadline, status)
WHERE status IN ('pending', 'in_progress');

-- Comments
COMMENT ON COLUMN tasks.last_reminder_sent_at IS 'Timestamp of when the last reminder notification was sent to the assignee';
