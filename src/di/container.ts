// Auth
import { PostgresUserRepository } from '../domains/auth/infrastructure/repositories/PostgresUserRepository.js';
import { LoginHandler } from '../domains/auth/application/handlers/LoginHandler.js';
import { GetCurrentUserHandler } from '../domains/auth/application/handlers/GetCurrentUserHandler.js';
import { RefreshTokenHandler } from '../domains/auth/application/handlers/RefreshTokenHandler.js';
import { UpdateUserPreferencesHandler } from '../domains/auth/application/handlers/UpdateUserPreferencesHandler.js';

// Orders
import { PostgresOrderRepository } from '../domains/orders/infrastructure/repositories/PostgresOrderRepository.js';
import { CreateOrderHandler } from '../domains/orders/application/handlers/CreateOrderHandler.js';
import { GetOrdersHandler } from '../domains/orders/application/handlers/GetOrdersHandler.js';
import { GetOrderByIdHandler } from '../domains/orders/application/handlers/GetOrderByIdHandler.js';
import { UpdateOrderStatusHandler } from '../domains/orders/application/handlers/UpdateOrderStatusHandler.js';
import { SearchOrdersHandler } from '../domains/orders/application/handlers/SearchOrdersHandler.js';
import { CancelOrderHandler } from '../domains/orders/application/handlers/CancelOrderHandler.js';

// Tasks
import { PostgresTaskRepository } from '../domains/tasks/infrastructure/repositories/PostgresTaskRepository.js';
import { CreateTaskHandler } from '../domains/tasks/application/handlers/CreateTaskHandler.js';
import { GetTasksHandler } from '../domains/tasks/application/handlers/GetTasksHandler.js';
import { GetTaskByIdHandler } from '../domains/tasks/application/handlers/GetTaskByIdHandler.js';
import { UpdateTaskHandler } from '../domains/tasks/application/handlers/UpdateTaskHandler.js';
import { UpdateTaskStatusHandler } from '../domains/tasks/application/handlers/UpdateTaskStatusHandler.js';
import { AddTaskCommentHandler } from '../domains/tasks/application/handlers/AddTaskCommentHandler.js';
import { DeleteTaskHandler } from '../domains/tasks/application/handlers/DeleteTaskHandler.js';

// Inventory
import { PostgresProductRepository } from '../domains/inventory/infrastructure/repositories/PostgresProductRepository.js';
import { GetProductsHandler } from '../domains/inventory/application/handlers/GetProductsHandler.js';
import { GetProductByIdHandler } from '../domains/inventory/application/handlers/GetProductByIdHandler.js';
import { SearchProductsHandler } from '../domains/inventory/application/handlers/SearchProductsHandler.js';
import { UpdateProductHandler } from '../domains/inventory/application/handlers/UpdateProductHandler.js';
import { AdjustStockHandler } from '../domains/inventory/application/handlers/AdjustStockHandler.js';
import { GetStockLogsHandler } from '../domains/inventory/application/handlers/GetStockLogsHandler.js';
import { CreateProductHandler } from '../domains/inventory/application/handlers/CreateProductHandler.js';
import { DeleteProductHandler } from '../domains/inventory/application/handlers/DeleteProductHandler.js';

// Analytics
import { GetDashboardStatsHandler } from '../domains/analytics/application/handlers/GetDashboardStatsHandler.js';
import { GetSalesReportHandler } from '../domains/analytics/application/handlers/GetSalesReportHandler.js';
import { GetTopProductsHandler } from '../domains/analytics/application/handlers/GetTopProductsHandler.js';
import { GetRevenueByPeriodHandler } from '../domains/analytics/application/handlers/GetRevenueByPeriodHandler.js';
import { GetSalesByCategoryHandler } from '../domains/analytics/application/handlers/GetSalesByCategoryHandler.js';
import { GetEmployeePerformanceHandler } from '../domains/analytics/application/handlers/GetEmployeePerformanceHandler.js';
import { GetLowStockReportHandler } from '../domains/analytics/application/handlers/GetLowStockReportHandler.js';

// Staff
import { PostgresEmployeeRepository } from '../domains/staff/infrastructure/repositories/PostgresEmployeeRepository.js';
import { GetStaffHandler } from '../domains/staff/application/handlers/GetStaffHandler.js';
import { GetEmployeesHandler } from '../domains/staff/application/handlers/GetEmployeesHandler.js';
import { GetEmployeeByIdHandler } from '../domains/staff/application/handlers/GetEmployeeByIdHandler.js';
import { CreateEmployeeHandler } from '../domains/staff/application/handlers/CreateEmployeeHandler.js';
import { UpdateEmployeeHandler } from '../domains/staff/application/handlers/UpdateEmployeeHandler.js';
import { DeleteEmployeeHandler } from '../domains/staff/application/handlers/DeleteEmployeeHandler.js';

// Notifications
import { GetNotificationsHandler } from '../domains/notifications/application/handlers/GetNotificationsHandler.js';
import { MarkAllReadHandler } from '../domains/notifications/application/handlers/MarkAllReadHandler.js';
import { NotificationService } from '../domains/notifications/infrastructure/services/NotificationService.js';

// WebSocket
import { WebSocketService } from '../shared/infrastructure/websocket/WebSocketService.js';

// AI
import { GeminiProvider } from '../domains/ai/infrastructure/providers/GeminiProvider.js';
import { SendMessageHandler } from '../domains/ai/application/handlers/SendMessageHandler.js';

// Suppliers
import { PostgresSupplierRepository } from '../domains/suppliers/infrastructure/repositories/PostgresSupplierRepository.js';
import { CreateSupplierHandler } from '../domains/suppliers/application/handlers/CreateSupplierHandler.js';
import { GetSuppliersHandler } from '../domains/suppliers/application/handlers/GetSuppliersHandler.js';
import { GetSupplierByIdHandler } from '../domains/suppliers/application/handlers/GetSupplierByIdHandler.js';
import { UpdateSupplierHandler } from '../domains/suppliers/application/handlers/UpdateSupplierHandler.js';
import { DeleteSupplierHandler } from '../domains/suppliers/application/handlers/DeleteSupplierHandler.js';

// Fiscal
import { WebkassaProvider } from '../domains/fiscal/infrastructure/providers/WebkassaProvider.js';
import { CreateFiscalReceiptHandler } from '../domains/fiscal/application/handlers/CreateFiscalReceiptHandler.js';
import { GetFiscalReceiptByOrderIdHandler } from '../domains/fiscal/application/handlers/GetFiscalReceiptByOrderIdHandler.js';

// Inventory Extensions
import { ReceiveGoodsHandler } from '../domains/inventory/application/handlers/ReceiveGoodsHandler.js';
import { ReserveStockHandler } from '../domains/inventory/application/handlers/ReserveStockHandler.js';
import { ReleaseStockHandler } from '../domains/inventory/application/handlers/ReleaseStockHandler.js';
import { CompleteStockReservationHandler } from '../domains/inventory/application/handlers/CompleteStockReservationHandler.js';
import { GetWarehouseLocationsHandler } from '../domains/inventory/application/handlers/GetWarehouseLocationsHandler.js';
import { CreateWarehouseLocationHandler } from '../domains/inventory/application/handlers/CreateWarehouseLocationHandler.js';
import { GetProductLocationsHandler } from '../domains/inventory/application/handlers/GetProductLocationsHandler.js';

// DI Container Interface
export interface Container {
  // Auth
  userRepository: PostgresUserRepository;
  loginHandler: LoginHandler;
  getCurrentUserHandler: GetCurrentUserHandler;
  refreshTokenHandler: RefreshTokenHandler;
  updateUserPreferencesHandler: UpdateUserPreferencesHandler;

  // Orders
  orderRepository: PostgresOrderRepository;
  createOrderHandler: CreateOrderHandler;
  getOrdersHandler: GetOrdersHandler;
  getOrderByIdHandler: GetOrderByIdHandler;
  updateOrderStatusHandler: UpdateOrderStatusHandler;
  searchOrdersHandler: SearchOrdersHandler;
  cancelOrderHandler: CancelOrderHandler;

  // Tasks
  taskRepository: PostgresTaskRepository;
  createTaskHandler: CreateTaskHandler;
  getTasksHandler: GetTasksHandler;
  getTaskByIdHandler: GetTaskByIdHandler;
  updateTaskHandler: UpdateTaskHandler;
  updateTaskStatusHandler: UpdateTaskStatusHandler;
  addTaskCommentHandler: AddTaskCommentHandler;
  deleteTaskHandler: DeleteTaskHandler;

  // Inventory
  productRepository: PostgresProductRepository;
  getProductsHandler: GetProductsHandler;
  getProductByIdHandler: GetProductByIdHandler;
  searchProductsHandler: SearchProductsHandler;
  createProductHandler: CreateProductHandler;
  updateProductHandler: UpdateProductHandler;
  deleteProductHandler: DeleteProductHandler;
  adjustStockHandler: AdjustStockHandler;
  getStockLogsHandler: GetStockLogsHandler;
  receiveGoodsHandler: ReceiveGoodsHandler;
  reserveStockHandler: ReserveStockHandler;
  releaseStockHandler: ReleaseStockHandler;
  completeStockReservationHandler: CompleteStockReservationHandler;
  getWarehouseLocationsHandler: GetWarehouseLocationsHandler;
  createWarehouseLocationHandler: CreateWarehouseLocationHandler;
  getProductLocationsHandler: GetProductLocationsHandler;

  // Analytics
  getDashboardStatsHandler: GetDashboardStatsHandler;
  getSalesReportHandler: GetSalesReportHandler;
  getTopProductsHandler: GetTopProductsHandler;
  getRevenueByPeriodHandler: GetRevenueByPeriodHandler;
  getSalesByCategoryHandler: GetSalesByCategoryHandler;
  getEmployeePerformanceHandler: GetEmployeePerformanceHandler;
  getLowStockReportHandler: GetLowStockReportHandler;

  // Staff
  employeeRepository: PostgresEmployeeRepository;
  getStaffHandler: GetStaffHandler; // Legacy - deprecated
  getEmployeesHandler: GetEmployeesHandler;
  getEmployeeByIdHandler: GetEmployeeByIdHandler;
  createEmployeeHandler: CreateEmployeeHandler;
  updateEmployeeHandler: UpdateEmployeeHandler;
  deleteEmployeeHandler: DeleteEmployeeHandler;

  // Notifications
  notificationService: NotificationService;
  getNotificationsHandler: GetNotificationsHandler;
  markAllReadHandler: MarkAllReadHandler;

  // WebSocket
  webSocketService: WebSocketService;

  // AI
  geminiProvider: GeminiProvider;
  sendMessageHandler: SendMessageHandler;

  // Suppliers
  supplierRepository: PostgresSupplierRepository;
  createSupplierHandler: CreateSupplierHandler;
  getSuppliersHandler: GetSuppliersHandler;
  getSupplierByIdHandler: GetSupplierByIdHandler;
  updateSupplierHandler: UpdateSupplierHandler;
  deleteSupplierHandler: DeleteSupplierHandler;

  // Fiscal
  webkassaProvider: WebkassaProvider;
  createFiscalReceiptHandler: CreateFiscalReceiptHandler;
  getFiscalReceiptByOrderIdHandler: GetFiscalReceiptByOrderIdHandler;
}

let container: Container | null = null;

export function initContainer(): Container {
  if (container) {
    return container;
  }

  // ==================== Repositories ====================
  const userRepository = new PostgresUserRepository();
  const orderRepository = new PostgresOrderRepository();
  const taskRepository = new PostgresTaskRepository();
  const productRepository = new PostgresProductRepository();
  const supplierRepository = new PostgresSupplierRepository();
  const employeeRepository = new PostgresEmployeeRepository();

  // ==================== Providers ====================
  const geminiProvider = new GeminiProvider();
  const webkassaProvider = new WebkassaProvider();

  // ==================== Services ====================
  const webSocketService = new WebSocketService();
  const notificationService = new NotificationService();
  notificationService.setWebSocketService(webSocketService);

  // ==================== Auth Handlers ====================
  const loginHandler = new LoginHandler(userRepository);
  const getCurrentUserHandler = new GetCurrentUserHandler(userRepository);
  const refreshTokenHandler = new RefreshTokenHandler(userRepository);
  const updateUserPreferencesHandler = new UpdateUserPreferencesHandler();

  // ==================== Inventory Stock Handlers (должны быть перед Orders) ====================
  const reserveStockHandler = new ReserveStockHandler(notificationService);
  const releaseStockHandler = new ReleaseStockHandler();
  const completeStockReservationHandler = new CompleteStockReservationHandler();

  // ==================== Fiscal Handlers ====================
  const createFiscalReceiptHandler = new CreateFiscalReceiptHandler(webkassaProvider);
  const getFiscalReceiptByOrderIdHandler = new GetFiscalReceiptByOrderIdHandler();

  // ==================== Orders Handlers ====================
  const createOrderHandler = new CreateOrderHandler(orderRepository, reserveStockHandler, notificationService);
  const getOrdersHandler = new GetOrdersHandler(orderRepository);
  const getOrderByIdHandler = new GetOrderByIdHandler(orderRepository);
  const updateOrderStatusHandler = new UpdateOrderStatusHandler(
    orderRepository,
    completeStockReservationHandler,
    releaseStockHandler,
    createFiscalReceiptHandler
  );
  const searchOrdersHandler = new SearchOrdersHandler(orderRepository);
  const cancelOrderHandler = new CancelOrderHandler(orderRepository, releaseStockHandler);

  // ==================== Tasks Handlers ====================
  const createTaskHandler = new CreateTaskHandler(taskRepository, notificationService);
  const getTasksHandler = new GetTasksHandler(taskRepository);
  const getTaskByIdHandler = new GetTaskByIdHandler(taskRepository);
  const updateTaskHandler = new UpdateTaskHandler(taskRepository);
  const updateTaskStatusHandler = new UpdateTaskStatusHandler(taskRepository);
  const addTaskCommentHandler = new AddTaskCommentHandler(taskRepository);
  const deleteTaskHandler = new DeleteTaskHandler(taskRepository);

  // ==================== Inventory Handlers ====================
  const getProductsHandler = new GetProductsHandler(productRepository);
  const getProductByIdHandler = new GetProductByIdHandler(productRepository);
  const searchProductsHandler = new SearchProductsHandler(productRepository);
  const createProductHandler = new CreateProductHandler(productRepository);
  const updateProductHandler = new UpdateProductHandler(productRepository);
  const deleteProductHandler = new DeleteProductHandler(productRepository);
  const adjustStockHandler = new AdjustStockHandler(productRepository);
  const getStockLogsHandler = new GetStockLogsHandler(productRepository);
  const receiveGoodsHandler = new ReceiveGoodsHandler(productRepository);
  const getWarehouseLocationsHandler = new GetWarehouseLocationsHandler();
  const createWarehouseLocationHandler = new CreateWarehouseLocationHandler();
  const getProductLocationsHandler = new GetProductLocationsHandler();

  // ==================== Analytics Handlers ====================
  const getDashboardStatsHandler = new GetDashboardStatsHandler();
  const getSalesReportHandler = new GetSalesReportHandler();
  const getTopProductsHandler = new GetTopProductsHandler();
  const getRevenueByPeriodHandler = new GetRevenueByPeriodHandler();
  const getSalesByCategoryHandler = new GetSalesByCategoryHandler();
  const getEmployeePerformanceHandler = new GetEmployeePerformanceHandler();
  const getLowStockReportHandler = new GetLowStockReportHandler();

  // ==================== Staff Handlers ====================
  const getStaffHandler = new GetStaffHandler(); // Legacy
  const getEmployeesHandler = new GetEmployeesHandler(employeeRepository);
  const getEmployeeByIdHandler = new GetEmployeeByIdHandler(employeeRepository);
  const createEmployeeHandler = new CreateEmployeeHandler(employeeRepository);
  const updateEmployeeHandler = new UpdateEmployeeHandler(employeeRepository);
  const deleteEmployeeHandler = new DeleteEmployeeHandler(employeeRepository);

  // ==================== Notifications Handlers ====================
  const getNotificationsHandler = new GetNotificationsHandler();
  const markAllReadHandler = new MarkAllReadHandler();

  // ==================== AI Handlers ====================
  const sendMessageHandler = new SendMessageHandler(geminiProvider);

  // ==================== Suppliers Handlers ====================
  const createSupplierHandler = new CreateSupplierHandler(supplierRepository);
  const getSuppliersHandler = new GetSuppliersHandler(supplierRepository);
  const getSupplierByIdHandler = new GetSupplierByIdHandler(supplierRepository);
  const updateSupplierHandler = new UpdateSupplierHandler(supplierRepository);
  const deleteSupplierHandler = new DeleteSupplierHandler(supplierRepository);

  container = {
    // Auth
    userRepository,
    loginHandler,
    getCurrentUserHandler,
    refreshTokenHandler,
    updateUserPreferencesHandler,

    // Orders
    orderRepository,
    createOrderHandler,
    getOrdersHandler,
    getOrderByIdHandler,
    updateOrderStatusHandler,
    searchOrdersHandler,
    cancelOrderHandler,

    // Tasks
    taskRepository,
    createTaskHandler,
    getTasksHandler,
    getTaskByIdHandler,
    updateTaskHandler,
    updateTaskStatusHandler,
    addTaskCommentHandler,
    deleteTaskHandler,

    // Inventory
    productRepository,
    getProductsHandler,
    getProductByIdHandler,
    searchProductsHandler,
    createProductHandler,
    updateProductHandler,
    deleteProductHandler,
    adjustStockHandler,
    getStockLogsHandler,
    receiveGoodsHandler,
    reserveStockHandler,
    releaseStockHandler,
    completeStockReservationHandler,
    getWarehouseLocationsHandler,
    createWarehouseLocationHandler,
    getProductLocationsHandler,

    // Analytics
    getDashboardStatsHandler,
    getSalesReportHandler,
    getTopProductsHandler,
    getRevenueByPeriodHandler,
    getSalesByCategoryHandler,
    getEmployeePerformanceHandler,
    getLowStockReportHandler,

    // Staff
    employeeRepository,
    getStaffHandler,
    getEmployeesHandler,
    getEmployeeByIdHandler,
    createEmployeeHandler,
    updateEmployeeHandler,
    deleteEmployeeHandler,

    // Notifications
    notificationService,
    getNotificationsHandler,
    markAllReadHandler,

    // WebSocket
    webSocketService,

    // AI
    geminiProvider,
    sendMessageHandler,

    // Suppliers
    supplierRepository,
    createSupplierHandler,
    getSuppliersHandler,
    getSupplierByIdHandler,
    updateSupplierHandler,
    deleteSupplierHandler,

    // Fiscal
    webkassaProvider,
    createFiscalReceiptHandler,
    getFiscalReceiptByOrderIdHandler,
  };

  return container;
}

export function getContainer(): Container {
  if (!container) {
    throw new Error('Container not initialized. Call initContainer() first.');
  }
  return container;
}
