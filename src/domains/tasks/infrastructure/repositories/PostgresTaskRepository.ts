import { query, transaction } from '../../../../shared/infrastructure/database/PostgresConnection.js';
import { ITaskRepository, TaskFilters, PaginationParams } from '../../domain/repositories/ITaskRepository.js';
import { Task } from '../../domain/entities/Task.js';
import { TaskComment } from '../../domain/entities/TaskComment.js';
import { TaskId } from '../../domain/value-objects/TaskId.js';
import { TaskStatus } from '../../domain/value-objects/TaskStatus.js';

export class PostgresTaskRepository implements ITaskRepository {
  async findById(id: TaskId): Promise<Task | null> {
    const taskResult = await query(
      `SELECT t.*, e.name as assignee_name
       FROM tasks t
       LEFT JOIN employees e ON t.assignee_id = e.id OR t.employee_id = e.id
       WHERE t.id = $1`,
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

    const comments = commentsResult.rows.map((row) => TaskComment.fromPersistence(row));
    return Task.fromPersistence(taskResult.rows[0], comments);
  }

  async findAll(filters?: TaskFilters, pagination?: PaginationParams): Promise<Task[]> {
    let sql = `
      SELECT t.*, e.name as assignee_name
      FROM tasks t
      LEFT JOIN employees e ON t.assignee_id = e.id OR t.employee_id = e.id
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramIndex = 1;

    if (filters?.status) {
      sql += ` AND t.status = $${paramIndex++}`;
      params.push(filters.status.value);
    }

    if (filters?.assigneeId) {
      sql += ` AND (t.assignee_id = $${paramIndex} OR t.employee_id = $${paramIndex++})`;
      params.push(filters.assigneeId);
    }

    if (filters?.priority) {
      sql += ` AND t.priority = $${paramIndex++}`;
      params.push(filters.priority);
    }

    if (filters?.isOverdue) {
      sql += ` AND t.deadline < NOW() AND t.status NOT IN ('completed', 'cancelled')`;
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

    const commentsByTask = this.groupCommentsByTask(commentsResult.rows);

    return result.rows.map((row) => {
      const comments = (commentsByTask.get(row.id) || []).map((c) => TaskComment.fromPersistence(c));
      return Task.fromPersistence(row, comments);
    });
  }

  async save(task: Task): Promise<Task> {
    const result = await query(
      `INSERT INTO tasks (title, description, status, priority, assignee_id, created_by, deadline, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id`,
      [
        task.title,
        task.description,
        task.status.value,
        task.priority.value,
        task.assigneeId,
        task.createdById,
        task.deadline,
        task.createdAt,
        task.updatedAt,
      ]
    );

    task.setId(TaskId.create(result.rows[0].id));
    return task;
  }

  async update(task: Task): Promise<void> {
    await query(
      `UPDATE tasks
       SET title = $1, description = $2, priority = $3, assignee_id = $4, deadline = $5, updated_at = $6
       WHERE id = $7`,
      [
        task.title,
        task.description,
        task.priority.value,
        task.assigneeId,
        task.deadline,
        task.updatedAt,
        task.id?.value,
      ]
    );
  }

  async updateStatus(id: TaskId, status: TaskStatus): Promise<void> {
    const completedAt = status.isCompleted() ? new Date() : null;

    await query(
      `UPDATE tasks SET status = $1, completed_at = $2, updated_at = NOW() WHERE id = $3`,
      [status.value, completedAt, id.value]
    );
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
    let sql = `SELECT COUNT(*) FROM tasks WHERE 1=1`;
    const params: any[] = [];
    let paramIndex = 1;

    if (filters?.status) {
      sql += ` AND status = $${paramIndex++}`;
      params.push(filters.status.value);
    }

    if (filters?.assigneeId) {
      sql += ` AND (assignee_id = $${paramIndex} OR employee_id = $${paramIndex++})`;
      params.push(filters.assigneeId);
    }

    const result = await query(sql, params);
    return parseInt(result.rows[0].count, 10);
  }

  async countByAssignee(assigneeId: number): Promise<number> {
    const result = await query(
      `SELECT COUNT(*) FROM tasks
       WHERE (assignee_id = $1 OR employee_id = $1)
       AND status NOT IN ('completed', 'cancelled')`,
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
}
