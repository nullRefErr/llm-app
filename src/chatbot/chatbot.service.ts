import { Injectable } from "@nestjs/common";
import { ChatOpenAI } from "@langchain/openai";
import { MessageContent } from "@langchain/core/messages";
import {
  END,
  MessagesAnnotation,
  START,
  StateGraph,
} from "@langchain/langgraph";
import { InjectConnection } from "@nestjs/mongoose";
import { Connection } from "mongoose";
import { MongoDBSaver } from "@langchain/langgraph-checkpoint-mongodb";

@Injectable()
export class ChatbotService {
  private app;
  private memory;
  private convoHistoryCollection;
  private memoryHistoryCollection;
  private memoryHistoryWritesCollection;

  constructor(@InjectConnection() private connection: Connection) {
    const llm = new ChatOpenAI({
      model: "gpt-4o-mini",
      temperature: 0,
    });

    const callModel = async (state: typeof MessagesAnnotation.State) => {
      const response = await llm.invoke(state.messages);
      return { messages: response };
    };

    const workflow = new StateGraph(MessagesAnnotation)
      .addNode("model", callModel)
      .addEdge(START, "model")
      .addEdge("model", END);

    this.memory = new MongoDBSaver({
      client: this.connection.getClient(),
      checkpointCollectionName: "histories",
      checkpointWritesCollectionName: "history_writes",
    });
    this.app = workflow.compile({ checkpointer: this.memory });

    this.convoHistoryCollection = this.connection.collection("convoHistories");
    this.memoryHistoryCollection = this.connection.collection("histories");
    this.memoryHistoryWritesCollection =
      this.connection.collection("history_writes");
  }

  async llmExample(user_id: string, prompt: string): Promise<MessageContent> {
    const response = await this.app.invoke(
      {
        messages: [{ role: "user", content: prompt }],
      },
      { configurable: { thread_id: user_id } }
    );

    const aiResponseContent: string =
      response.messages[response.messages.length - 1].content;

    await this.convoHistoryCollection.insertOne({
      user_id,
      prompt,
      response: aiResponseContent,
      created_at: Date.now(),
    });

    return response.messages[response.messages.length - 1].content;
  }

  async deleteConvoHistory(user_id: string): Promise<void> {
    await this.memoryHistoryCollection.deleteMany({ thread_id: user_id });

    await this.memoryHistoryWritesCollection.deleteMany({ thread_id: user_id });
  }

  async loadHistory(user_id: string): Promise<void> {
    const histories = await this.convoHistoryCollection
      .find({ user_id })
      .sort({ created_at: 1 })
      .toArray();

    const messages: any[] = [];

    histories.forEach((history) => {
      const { prompt, response } = history;
      if (prompt) {
        messages.push({ role: "user", content: prompt });
      }

      if (response) {
        messages.push({ role: "ai", content: response });
      }
    });

    await this.app.invoke(
      {
        messages,
      },
      { configurable: { thread_id: user_id } }
    );
  }
}
