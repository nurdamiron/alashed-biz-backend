import { User } from '../entities/User.js';
import { Email } from '../value-objects/Email.js';

export interface IUserRepository {
  findById(id: number): Promise<User | null>;
  findByEmail(email: Email): Promise<User | null>;
  updateLastLogin(userId: number): Promise<void>;
}
