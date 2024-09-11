import { ChatMistralAI } from "@langchain/mistralai";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { HuggingFaceTransformersEmbeddings } from "@langchain/community/embeddings/hf_transformers";
import { PromptTemplate } from "@langchain/core/prompts";
import { createStuffDocumentsChain } from "langchain/chains/combine_documents";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { StringOutputParser } from "@langchain/core/output_parsers";

const don = "./test/data/don.pdf";

export const handleRequest = async (context, question) => {
  const llm = new ChatMistralAI({
    model: "mistral-large-latest",
    temperature: 0,
    apiKey: process.env.MISTRAL_API_KEY,
  });

  const pdfPaths = [don];

  let allDocs = [];
  for (const pdfPath of pdfPaths) {
    const loader = new PDFLoader(pdfPath);
    const docs = await loader.load();
    allDocs = allDocs.concat(docs);
  }

  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });
  const allSplits = await textSplitter.splitDocuments(allDocs);

  const vectorStore = await MemoryVectorStore.fromDocuments(
    allSplits,
    new HuggingFaceTransformersEmbeddings()
  );

  const retriever = vectorStore.asRetriever({ k: 6, searchType: "similarity" });
  const retrievedDocs = await retriever.invoke(context);

  const template = `Use the following pieces of context to answer the question at the end.
    If you don't know the answer, just say that you don't know, don't try to make up an answer.
    Use three sentences maximum and keep the answer as concise as possible.
    Always say "Thanks for asking!" at the end of the answer.

    {context}

    Question: {question}

    Helpful Answer:`;

  const customRagPrompt = PromptTemplate.fromTemplate(template);

  const ragChain = await createStuffDocumentsChain({
    llm,
    prompt: customRagPrompt,
    outputParser: new StringOutputParser(),
  });

  return await ragChain.invoke({
    question,
    context: retrievedDocs,
  });
};
