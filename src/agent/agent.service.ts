import { Injectable } from "@nestjs/common";
import { ChatOpenAI } from "@langchain/openai";
import { MessageContent } from "@langchain/core/messages";
import {
  Annotation,
  END,
  MessagesAnnotation,
  START,
  StateGraph,
} from "@langchain/langgraph";
import { InjectConnection } from "@nestjs/mongoose";
import { Connection } from "mongoose";
import { MongoDBSaver } from "@langchain/langgraph-checkpoint-mongodb";
import { TranslatorStateAnnotation } from "./states";

@Injectable()
export class AgentService {
  constructor() {
    const llm = new ChatOpenAI({
      model: "gpt-4o-mini",
      temperature: 0,
      apiKey: process.env.OPENAI_API_KEY,
    });

    async function intentFinder(state: typeof TranslatorStateAnnotation.State) {
      const messages = [
        {
          role: "system",
          content:
            "you are a translator who have a degree in Linguistics and Translation Studies. you started your career working for a translation agency before becoming a full-time freelance translator. With over 10 years of experience, you have developed expertise in legal documents, user manuals, and literature translation. you are proficient in CAT tools like SDL Trados, MemoQ, and DeepL Pro, ensuring efficiency and accuracy. Translate the given text to English.",
        },
        {
          role: "user",
          content: state.translated,
        },
      ];
      // const translated = await llm.invoke(messages);
      console.log("intentFinder");
      return { intent: "user wants to send chat message to everyone" };
    }

    async function responseHandler(
      state: typeof TranslatorStateAnnotation.State
    ) {
      const messages = [
        {
          role: "system",
          content:
            "you are a translator who have a degree in Linguistics and Translation Studies. you started your career working for a translation agency before becoming a full-time freelance translator. With over 10 years of experience, you have developed expertise in legal documents, user manuals, and literature translation. you are proficient in CAT tools like SDL Trados, MemoQ, and DeepL Pro, ensuring efficiency and accuracy. Translate the given text to English.",
        },
        {
          role: "user",
          content: state.translated,
        },
      ];
      // const translated = await llm.invoke(messages);
      console.log("responsehandler");
      return { result: "Agent successfully processed the requests" };
    }

    async function translator(state: typeof TranslatorStateAnnotation.State) {
      const messages = [
        {
          role: "system",
          content:
            "you are a translator who have a degree in Linguistics and Translation Studies. you started your career working for a translation agency before becoming a full-time freelance translator. With over 10 years of experience, you have developed expertise in legal documents, user manuals, and literature translation. you are proficient in CAT tools like SDL Trados, MemoQ, and DeepL Pro, ensuring efficiency and accuracy. Translate the given text to English.",
        },
        {
          role: "user",
          content: state.input,
        },
      ];
      // const translated = await llm.invoke(messages);
      console.log("translator");
      return { translated: "Hello, how are you?" };
    }

    async function stateCheck(state: typeof TranslatorStateAnnotation.State) {
      console.log("stateCheck");

      return state.input === "#NONE#" ? "PASS" : "FAIL";
    }

    const chain = new StateGraph(TranslatorStateAnnotation)
      .addNode("translator", translator)
      .addNode("intentFinder", intentFinder)
      .addNode("responseHandler", responseHandler)
      .addEdge(START, "translator")
      .addEdge("translator", "intentFinder")
      .addConditionalEdges("intentFinder", stateCheck, {
        PASS: "responseHandler",
        FAIL: END
      })
      .addEdge("intentFinder", "responseHandler")
      .addEdge("responseHandler", END)
      .compile();

    chain.invoke({ input: "Hola, ¿cómo estás?" }).then((response) => {
      console.log(response.result);
    });
  }

  async agentExample(user_id: string, prompt: string): Promise<MessageContent> {
    //   const response = await this.app.invoke(
    //     {
    //       messages: [{ role: "user", content: prompt }],
    //     },
    //     { configurable: { thread_id: user_id } }
    //   );
    //   const aiResponseContent: string =
    //     response.messages[response.messages.length - 1].content;
    //   await this.convoHistoryCollection.insertOne({
    //     user_id,
    //     prompt,
    //     response: aiResponseContent,
    //     created_at: Date.now(),
    //   });
    //   return response.messages[response.messages.length - 1].content;
    return "";
  }
}
