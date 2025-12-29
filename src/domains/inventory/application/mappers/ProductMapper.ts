import { Product } from '../../domain/entities/Product.js';
import { StockLog } from '../../domain/entities/StockLog.js';
import { ProductDto, StockLogDto } from '../dto/ProductDto.js';

export class ProductMapper {
  static toDto(product: Product): ProductDto {
    return {
      id: product.id?.value ?? 0, name: product.name, sku: product.sku?.value,
      description: product.description, categoryId: product.categoryId, categoryName: product.categoryName,
      brandId: product.brandId, brandName: product.brandName,
      supplierId: product.supplierId, supplierName: product.supplierName,
      unitId: product.unitId, unitName: product.unitName,
      price: product.price.amount, costPrice: product.costPrice?.amount, quantity: product.quantity.value,
      minStockLevel: product.minStockLevel, barcode: product.barcode, gtin: product.gtin,
      serialNumbers: product.serialNumbers,
      isActive: product.isActive,
      isLowStock: product.isLowStock, isOutOfStock: product.isOutOfStock, images: product.images,
      createdAt: product.createdAt.toISOString(), updatedAt: product.updatedAt.toISOString(),
    };
  }

  static toDtoList(products: Product[]): ProductDto[] { return products.map(this.toDto); }

  static logToDto(log: StockLog): StockLogDto {
    return {
      id: log.id ?? 0, productId: log.productId, quantityChange: log.quantityChange,
      quantityBefore: log.quantityBefore, quantityAfter: log.quantityAfter, reason: log.reason,
      userId: log.userId, userName: log.userName, createdAt: log.createdAt.toISOString(),
    };
  }
}
