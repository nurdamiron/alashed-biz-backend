import { beforeAll, afterAll, vi } from 'vitest';

// Global setup
beforeAll(async () => {
    // Set test environment variables
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'test-secret';
});

afterAll(async () => {
    // Clear any global mocks
    vi.clearAllMocks();
});
