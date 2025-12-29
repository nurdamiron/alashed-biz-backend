export interface StockLogDto {
  id: number; productId: number; quantityChange: number; quantityBefore: number;
  quantityAfter: number; reason?: string; userId?: number; userName?: string; createdAt: string;
}

export interface ProductDto {
  id: number; name: string; sku?: string; description?: string;
  categoryId?: number; categoryName?: string; brandId?: number; brandName?: string;
  supplierId?: number; supplierName?: string;
  unitId?: number; unitName?: string; price: number; costPrice?: number;
  quantity: number; minStockLevel: number; barcode?: string; gtin?: string;
  serialNumbers?: string[];
  isActive: boolean; isLowStock: boolean; isOutOfStock: boolean;
  images: string[]; createdAt: string; updatedAt: string;
}

export interface CreateProductDto {
  name: string; sku?: string; description?: string; categoryId?: number; brandId?: number;
  supplierId?: number; unitId?: number; price: number; costPrice?: number; quantity?: number;
  minStockLevel?: number; barcode?: string; gtin?: string; serialNumbers?: string[];
}

export interface UpdateProductDto {
  productId: number; name?: string; description?: string; price?: number; costPrice?: number;
  minStockLevel?: number; barcode?: string; gtin?: string; categoryId?: number; brandId?: number; supplierId?: number;
}

export interface AdjustStockDto { productId: number; delta: number; reason?: string; userId?: number; }

export interface ProductsListDto { products: ProductDto[]; total: number; }

export interface GetProductsQueryDto {
  categoryId?: number; brandId?: number; isLowStock?: boolean; isOutOfStock?: boolean; limit?: number; offset?: number;
}

export interface SearchProductsQueryDto { query: string; }
