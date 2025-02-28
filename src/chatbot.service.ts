import { Injectable } from '@nestjs/common';
import { ChatOpenAI } from '@langchain/openai';
import { MessageContent } from '@langchain/core/messages';
import {
  END,
  MessagesAnnotation,
  START,
  StateGraph,
} from '@langchain/langgraph';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { MongoDBSaver } from '@langchain/langgraph-checkpoint-mongodb';

@Injectable()
export class ChatbotService {
  private app;
  private memory;
  private convoHistoryCollection;
  private memoryHistoryCollection;
  private memoryHistoryWritesCollection;

  constructor(@InjectConnection() private connection: Connection) {
    const llm = new ChatOpenAI({
      model: 'gpt-4o-mini',
      temperature: 0,
    });

    const callModel = async (state: typeof MessagesAnnotation.State) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment
      const response = await llm.invoke(state.messages);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      return { messages: response };
    };

    const workflow = new StateGraph(MessagesAnnotation)
      .addNode('model', callModel)
      .addEdge(START, 'model')
      .addEdge('model', END);

    this.memory = new MongoDBSaver({
      client: this.connection.getClient(),
      checkpointCollectionName: 'histories',
      checkpointWritesCollectionName: 'history_writes',
    });
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    this.app = workflow.compile({ checkpointer: this.memory });

    this.convoHistoryCollection = this.connection.collection('convoHistories');
    this.memoryHistoryCollection = this.connection.collection('histories');
    this.memoryHistoryWritesCollection =
      this.connection.collection('history_writes');
  }

  async llmExample(user_id: string, prompt: string): Promise<MessageContent> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
    const response = await this.app.invoke(
      {
        messages: [{ role: 'user', content: prompt }],
      },
      { configurable: { thread_id: user_id } },
    );

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const aiResponseContent: string =
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      response.messages[response.messages.length - 1].content;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
    await this.convoHistoryCollection.insertOne({
      user_id,
      prompt,
      response: aiResponseContent,
      created_at: Date.now(),
    });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-return
    return response.messages[response.messages.length - 1].content;
  }

  async deleteConvoHistory(user_id: string): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
    await this.memoryHistoryCollection.deleteMany({ thread_id: user_id });
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
    await this.memoryHistoryWritesCollection.deleteMany({ thread_id: user_id });
  }

  async loadHistory(user_id: string): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
    const histories = await this.convoHistoryCollection
      .find({ user_id })
      .sort({ created_at: 1 })
      .toArray();

    const messages: any[] = [];
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-call
    histories.forEach((history) => {
      const { prompt, response } = history;
      if (prompt) {
        messages.push({ role: 'user', content: prompt });
      }

      if (response) {
        messages.push({ role: 'ai', content: response });
      }
    });

    await this.app.invoke(
      {
        messages,
      },
      { configurable: { thread_id: user_id } },
    );
  }
}
