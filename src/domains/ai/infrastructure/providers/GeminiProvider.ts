import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../../../../config/index.js';

export class GeminiProvider {
  private genAI: GoogleGenerativeAI | null = null;

  private getClient(): GoogleGenerativeAI {
    if (!this.genAI) {
      if (!config.gemini.apiKey) throw new Error('GEMINI_API_KEY not configured');
      this.genAI = new GoogleGenerativeAI(config.gemini.apiKey);
    }
    return this.genAI;
  }

  async chat(message: string, history: Array<{ role: string; content: string }> = []): Promise<string> {
    const model = this.getClient().getGenerativeModel({ model: 'gemini-3-flash-preview' });
    const chat = model.startChat({
      history: history.map(h => ({ role: h.role === 'user' ? 'user' : 'model', parts: [{ text: h.content }] })),
    });
    const result = await chat.sendMessage(message);
    return result.response.text();
  }
}
