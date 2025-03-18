import { Annotation } from "@langchain/langgraph";

export const TranslatorStateAnnotation = Annotation.Root({
  input: Annotation<string>,
  user_id:Annotation<string>,
  translated: Annotation<string>,
  functions: Annotation<any[]>,
  state: Annotation<string>,
});
