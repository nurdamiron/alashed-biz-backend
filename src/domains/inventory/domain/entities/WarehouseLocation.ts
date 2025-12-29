import { Entity } from '../../../../shared/domain/Entity.js';
import { ValidationError } from '../../../../shared/domain/errors/DomainError.js';

export interface WarehouseLocationProps {
  id?: number;
  code: string;
  name?: string;
  zone?: string;
  aisle?: string;
  rack?: string;
  shelf?: string;
  capacity?: number;
  description?: string;
  isActive: boolean;
  createdAt: Date;
}

export class WarehouseLocation extends Entity<WarehouseLocationProps> {
  get id(): number | undefined {
    return this.props.id;
  }

  get code(): string {
    return this.props.code;
  }

  get name(): string | undefined {
    return this.props.name;
  }

  get zone(): string | undefined {
    return this.props.zone;
  }

  get aisle(): string | undefined {
    return this.props.aisle;
  }

  get rack(): string | undefined {
    return this.props.rack;
  }

  get shelf(): string | undefined {
    return this.props.shelf;
  }

  get capacity(): number | undefined {
    return this.props.capacity;
  }

  get description(): string | undefined {
    return this.props.description;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  private constructor(props: WarehouseLocationProps) {
    super(props);
  }

  public static create(props: Omit<WarehouseLocationProps, 'id' | 'isActive' | 'createdAt'>): WarehouseLocation {
    if (!props.code?.trim()) {
      throw new ValidationError('Location code is required');
    }

    return new WarehouseLocation({
      ...props,
      code: props.code.trim().toUpperCase(),
      isActive: true,
      createdAt: new Date(),
    });
  }

  public static fromPersistence(row: any): WarehouseLocation {
    return new WarehouseLocation({
      id: row.id,
      code: row.code,
      name: row.name,
      zone: row.zone,
      aisle: row.aisle,
      rack: row.rack,
      shelf: row.shelf,
      capacity: row.capacity,
      description: row.description,
      isActive: row.is_active !== false,
      createdAt: new Date(row.created_at),
    });
  }

  public setId(id: number): void {
    if (this.props.id) {
      throw new Error('Location already has an ID');
    }
    this.props.id = id;
  }
}
