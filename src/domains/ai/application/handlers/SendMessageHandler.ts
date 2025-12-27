import { UseCase } from '../../../../shared/application/UseCase.js';
import { Result } from '../../../../shared/application/Result.js';
import { GeminiProvider } from '../../infrastructure/providers/GeminiProvider.js';
import { SendMessageDto, ChatResponseDto } from '../dto/AIDto.js';

export class SendMessageHandler implements UseCase<SendMessageDto, ChatResponseDto> {
  constructor(private readonly geminiProvider: GeminiProvider) {}

  async execute(request: SendMessageDto): Promise<Result<ChatResponseDto>> {
    try {
      const response = await this.geminiProvider.chat(request.message, request.history || []);
      return Result.ok({ response });
    } catch (error) {
      return Result.fail(error instanceof Error ? error.message : 'AI request failed');
    }
  }
}
