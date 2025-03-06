import { Body, Controller, Delete, Param, Post } from "@nestjs/common";
import { AgentService } from "./agent.service";
import { MessageContent } from "@langchain/core/messages";

@Controller()
export class AgentController {
  constructor(private readonly agentService: AgentService) {}

  @Post("agent-invoke")
  async agentExample(
    @Body() body: { prompt: string; user_id: string }
  ): Promise<MessageContent> {
    const { prompt, user_id } = body;
    return this.agentService.agentExample(user_id, prompt);
  }
}
