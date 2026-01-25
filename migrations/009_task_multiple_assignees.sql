-- Migration: Add support for multiple assignees per task
-- Creates a junction table for many-to-many relationship between tasks and employees

-- Create task_assignees junction table
CREATE TABLE IF NOT EXISTS task_assignees (
    id SERIAL PRIMARY KEY,
    task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(task_id, employee_id)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_task_assignees_task_id ON task_assignees(task_id);
CREATE INDEX IF NOT EXISTS idx_task_assignees_employee_id ON task_assignees(employee_id);

-- Migrate existing assignee data to new table
INSERT INTO task_assignees (task_id, employee_id, assigned_at)
SELECT id, assignee_id, created_at
FROM tasks
WHERE assignee_id IS NOT NULL
ON CONFLICT (task_id, employee_id) DO NOTHING;
