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
