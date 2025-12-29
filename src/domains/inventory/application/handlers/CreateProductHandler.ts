import { UseCase } from '../../../../shared/application/UseCase.js';
import { Result } from '../../../../shared/application/Result.js';
import { IProductRepository } from '../../domain/repositories/IProductRepository.js';
import { Product } from '../../domain/entities/Product.js';
import { SKU } from '../../domain/value-objects/SKU.js';
import { Quantity } from '../../domain/value-objects/Quantity.js';
import { Money } from '../../../orders/domain/value-objects/Money.js';
import { CreateProductDto, ProductDto } from '../dto/ProductDto.js';
import { ProductMapper } from '../mappers/ProductMapper.js';

export class CreateProductHandler implements UseCase<CreateProductDto, ProductDto> {
  constructor(private readonly productRepository: IProductRepository) {}

  async execute(request: CreateProductDto): Promise<Result<ProductDto>> {
    try {
      // Check for duplicate barcode if provided
      if (request.barcode) {
        const existing = await this.productRepository.findByBarcode(request.barcode);
        if (existing) {
          return Result.fail(`Product with barcode ${request.barcode} already exists`);
        }
      }

      // Create product entity
      const product = Product.create({
        name: request.name,
        sku: request.sku ? SKU.create(request.sku) : undefined,
        description: request.description,
        categoryId: request.categoryId,
        brandId: request.brandId,
        supplierId: request.supplierId,
        unitId: request.unitId,
        price: Money.create(request.price),
        costPrice: request.costPrice ? Money.create(request.costPrice) : undefined,
        quantity: Quantity.create(request.quantity || 0),
        minStockLevel: request.minStockLevel || 5,
        barcode: request.barcode,
        gtin: request.gtin,
        serialNumbers: request.serialNumbers,
      });

      // Save to repository
      const savedProduct = await this.productRepository.save(product);

      return Result.ok(ProductMapper.toDto(savedProduct));
    } catch (error) {
      if (error instanceof Error) {
        return Result.fail(error.message);
      }
      return Result.fail('Failed to create product');
    }
  }
}
