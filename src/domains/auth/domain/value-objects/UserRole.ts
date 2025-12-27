import { ValueObject } from '../../../../shared/domain/ValueObject.js';

export type UserRoleType = 'admin' | 'manager' | 'worker';

interface UserRoleProps {
  value: UserRoleType;
}

export class UserRole extends ValueObject<UserRoleProps> {
  get value(): UserRoleType {
    return this.props.value;
  }

  private constructor(props: UserRoleProps) {
    super(props);
  }

  public static create(role: string): UserRole {
    const validRoles: UserRoleType[] = ['admin', 'manager', 'worker'];

    if (!validRoles.includes(role as UserRoleType)) {
      return new UserRole({ value: 'worker' });
    }

    return new UserRole({ value: role as UserRoleType });
  }

  public static admin(): UserRole {
    return new UserRole({ value: 'admin' });
  }

  public static manager(): UserRole {
    return new UserRole({ value: 'manager' });
  }

  public static worker(): UserRole {
    return new UserRole({ value: 'worker' });
  }

  public isAdmin(): boolean {
    return this.value === 'admin';
  }

  public isManager(): boolean {
    return this.value === 'manager';
  }

  public canManageOrders(): boolean {
    return this.value === 'admin' || this.value === 'manager';
  }

  public canManageInventory(): boolean {
    return this.value === 'admin' || this.value === 'manager';
  }

  public canViewAnalytics(): boolean {
    return this.value === 'admin' || this.value === 'manager';
  }
}
