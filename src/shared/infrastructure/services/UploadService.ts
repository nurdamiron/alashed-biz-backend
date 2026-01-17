import fs from 'fs';
import path from 'path';
import util from 'util';
import { pipeline } from 'stream';
import { randomUUID } from 'crypto';
import { MultipartFile } from '@fastify/multipart';

const pump = util.promisify(pipeline);

export interface UploadResult {
    url: string;
    filename: string;
    mimetype: string;
    size: number;
}

export class UploadService {
    private readonly uploadDir: string;
    private readonly baseUrl: string;

    constructor() {
        // Determine upload directory (absolute path)
        this.uploadDir = path.join(process.cwd(), 'uploads');

        // Ensure upload directory exists
        if (!fs.existsSync(this.uploadDir)) {
            fs.mkdirSync(this.uploadDir, { recursive: true });
        }

        // Base URL for serving files
        // In production, this should be configured via env var like ASSET_URL
        const port = process.env.PORT || 3000;
        const host = process.env.HOST || 'localhost';
        const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';

        // If running in docker/cloud, localhost might not work. 
        // For now, return relative path or strict URL if provided.
        this.baseUrl = process.env.ASSET_URL || `${protocol}://${host}:${port}/uploads`;
    }

    async saveFile(file: MultipartFile, folder: string = 'misc'): Promise<UploadResult> {
        const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        const targetDir = path.join(this.uploadDir, folder, timestamp);

        // Ensure target subdirectory exists
        if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
        }

        // Generate unique filename to prevent collisions
        const extension = path.extname(file.filename);
        const uniqueName = `${randomUUID()}${extension}`;
        const filePath = path.join(targetDir, uniqueName);

        // Save file
        await pump(file.file, fs.createWriteStream(filePath));

        // Construct public URL
        // Format: /uploads/folder/date/filename
        const relativePath = `${folder}/${timestamp}/${uniqueName}`;
        const url = `${this.baseUrl}/${relativePath}`;

        return {
            url,
            filename: file.filename,
            mimetype: file.mimetype,
            size: 0, // MultipartFile doesn't always provide size immediately unless buffered
        };
    }
}
