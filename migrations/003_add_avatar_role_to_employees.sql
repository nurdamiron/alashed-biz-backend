-- Add avatar and role columns to employees table

ALTER TABLE employees ADD COLUMN IF NOT EXISTS avatar VARCHAR(500);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS role VARCHAR(100);

-- Set default avatars and roles for existing employees
UPDATE employees SET
  avatar = 'https://ui-avatars.com/api/?name=' || REPLACE(name, ' ', '+') || '&background=6366F1&color=fff',
  role = COALESCE(position, 'Сотрудник')
WHERE avatar IS NULL OR role IS NULL;
