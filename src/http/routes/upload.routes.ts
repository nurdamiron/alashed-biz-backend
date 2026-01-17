import { FastifyInstance } from 'fastify';
import { UploadService } from '../../shared/infrastructure/services/UploadService.js';
import { authMiddleware } from '../../middleware/authMiddleware.js';

export async function uploadRoutes(app: FastifyInstance): Promise<void> {
    const uploadService = new UploadService();

    // POST /api/upload
    app.post('/upload', {
        preHandler: [authMiddleware],
    }, async (request, reply) => {
        const data = await request.file();

        if (!data) {
            return reply.status(400).send({ error: 'No file uploaded' });
        }

        // Get folder from query param
        const { folder } = request.query as { folder?: string };

        try {
            const result = await uploadService.saveFile(data, folder || 'misc');
            return reply.status(201).send(result);
        } catch (err) {
            request.log.error(err);
            return reply.status(500).send({ error: 'Upload failed' });
        }
    });
}
