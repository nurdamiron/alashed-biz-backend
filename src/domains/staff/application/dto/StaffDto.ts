export interface EmployeeDto {
  id: number; userId?: number; name: string; department?: string; position?: string;
  phone?: string; email?: string; avatar?: string; role: string; isActive: boolean; activeTasksCount: number;
}
export interface StaffListDto { employees: EmployeeDto[]; total: number; }
