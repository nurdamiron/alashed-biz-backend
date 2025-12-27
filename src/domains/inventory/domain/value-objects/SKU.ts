import { ValueObject } from '../../../../shared/domain/ValueObject.js';

interface SKUProps { value: string; }

export class SKU extends ValueObject<SKUProps> {
  get value(): string { return this.props.value; }
  private constructor(props: SKUProps) { super(props); }

  public static create(sku: string): SKU {
    const normalized = sku.trim().toUpperCase();
    return new SKU({ value: normalized });
  }

  public static generate(): SKU {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return new SKU({ value: `SKU-${timestamp}-${random}` });
  }
}
