export interface EmployeeDto {
  id: number;
  userId?: number;
  name: string;
  department?: string;
  position?: string;
  phone?: string;
  email?: string;
  isActive: boolean;
  activeTasksCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEmployeeDto {
  userId?: number;
  name: string;
  department?: string;
  position?: string;
  phone?: string;
  email?: string;
}

export interface UpdateEmployeeDto {
  employeeId: number;
  name?: string;
  department?: string;
  position?: string;
  phone?: string;
  email?: string;
}

export interface EmployeesListDto {
  employees: EmployeeDto[];
  total: number;
}
