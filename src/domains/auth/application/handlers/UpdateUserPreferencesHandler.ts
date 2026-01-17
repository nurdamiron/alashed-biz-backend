import { UseCase } from '../../../../shared/application/UseCase.js';
import { Result } from '../../../../shared/application/Result.js';
import { query } from '../../../../shared/infrastructure/database/PostgresConnection.js';

export interface UpdatePreferencesDto {
  userId: number;
  theme?: 'light' | 'dark';
}

export class UpdateUserPreferencesHandler implements UseCase<UpdatePreferencesDto, void> {
  async execute(request: UpdatePreferencesDto): Promise<Result<void>> {
    try {
      const { userId, theme } = request;

      // Get current preferences
      const currentResult = await query(
        'SELECT preferences FROM users WHERE id = $1',
        [userId]
      );

      if (currentResult.rows.length === 0) {
        return Result.fail('User not found');
      }

      const currentPrefs = currentResult.rows[0].preferences || {};
      const newPrefs = { ...currentPrefs };

      // Update theme if provided
      if (theme) {
        newPrefs.theme = theme;
      }

      // Update preferences in database
      await query(
        'UPDATE users SET preferences = $1, updated_at = NOW() WHERE id = $2',
        [JSON.stringify(newPrefs), userId]
      );

      return Result.ok();
    } catch (error) {
      if (error instanceof Error) {
        return Result.fail(error.message);
      }
      return Result.fail('Failed to update user preferences');
    }
  }
}
