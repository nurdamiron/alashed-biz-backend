export interface DashboardStatsDto {
  revenue: number;
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  lowStockCount: number;
  outOfStockCount: number;
  activeTasksCount: number;
  completedTasksToday: number;
  totalProducts: number;
  totalCustomers: number;
}

// Sales Report
export interface SalesReportDto {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  completedOrders: number;
  cancelledOrders: number;
  pendingOrders: number;
  period: {
    from: string;
    to: string;
  };
}

// Top Products
export interface TopProductDto {
  productId: number;
  productName: string;
  sku: string;
  categoryName: string | null;
  totalQuantitySold: number;
  totalRevenue: number;
  ordersCount: number;
}

export interface TopProductsDto {
  products: TopProductDto[];
  period: {
    from: string;
    to: string;
  };
}

// Revenue by Period
export interface RevenuePeriodDto {
  date: string;
  revenue: number;
  ordersCount: number;
  averageOrderValue: number;
}

export interface RevenueByPeriodDto {
  data: RevenuePeriodDto[];
  period: 'daily' | 'weekly' | 'monthly';
  totalRevenue: number;
  totalOrders: number;
}

// Sales by Category
export interface SalesByCategoryDto {
  categoryId: number | null;
  categoryName: string;
  totalRevenue: number;
  totalQuantitySold: number;
  ordersCount: number;
  percentage: number;
}

export interface SalesByCategoryReportDto {
  categories: SalesByCategoryDto[];
  totalRevenue: number;
  period: {
    from: string;
    to: string;
  };
}

// Employee Performance
export interface EmployeePerformanceDto {
  employeeId: number;
  employeeName: string;
  department: string;
  position: string;
  ordersProcessed: number;
  totalRevenue: number;
  tasksCompleted: number;
  averageOrderValue: number;
}

export interface EmployeePerformanceReportDto {
  employees: EmployeePerformanceDto[];
  period: {
    from: string;
    to: string;
  };
}

// Low Stock Report
export interface LowStockItemDto {
  productId: number;
  productName: string;
  sku: string;
  categoryName: string | null;
  currentQuantity: number;
  minStockLevel: number;
  difference: number;
  supplierName: string | null;
  lastRestockDate?: string;
}

export interface LowStockReportDto {
  items: LowStockItemDto[];
  outOfStockCount: number;
  lowStockCount: number;
}
