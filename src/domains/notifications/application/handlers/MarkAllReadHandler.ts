import { UseCase } from '../../../../shared/application/UseCase.js';
import { Result } from '../../../../shared/application/Result.js';
import { query } from '../../../../shared/infrastructure/database/PostgresConnection.js';

export class MarkAllReadHandler implements UseCase<{ userId: number }, { success: boolean }> {
  async execute(req: { userId: number }): Promise<Result<{ success: boolean }>> {
    try {
      await query(`UPDATE notifications SET is_read = true, read_at = NOW() WHERE user_id = $1 AND is_read = false`, [req.userId]);
      return Result.ok({ success: true });
    } catch (error) { return Result.fail(error instanceof Error ? error.message : 'Failed'); }
  }
}
