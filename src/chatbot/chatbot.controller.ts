import { Body, Controller, Delete, Param, Post } from '@nestjs/common';
import { ChatbotService } from './chatbot.service';
import { MessageContent } from '@langchain/core/messages';

@Controller()
export class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) {}

  @Post('llm-invoke')
  async llmExample(
    @Body() body: { prompt: string; user_id: string },
  ): Promise<MessageContent> {
    const { prompt, user_id } = body;
    return this.chatbotService.llmExample(user_id, prompt);
  }

  @Delete('history/:user_id')
  async deleteConvoHistory(@Param() params: { user_id: string }) {
    const { user_id } = params;
    await this.chatbotService.deleteConvoHistory(user_id);
  }

  @Post('history/:user_id')
  async loadConvoHistory(@Param() params: { user_id: string }) {
    const { user_id } = params;
    await this.chatbotService.loadHistory(user_id);
  }
}
