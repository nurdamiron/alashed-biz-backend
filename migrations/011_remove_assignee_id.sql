-- Migration: Remove deprecated assignee_id column from tasks
-- Data has been migrated to task_assignees table in migration 009

-- Drop the deprecated column
ALTER TABLE tasks DROP COLUMN IF EXISTS assignee_id;
