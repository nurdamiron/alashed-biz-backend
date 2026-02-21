import { FastifyInstance } from 'fastify';
import { authMiddleware } from '../../middleware/authMiddleware.js';
import { query } from '../../shared/infrastructure/database/PostgresConnection.js';

export async function customersRoutes(app: FastifyInstance): Promise<void> {
  // GET /api/customers/search?q=
  app.get('/customers/search', { preHandler: [authMiddleware] }, async (req, reply) => {
    const { q } = req.query as { q?: string };
    if (!q || q.length < 2) {
      return reply.send({ success: true, data: [] });
    }

    const result = await query(
      `SELECT id, name, phone, email
       FROM customers
       WHERE name ILIKE $1 OR phone ILIKE $1
       ORDER BY name
       LIMIT 20`,
      [`%${q}%`]
    );

    return reply.send({ success: true, data: result.rows });
  });

  // GET /api/customers
  app.get('/customers', { preHandler: [authMiddleware] }, async (req, reply) => {
    const result = await query(
      `SELECT id, name, phone, email, created_at
       FROM customers
       ORDER BY name
       LIMIT 100`
    );
    return reply.send(result.rows);
  });

  // GET /api/customers/:id
  app.get('/customers/:id', { preHandler: [authMiddleware] }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const result = await query(
      `SELECT id, name, phone, email, address, notes, created_at
       FROM customers WHERE id = $1`,
      [id]
    );
    if (result.rows.length === 0) {
      return reply.status(404).send({ error: 'Customer not found' });
    }
    return reply.send(result.rows[0]);
  });
}
