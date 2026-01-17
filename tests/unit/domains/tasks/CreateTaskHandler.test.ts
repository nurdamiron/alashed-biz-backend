import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreateTaskHandler } from '@/domains/tasks/application/handlers/CreateTaskHandler.js';
import { Task } from '@/domains/tasks/domain/entities/Task.js';
import { TaskId } from '@/domains/tasks/domain/value-objects/TaskId.js';
import { TaskPriority } from '@/domains/tasks/domain/value-objects/TaskPriority.js';

// Mock dependencies
const mockTaskRepository = {
    save: vi.fn(),
    findById: vi.fn(),
    findByAssignee: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
};

const mockNotificationService = {
    notifyNewTask: vi.fn(),
};

describe('CreateTaskHandler', () => {
    let handler: CreateTaskHandler;

    beforeEach(() => {
        vi.clearAllMocks();
        handler = new CreateTaskHandler(
            mockTaskRepository as any,
            mockNotificationService as any
        );
    });

    it('should create task and notify assignee if assigneeId is provided', async () => {
        const request = {
            title: 'Test Task',
            description: 'Test Description',
            priority: 'high',
            assigneeId: 101, // Employee ID
            createdById: 1,
            deadline: new Date().toISOString(),
            attachments: ['http://localhost:3000/uploads/test.jpg'],
        };

        // Mock successful save
        const mockSavedTask = Task.create({
            title: request.title,
            description: request.description,
            priority: TaskPriority.create('high'), // Valid priority
            assigneeId: request.assigneeId,
            createdById: request.createdById,
            attachments: request.attachments,
        });
        // Manually set ID for the saved task since it comes from DB
        (mockSavedTask as any).props.id = TaskId.create(123);

        mockTaskRepository.save.mockResolvedValue(mockSavedTask);

        const result = await handler.execute(request);

        // Verify Result
        if (!result.isSuccess) {
            console.error('Test 1 Failed:', result.error);
        }
        expect(result.isSuccess).toBe(true);
        expect(result.getValue && typeof result.getValue === 'function' ? result.getValue().title : result.value.title).toBe(request.title);
        expect(result.getValue && typeof result.getValue === 'function' ? result.getValue().attachments : result.value.attachments).toEqual(request.attachments);

        // Verify Repository called
        expect(mockTaskRepository.save).toHaveBeenCalledTimes(1);

        // Verify Notification triggered
        expect(mockNotificationService.notifyNewTask).toHaveBeenCalledTimes(1);
        expect(mockNotificationService.notifyNewTask).toHaveBeenCalledWith(
            123, // Task ID
            'Test Task',
            101 // Assignee ID
        );
    });

    it('should create task but NOT notify if no assigneeId', async () => {
        const request = {
            title: 'Unassigned Task',
            assigneeId: undefined,
            createdById: 1,
        };

        const mockSavedTask = Task.create({
            title: request.title,
            description: '',
            assigneeId: undefined,
            createdById: 1,
            priority: TaskPriority.create('medium'), // Fix: Provide valid priority
            attachments: [],
        });
        (mockSavedTask as any).props.id = TaskId.create(124);

        mockTaskRepository.save.mockResolvedValue(mockSavedTask);

        const result = await handler.execute(request);

        if (!result.isSuccess) {
            console.error('Test 2 Failed:', result.error);
        }
        expect(result.isSuccess).toBe(true);
        expect(mockNotificationService.notifyNewTask).not.toHaveBeenCalled();
    });
});
