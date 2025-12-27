export interface ChatMessageDto { role: 'user' | 'assistant'; content: string; }
export interface SendMessageDto { message: string; history?: ChatMessageDto[]; }
export interface ChatResponseDto { response: string; }
