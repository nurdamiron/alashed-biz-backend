import { query } from '../../../../shared/infrastructure/database/PostgresConnection.js';
import { IUserRepository } from '../../domain/repositories/IUserRepository.js';
import { User } from '../../domain/entities/User.js';
import { Email } from '../../domain/value-objects/Email.js';

export class PostgresUserRepository implements IUserRepository {
  async findById(id: number): Promise<User | null> {
    const result = await query(
      `SELECT u.*, e.id as employee_id
       FROM users u
       LEFT JOIN employees e ON e.user_id = u.id
       WHERE u.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return User.fromPersistence(result.rows[0]);
  }

  async findByEmail(email: Email): Promise<User | null> {
    const result = await query(
      `SELECT u.*, e.id as employee_id
       FROM users u
       LEFT JOIN employees e ON e.user_id = u.id
       WHERE u.email = $1`,
      [email.value]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return User.fromPersistence(result.rows[0]);
  }

  async findByUsername(username: string): Promise<User | null> {
    const result = await query(
      `SELECT u.*, e.id as employee_id
       FROM users u
       LEFT JOIN employees e ON e.user_id = u.id
       WHERE u.username = $1`,
      [username]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return User.fromPersistence(result.rows[0]);
  }

  async updateLastLogin(userId: number): Promise<void> {
    await query(
      `UPDATE users SET last_login = NOW(), updated_at = NOW() WHERE id = $1`,
      [userId]
    );
  }
}
