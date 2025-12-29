import { UseCase } from '../../../../shared/application/UseCase.js';
import { Result } from '../../../../shared/application/Result.js';
import { query } from '../../../../shared/infrastructure/database/PostgresConnection.js';
import { EmployeePerformanceReportDto } from '../dto/AnalyticsDto.js';

export interface GetEmployeePerformanceRequest {
  fromDate?: string;
  toDate?: string;
  department?: string;
}

export class GetEmployeePerformanceHandler implements UseCase<GetEmployeePerformanceRequest, EmployeePerformanceReportDto> {
  async execute(request: GetEmployeePerformanceRequest): Promise<Result<EmployeePerformanceReportDto>> {
    try {
      const fromDate = request.fromDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const toDate = request.toDate || new Date().toISOString().split('T')[0];

      let sql = `
        SELECT
          e.id as employee_id,
          e.name as employee_name,
          e.department,
          e.position,
          COUNT(DISTINCT o.id) as orders_processed,
          COALESCE(SUM(CASE WHEN o.status = 'delivered' THEN o.total_amount ELSE 0 END), 0) as total_revenue,
          COALESCE(AVG(CASE WHEN o.status = 'delivered' THEN o.total_amount ELSE NULL END), 0) as average_order_value,
          (SELECT COUNT(*) FROM tasks t
           WHERE (t.assignee_id = e.id OR t.employee_id = e.id)
           AND t.status = 'completed'
           AND t.completed_at >= $1::date
           AND t.completed_at < ($2::date + INTERVAL '1 day')) as tasks_completed
        FROM employees e
        LEFT JOIN orders o ON e.id = o.employee_id
          AND o.created_at >= $1::date
          AND o.created_at < ($2::date + INTERVAL '1 day')
        WHERE e.is_active = true
      `;

      const params: any[] = [fromDate, toDate];

      if (request.department) {
        sql += ` AND e.department = $3`;
        params.push(request.department);
      }

      sql += `
        GROUP BY e.id, e.name, e.department, e.position
        ORDER BY total_revenue DESC
      `;

      const result = await query(sql, params);

      const employees = result.rows.map((row) => ({
        employeeId: row.employee_id,
        employeeName: row.employee_name,
        department: row.department,
        position: row.position,
        ordersProcessed: parseInt(row.orders_processed) || 0,
        totalRevenue: parseFloat(row.total_revenue) || 0,
        tasksCompleted: parseInt(row.tasks_completed) || 0,
        averageOrderValue: parseFloat(row.average_order_value) || 0,
      }));

      return Result.ok({
        employees,
        period: {
          from: fromDate,
          to: toDate,
        },
      });
    } catch (error) {
      if (error instanceof Error) {
        return Result.fail(error.message);
      }
      return Result.fail('Failed to get employee performance');
    }
  }
}
