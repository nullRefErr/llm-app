import { Injectable } from "@nestjs/common";
import { ChatOpenAI } from "@langchain/openai";
import { END, START, StateGraph } from "@langchain/langgraph";
import { TranslatorStateAnnotation } from "./states";
import { z } from "zod";

const functionSchema = z.object({
  agent: z.string().describe("agent name that function belongs to"),
  function: z.string().describe("possible function to call"),
  phoneNumber: z.string().describe("phone number or msisdn number"),
  userId: z.string().describe("identification of a user"),
  prompt: z
    .string()
    .describe("The exact user input that triggered this function."),
  nextStep: z.lazy(() => functionsSchema),
});

const functionsSchema = z.object({
  functions: z.array(functionSchema).describe("possible functions to call"),
});

const agentSchema = z.object({
  agent: z.string().describe("agent name that function belongs to"),
  prompt: z
    .string()
    .describe("The exact user input that triggered this function."),
});

const agentsSchema = z.object({
  functions: z.array(agentSchema).describe("possible functions to call"),
});

const agentMap = new Map<string, any>();
agentMap.set("TelcoAgent", { result: "Task Completed" });
agentMap.set("ChatAgent", { result: "Task failed" });
agentMap.set("ResearcherAgent", { result: "Task Completed" });
@Injectable()
export class AgentService {
  static llm = new ChatOpenAI({
    model: "gpt-4o-mini",
    temperature: 0,
    apiKey: process.env.OPENAI_API_KEY,
  });
  static structuredLLM = AgentService.llm.withStructuredOutput(agentsSchema);

  static chain;

  constructor() {

    AgentService.chain = new StateGraph(TranslatorStateAnnotation)
      .addNode("translator", this.translator)
      .addNode("intentFinder", this.intentFinder)
      .addNode("responseHandler", this.responseHandler)
      .addNode("orchestrator", this.orchestrator)
      .addEdge(START, "translator")
      .addEdge("translator", "intentFinder")
      .addEdge("intentFinder", "orchestrator")
      .addConditionalEdges("orchestrator", this.stateCheck, {
        CONTINUE: "orchestrator",
        FINISH: "responseHandler",
      })
      .addEdge("responseHandler", END)
      .compile();
  }

  async intentFinder(state: typeof TranslatorStateAnnotation.State) {
    const messages = [
      {
        role: "system",
        content: `
    Do not answer the questions. do not generate response. just find functions that can be used with the given input
    User Input: {content}
    ---------------------------
    System Function:
    TelcoAgent: Telco Agent is a telecommunication agent that provides various functions to the user. Telco agent can answer phone, get user information with phone number, get user trust score, block number, check spam, get user call history, get user sms message history
    ChatAgent: Chat Agent is a chat agent that provides various functions to the user. Chat Agent can send message to a user, get social profile information, create groups and voice calls.
    ResearcherAgent: Researcher Agent is a research agent that provides various functions to the user. Researcher Agent can find anything and research it for you which other agents does not provide.
    ----------------------------------
    I have this agent set, I want you to find what user would like to do according to this agents
    add matching possible agent
    phone number might be in the format of /(\\+)?(\\(?\\d+\\)?)(([\\s-]+)?(\\d+)){0,}/g add phone to prompt
    prompt is important. add exact part of the user input that triggered this function to the prompt field
                `,
      },
      {
        role: "user",
        content:
          "I want to +850-324-12-23 get the premium status of the user also I want to send a message to the same user about dinner tonight. I want to +830-624-22-66 get the trust score of the user. What is star wars ? What is starbucks ? What is getcontact ?",
      },
    ];

    console.log("intentFinder");
    const intent = await AgentService.structuredLLM.invoke(messages);
    intent.functions = intent.functions.map((func) => ({
      ...func,
      result: null,
      status: "pending",
      id: Math.random().toString(36).substring(7),
    }));
    return { functions: intent.functions };
  }

  async responseHandler(state: typeof TranslatorStateAnnotation.State) {
    const messages = [
      {
        role: "system",
        content: "you are a response handler. you make pretty response",
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

  async translator(state: typeof TranslatorStateAnnotation.State) {
    const messages = [
      {
        role: "system",
        content: "you are a translator Translate the given text to English.",
      },
      {
        role: "user",
        content: state.input,
      },
    ];
    const translated = await AgentService.llm.invoke(messages);
    console.log("translator");
    return { translated, state: "pending" };
  }

  async stateCheck(state: typeof TranslatorStateAnnotation.State) {
    const pendingFunction = state.functions.find(
      (func: any) => func.status === "pending"
    );
    const shouldContinue = !!pendingFunction;

    if (shouldContinue) {
      console.log(`***Forwarding -> ${pendingFunction.agent}
        `);
    }

    return shouldContinue ? "CONTINUE" : "FINISH";
  }

  async orchestrator(state: typeof TranslatorStateAnnotation.State) {
    if (state.state === "pending") {
      return { ...state, state: "started" };
    }

    let pendingFunction =
      state.functions.find((func: any) => func.status === "pending") || <any>{};

    const agentName: string = pendingFunction?.agent || "";

    const agent = agentMap.get(agentName);

    console.log(
      `***Working on ${agentName} to handle ${pendingFunction.prompt}
      
      `
    );

    pendingFunction = <any>{
      ...pendingFunction,
      result: agent.result,
      status: "completed",
    };

    for (const func of state.functions) {
      if (func.id === pendingFunction.id) {
        func.agent = pendingFunction.agent;
        func.result = pendingFunction.result;
        func.status = pendingFunction.status;
      }
    }

    return { functions: state.functions };
  }

  async agentExample(user_id: string, prompt: string): Promise<any> {
    const result = await AgentService.chain.invoke({
      input: "Hola, ¿cómo estás?",
      user_id:1,
    }, );
    return result.functions;
  }
}
