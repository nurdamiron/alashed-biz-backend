import { Entity } from '../../../../shared/domain/Entity.js';
import { Email } from '../value-objects/Email.js';
import { UserRole } from '../value-objects/UserRole.js';

export interface UserProps {
  id: number;
  email: Email;
  passwordHash: string;
  fullName: string;
  role: UserRole;
  employeeId?: number;
  lastLogin?: Date;
  preferences?: {
    theme?: 'light' | 'dark';
  };
  createdAt: Date;
  updatedAt: Date;
}

export class User extends Entity<UserProps> {
  get id(): number {
    return this.props.id;
  }

  get email(): Email {
    return this.props.email;
  }

  get passwordHash(): string {
    return this.props.passwordHash;
  }

  get fullName(): string {
    return this.props.fullName;
  }

  get role(): UserRole {
    return this.props.role;
  }

  get employeeId(): number | undefined {
    return this.props.employeeId;
  }

  get lastLogin(): Date | undefined {
    return this.props.lastLogin;
  }

  get preferences(): { theme?: 'light' | 'dark' } | undefined {
    return this.props.preferences;
  }

  public updateLastLogin(): void {
    this.props.lastLogin = new Date();
    this.props.updatedAt = new Date();
  }

  public static create(props: UserProps): User {
    return new User(props);
  }

  public static fromPersistence(row: any): User {
    return new User({
      id: row.id,
      email: Email.create(row.email),
      passwordHash: row.password_hash,
      fullName: row.full_name,
      role: UserRole.create(row.role),
      employeeId: row.employee_id,
      lastLogin: row.last_login ? new Date(row.last_login) : undefined,
      preferences: row.preferences || undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    });
  }
}
