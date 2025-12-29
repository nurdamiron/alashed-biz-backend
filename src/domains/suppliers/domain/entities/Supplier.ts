import { AggregateRoot } from '../../../../shared/domain/AggregateRoot.js';
import { SupplierId } from '../value-objects/SupplierId.js';
import { TIN } from '../value-objects/TIN.js';
import { ValidationError } from '../../../../shared/domain/errors/DomainError.js';

export interface SupplierProps {
  id?: SupplierId;
  name: string;
  tin?: TIN;
  phone?: string;
  email?: string;
  address?: string;
  contactPerson?: string;
  notes?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class Supplier extends AggregateRoot<SupplierProps> {
  get id(): SupplierId | undefined {
    return this.props.id;
  }

  get name(): string {
    return this.props.name;
  }

  get tin(): TIN | undefined {
    return this.props.tin;
  }

  get phone(): string | undefined {
    return this.props.phone;
  }

  get email(): string | undefined {
    return this.props.email;
  }

  get address(): string | undefined {
    return this.props.address;
  }

  get contactPerson(): string | undefined {
    return this.props.contactPerson;
  }

  get notes(): string | undefined {
    return this.props.notes;
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

  private constructor(props: SupplierProps) {
    super(props);
  }

  public static create(
    props: Omit<SupplierProps, 'id' | 'isActive' | 'createdAt' | 'updatedAt'>
  ): Supplier {
    if (!props.name?.trim()) {
      throw new ValidationError('Supplier name is required');
    }

    if (props.email && !Supplier.isValidEmail(props.email)) {
      throw new ValidationError('Invalid email format');
    }

    return new Supplier({
      ...props,
      name: props.name.trim(),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  public static fromPersistence(row: any): Supplier {
    return new Supplier({
      id: SupplierId.create(row.id),
      name: row.name,
      tin: TIN.createOptional(row.tin),
      phone: row.phone,
      email: row.email,
      address: row.address,
      contactPerson: row.contact_person,
      notes: row.notes,
      isActive: row.is_active !== false,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    });
  }

  public update(
    props: Partial<
      Pick<
        SupplierProps,
        'name' | 'tin' | 'phone' | 'email' | 'address' | 'contactPerson' | 'notes'
      >
    >
  ): void {
    if (props.name !== undefined) {
      if (!props.name.trim()) {
        throw new ValidationError('Supplier name cannot be empty');
      }
      this.props.name = props.name.trim();
    }

    if (props.email !== undefined && props.email && !Supplier.isValidEmail(props.email)) {
      throw new ValidationError('Invalid email format');
    }

    Object.assign(this.props, props);
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

  public setId(id: SupplierId): void {
    if (this.props.id) {
      throw new Error('Supplier already has an ID');
    }
    this.props.id = id;
  }

  private static isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
}
