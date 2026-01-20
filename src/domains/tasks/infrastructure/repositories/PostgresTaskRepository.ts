import { query, transaction } from '../../../../shared/infrastructure/database/PostgresConnection.js';
import { ITaskRepository, TaskFilters, PaginationParams } from '../../domain/repositories/ITaskRepository.js';
import { Task, TaskAssignee } from '../../domain/entities/Task.js';
import { TaskComment } from '../../domain/entities/TaskComment.js';
import { TaskId } from '../../domain/value-objects/TaskId.js';
import { TaskStatus } from '../../domain/value-objects/TaskStatus.js';

export class PostgresTaskRepository implements ITaskRepository {
  async findById(id: TaskId): Promise<Task | null> {
    const taskResult = await query(
      `SELECT t.* FROM tasks t WHERE t.id = $1`,
      [id.value]
    );

    if (taskResult.rows.length === 0) {
      return null;
    }

    const commentsResult = await query(
      `SELECT tc.*, u.full_name as user_name
       FROM task_comments tc
       LEFT JOIN users u ON tc.user_id = u.id
       WHERE tc.task_id = $1
       ORDER BY tc.created_at ASC`,
      [id.value]
    );

    // Загружаем исполнителей из task_assignees
    const assigneesResult = await query(
      `SELECT ta.employee_id as id, e.name
       FROM task_assignees ta
       JOIN employees e ON ta.employee_id = e.id
       WHERE ta.task_id = $1`,
      [id.value]
    );

    const comments = commentsResult.rows.map((row) => TaskComment.fromPersistence(row));
    const assignees: TaskAssignee[] = assigneesResult.rows.map(row => ({ id: row.id, name: row.name }));
    return Task.fromPersistence(taskResult.rows[0], comments, assignees);
  }

  async findAll(filters?: TaskFilters, pagination?: PaginationParams): Promise<Task[]> {
    const params: any[] = [];
    let paramIndex = 1;
    let whereClause = '1=1';

    if (filters?.status) {
      whereClause += ` AND t.status = $${paramIndex++}`;
      params.push(filters.status.value);
    }

    if (filters?.priority) {
      whereClause += ` AND t.priority = $${paramIndex++}`;
      params.push(filters.priority);
    }

    if (filters?.isOverdue) {
      whereClause += ` AND t.deadline < NOW() AND t.status NOT IN ('completed', 'cancelled')`;
    }

    let sql: string;

    if (filters?.assigneeId) {
      // Use subquery when filtering by assignee to avoid DISTINCT issues
      sql = `
        SELECT t.* FROM tasks t
        WHERE t.id IN (
          SELECT ta.task_id FROM task_assignees ta WHERE ta.employee_id = $${paramIndex++}
        ) AND ${whereClause}
      `;
      params.push(filters.assigneeId);
    } else {
      sql = `SELECT t.* FROM tasks t WHERE ${whereClause}`;
    }

    sql += ` ORDER BY
      CASE t.priority
        WHEN 'urgent' THEN 1
        WHEN 'high' THEN 2
        WHEN 'medium' THEN 3
        WHEN 'low' THEN 4
        ELSE 5
      END,
      t.deadline ASC NULLS LAST,
      t.created_at DESC`;

    if (pagination) {
      sql += ` LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
      params.push(pagination.limit, pagination.offset);
    }

    const result = await query(sql, params);

    if (result.rows.length === 0) {
      return [];
    }

    // Batch fetch comments
    const taskIds = result.rows.map((r) => r.id);
    const commentsResult = await query(
      `SELECT tc.*, u.full_name as user_name
       FROM task_comments tc
       LEFT JOIN users u ON tc.user_id = u.id
       WHERE tc.task_id = ANY($1)
       ORDER BY tc.created_at ASC`,
      [taskIds]
    );

    // Batch fetch assignees
    const assigneesResult = await query(
      `SELECT ta.task_id, ta.employee_id as id, e.name
       FROM task_assignees ta
       JOIN employees e ON ta.employee_id = e.id
       WHERE ta.task_id = ANY($1)`,
      [taskIds]
    );

    const commentsByTask = this.groupCommentsByTask(commentsResult.rows);
    const assigneesByTask = this.groupAssigneesByTask(assigneesResult.rows);

    return result.rows.map((row) => {
      const comments = (commentsByTask.get(row.id) || []).map((c) => TaskComment.fromPersistence(c));
      const assignees: TaskAssignee[] = assigneesByTask.get(row.id) || [];
      return Task.fromPersistence(row, comments, assignees);
    });
  }

  async save(task: Task): Promise<Task> {
    // Convert checklist to JSON
    const checklistJson = JSON.stringify(task.checklist.map(item => item.toData()));

    const result = await query(
      `INSERT INTO tasks (title, description, status, priority, created_by, deadline, created_at, updated_at, checklist, attachments)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING id`,
      [
        task.title,
        task.description,
        task.status.value,
        task.priority.value,
        task.createdById,
        task.deadline,
        task.createdAt,
        task.updatedAt,
        checklistJson,
        task.attachments,
      ]
    );

    const taskId = result.rows[0].id;
    task.setId(TaskId.create(taskId));

    // Save assignees to task_assignees table
    if (task.assignees.length > 0) {
      await this.saveAssignees(taskId, task.assignees.map(a => a.id));
    }

    return task;
  }

  async update(task: Task): Promise<void> {
    // Convert checklist to JSON
    const checklistJson = JSON.stringify(task.checklist.map(item => item.toData()));

    await query(
      `UPDATE tasks
       SET title = $1, description = $2, priority = $3, deadline = $4, updated_at = $5, checklist = $6, attachments = $7
       WHERE id = $8`,
      [
        task.title,
        task.description,
        task.priority.value,
        task.deadline,
        task.updatedAt,
        checklistJson,
        task.attachments,
        task.id?.value,
      ]
    );

    // Update assignees
    if (task.id) {
      await this.saveAssignees(task.id.value, task.assignees.map(a => a.id));
    }
  }

  async updateStatus(id: TaskId, status: TaskStatus): Promise<void> {
    const completedAt = status.isCompleted() ? new Date() : null;

    await query(
      `UPDATE tasks SET status = $1, completed_at = $2, updated_at = NOW() WHERE id = $3`,
      [status.value, completedAt, id.value]
    );
  }

  async delete(id: TaskId): Promise<void> {
    // First delete associated comments
    await query(`DELETE FROM task_comments WHERE task_id = $1`, [id.value]);
    // Then delete the task
    await query(`DELETE FROM tasks WHERE id = $1`, [id.value]);
  }

  async addComment(taskId: TaskId, comment: TaskComment): Promise<TaskComment> {
    const result = await query(
      `INSERT INTO task_comments (task_id, user_id, comment, created_at)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [taskId.value, comment.userId, comment.comment, comment.createdAt]
    );

    return TaskComment.fromPersistence({
      id: result.rows[0].id,
      task_id: taskId.value,
      user_id: comment.userId,
      comment: comment.comment,
      created_at: comment.createdAt,
    });
  }

  async count(filters?: TaskFilters): Promise<number> {
    let sql = `SELECT COUNT(DISTINCT t.id) FROM tasks t`;
    const params: any[] = [];
    let paramIndex = 1;
    let hasAssigneeFilter = false;

    if (filters?.assigneeId) {
      sql += ` JOIN task_assignees ta ON t.id = ta.task_id`;
      hasAssigneeFilter = true;
    }

    sql += ` WHERE 1=1`;

    if (filters?.status) {
      sql += ` AND t.status = $${paramIndex++}`;
      params.push(filters.status.value);
    }

    if (hasAssigneeFilter) {
      sql += ` AND ta.employee_id = $${paramIndex++}`;
      params.push(filters!.assigneeId);
    }

    const result = await query(sql, params);
    return parseInt(result.rows[0].count, 10);
  }

  async countByAssignee(assigneeId: number): Promise<number> {
    const result = await query(
      `SELECT COUNT(DISTINCT t.id) FROM tasks t
       JOIN task_assignees ta ON t.id = ta.task_id
       WHERE ta.employee_id = $1
       AND t.status NOT IN ('completed', 'cancelled')`,
      [assigneeId]
    );
    return parseInt(result.rows[0].count, 10);
  }

  private groupCommentsByTask(comments: any[]): Map<number, any[]> {
    const map = new Map<number, any[]>();
    for (const comment of comments) {
      const taskId = comment.task_id;
      if (!map.has(taskId)) {
        map.set(taskId, []);
      }
      map.get(taskId)!.push(comment);
    }
    return map;
  }

  private groupAssigneesByTask(assignees: any[]): Map<number, TaskAssignee[]> {
    const map = new Map<number, TaskAssignee[]>();
    for (const assignee of assignees) {
      const taskId = assignee.task_id;
      if (!map.has(taskId)) {
        map.set(taskId, []);
      }
      map.get(taskId)!.push({ id: assignee.id, name: assignee.name });
    }
    return map;
  }

  async saveAssignees(taskId: number, assigneeIds: number[]): Promise<void> {
    // Удаляем старых исполнителей
    await query('DELETE FROM task_assignees WHERE task_id = $1', [taskId]);

    // Добавляем новых
    if (assigneeIds.length > 0) {
      const values = assigneeIds.map((_, i) => `($1, $${i + 2})`).join(', ');
      await query(
        `INSERT INTO task_assignees (task_id, employee_id) VALUES ${values}`,
        [taskId, ...assigneeIds]
      );
    }
  }
}
