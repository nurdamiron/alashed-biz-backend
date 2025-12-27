// Auth
import { PostgresUserRepository } from '../domains/auth/infrastructure/repositories/PostgresUserRepository.js';
import { LoginHandler } from '../domains/auth/application/handlers/LoginHandler.js';
import { GetCurrentUserHandler } from '../domains/auth/application/handlers/GetCurrentUserHandler.js';

// Orders
import { PostgresOrderRepository } from '../domains/orders/infrastructure/repositories/PostgresOrderRepository.js';
import { CreateOrderHandler } from '../domains/orders/application/handlers/CreateOrderHandler.js';
import { GetOrdersHandler } from '../domains/orders/application/handlers/GetOrdersHandler.js';
import { GetOrderByIdHandler } from '../domains/orders/application/handlers/GetOrderByIdHandler.js';
import { UpdateOrderStatusHandler } from '../domains/orders/application/handlers/UpdateOrderStatusHandler.js';
import { SearchOrdersHandler } from '../domains/orders/application/handlers/SearchOrdersHandler.js';

// Tasks
import { PostgresTaskRepository } from '../domains/tasks/infrastructure/repositories/PostgresTaskRepository.js';
import { CreateTaskHandler } from '../domains/tasks/application/handlers/CreateTaskHandler.js';
import { GetTasksHandler } from '../domains/tasks/application/handlers/GetTasksHandler.js';
import { GetTaskByIdHandler } from '../domains/tasks/application/handlers/GetTaskByIdHandler.js';
import { UpdateTaskHandler } from '../domains/tasks/application/handlers/UpdateTaskHandler.js';
import { UpdateTaskStatusHandler } from '../domains/tasks/application/handlers/UpdateTaskStatusHandler.js';
import { AddTaskCommentHandler } from '../domains/tasks/application/handlers/AddTaskCommentHandler.js';

// Inventory
import { PostgresProductRepository } from '../domains/inventory/infrastructure/repositories/PostgresProductRepository.js';
import { GetProductsHandler } from '../domains/inventory/application/handlers/GetProductsHandler.js';
import { GetProductByIdHandler } from '../domains/inventory/application/handlers/GetProductByIdHandler.js';
import { SearchProductsHandler } from '../domains/inventory/application/handlers/SearchProductsHandler.js';
import { UpdateProductHandler } from '../domains/inventory/application/handlers/UpdateProductHandler.js';
import { AdjustStockHandler } from '../domains/inventory/application/handlers/AdjustStockHandler.js';
import { GetStockLogsHandler } from '../domains/inventory/application/handlers/GetStockLogsHandler.js';

// Analytics
import { GetDashboardStatsHandler } from '../domains/analytics/application/handlers/GetDashboardStatsHandler.js';

// Staff
import { GetStaffHandler } from '../domains/staff/application/handlers/GetStaffHandler.js';

// Notifications
import { GetNotificationsHandler } from '../domains/notifications/application/handlers/GetNotificationsHandler.js';
import { MarkAllReadHandler } from '../domains/notifications/application/handlers/MarkAllReadHandler.js';

// AI
import { GeminiProvider } from '../domains/ai/infrastructure/providers/GeminiProvider.js';
import { SendMessageHandler } from '../domains/ai/application/handlers/SendMessageHandler.js';

// DI Container Interface
export interface Container {
  // Auth
  userRepository: PostgresUserRepository;
  loginHandler: LoginHandler;
  getCurrentUserHandler: GetCurrentUserHandler;

  // Orders
  orderRepository: PostgresOrderRepository;
  createOrderHandler: CreateOrderHandler;
  getOrdersHandler: GetOrdersHandler;
  getOrderByIdHandler: GetOrderByIdHandler;
  updateOrderStatusHandler: UpdateOrderStatusHandler;
  searchOrdersHandler: SearchOrdersHandler;

  // Tasks
  taskRepository: PostgresTaskRepository;
  createTaskHandler: CreateTaskHandler;
  getTasksHandler: GetTasksHandler;
  getTaskByIdHandler: GetTaskByIdHandler;
  updateTaskHandler: UpdateTaskHandler;
  updateTaskStatusHandler: UpdateTaskStatusHandler;
  addTaskCommentHandler: AddTaskCommentHandler;

  // Inventory
  productRepository: PostgresProductRepository;
  getProductsHandler: GetProductsHandler;
  getProductByIdHandler: GetProductByIdHandler;
  searchProductsHandler: SearchProductsHandler;
  updateProductHandler: UpdateProductHandler;
  adjustStockHandler: AdjustStockHandler;
  getStockLogsHandler: GetStockLogsHandler;

  // Analytics
  getDashboardStatsHandler: GetDashboardStatsHandler;

  // Staff
  getStaffHandler: GetStaffHandler;

  // Notifications
  getNotificationsHandler: GetNotificationsHandler;
  markAllReadHandler: MarkAllReadHandler;

  // AI
  geminiProvider: GeminiProvider;
  sendMessageHandler: SendMessageHandler;
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

  // ==================== Providers ====================
  const geminiProvider = new GeminiProvider();

  // ==================== Auth Handlers ====================
  const loginHandler = new LoginHandler(userRepository);
  const getCurrentUserHandler = new GetCurrentUserHandler(userRepository);

  // ==================== Orders Handlers ====================
  const createOrderHandler = new CreateOrderHandler(orderRepository);
  const getOrdersHandler = new GetOrdersHandler(orderRepository);
  const getOrderByIdHandler = new GetOrderByIdHandler(orderRepository);
  const updateOrderStatusHandler = new UpdateOrderStatusHandler(orderRepository);
  const searchOrdersHandler = new SearchOrdersHandler(orderRepository);

  // ==================== Tasks Handlers ====================
  const createTaskHandler = new CreateTaskHandler(taskRepository);
  const getTasksHandler = new GetTasksHandler(taskRepository);
  const getTaskByIdHandler = new GetTaskByIdHandler(taskRepository);
  const updateTaskHandler = new UpdateTaskHandler(taskRepository);
  const updateTaskStatusHandler = new UpdateTaskStatusHandler(taskRepository);
  const addTaskCommentHandler = new AddTaskCommentHandler(taskRepository);

  // ==================== Inventory Handlers ====================
  const getProductsHandler = new GetProductsHandler(productRepository);
  const getProductByIdHandler = new GetProductByIdHandler(productRepository);
  const searchProductsHandler = new SearchProductsHandler(productRepository);
  const updateProductHandler = new UpdateProductHandler(productRepository);
  const adjustStockHandler = new AdjustStockHandler(productRepository);
  const getStockLogsHandler = new GetStockLogsHandler(productRepository);

  // ==================== Analytics Handlers ====================
  const getDashboardStatsHandler = new GetDashboardStatsHandler();

  // ==================== Staff Handlers ====================
  const getStaffHandler = new GetStaffHandler();

  // ==================== Notifications Handlers ====================
  const getNotificationsHandler = new GetNotificationsHandler();
  const markAllReadHandler = new MarkAllReadHandler();

  // ==================== AI Handlers ====================
  const sendMessageHandler = new SendMessageHandler(geminiProvider);

  container = {
    // Auth
    userRepository,
    loginHandler,
    getCurrentUserHandler,

    // Orders
    orderRepository,
    createOrderHandler,
    getOrdersHandler,
    getOrderByIdHandler,
    updateOrderStatusHandler,
    searchOrdersHandler,

    // Tasks
    taskRepository,
    createTaskHandler,
    getTasksHandler,
    getTaskByIdHandler,
    updateTaskHandler,
    updateTaskStatusHandler,
    addTaskCommentHandler,

    // Inventory
    productRepository,
    getProductsHandler,
    getProductByIdHandler,
    searchProductsHandler,
    updateProductHandler,
    adjustStockHandler,
    getStockLogsHandler,

    // Analytics
    getDashboardStatsHandler,

    // Staff
    getStaffHandler,

    // Notifications
    getNotificationsHandler,
    markAllReadHandler,

    // AI
    geminiProvider,
    sendMessageHandler,
  };

  return container;
}

export function getContainer(): Container {
  if (!container) {
    throw new Error('Container not initialized. Call initContainer() first.');
  }
  return container;
}
