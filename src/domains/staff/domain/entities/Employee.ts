import { AggregateRoot } from '../../../../shared/domain/AggregateRoot.js';
import { EmployeeId } from '../value-objects/EmployeeId.js';
import { ValidationError } from '../../../../shared/domain/errors/DomainError.js';

export interface EmployeeProps {
  id?: EmployeeId;
  userId?: number;
  name: string;
  department?: string;
  position?: string;
  phone?: string;
  email?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class Employee extends AggregateRoot<EmployeeProps> {
  get id(): EmployeeId | undefined {
    return this.props.id;
  }

  get userId(): number | undefined {
    return this.props.userId;
  }

  get name(): string {
    return this.props.name;
  }

  get department(): string | undefined {
    return this.props.department;
  }

  get position(): string | undefined {
    return this.props.position;
  }

  get phone(): string | undefined {
    return this.props.phone;
  }

  get email(): string | undefined {
    return this.props.email;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  private constructor(props: EmployeeProps) {
    super(props);
  }

  public static create(props: Omit<EmployeeProps, 'id' | 'isActive' | 'createdAt' | 'updatedAt'>): Employee {
    if (!props.name || props.name.trim().length === 0) {
      throw new ValidationError('Employee name is required');
    }

    return new Employee({
      ...props,
      name: props.name.trim(),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  public static fromPersistence(row: any): Employee {
    return new Employee({
      id: EmployeeId.create(row.id),
      userId: row.user_id,
      name: row.name,
      department: row.department,
      position: row.position,
      phone: row.phone,
      email: row.email,
      isActive: row.is_active,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    });
  }

  public update(props: Partial<Pick<EmployeeProps, 'name' | 'department' | 'position' | 'phone' | 'email'>>): void {
    if (props.name !== undefined) {
      if (!props.name || props.name.trim().length === 0) {
        throw new ValidationError('Employee name cannot be empty');
      }
      this.props.name = props.name.trim();
    }

    if (props.department !== undefined) {
      this.props.department = props.department;
    }

    if (props.position !== undefined) {
      this.props.position = props.position;
    }

    if (props.phone !== undefined) {
      this.props.phone = props.phone;
    }

    if (props.email !== undefined) {
      this.props.email = props.email;
    }

    this.props.updatedAt = new Date();
  }

  public deactivate(): void {
    this.props.isActive = false;
    this.props.updatedAt = new Date();
  }

  public activate(): void {
    this.props.isActive = true;
    this.props.updatedAt = new Date();
  }

  public setId(id: EmployeeId): void {
    if (this.props.id) {
      throw new Error('Employee already has an ID');
    }
    this.props.id = id;
  }

  public setUserId(userId: number): void {
    this.props.userId = userId;
    this.props.updatedAt = new Date();
  }
}
