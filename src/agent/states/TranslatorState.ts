import { Annotation } from "@langchain/langgraph";

export const TranslatorStateAnnotation = Annotation.Root({
  input: Annotation<string>,
  translated: Annotation<string>,
  intent: Annotation<string>,
  result: Annotation<string>,
});
