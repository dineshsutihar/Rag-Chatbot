import { ChatMistralAI } from "@langchain/mistralai";
import "cheerio";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { HuggingFaceTransformersEmbeddings } from "@langchain/community/embeddings/hf_transformers";
import * as hub from "langchain/hub";
import { StringOutputParser } from "@langchain/core/output_parsers";
import express from "express";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { PromptTemplate } from "@langchain/core/prompts";
import { createStuffDocumentsChain } from "langchain/chains/combine_documents";
import dotenv from "dotenv";
import { Redis } from "@upstash/redis";
const don = "./test/data/don.pdf";

dotenv.config(); // Load environment variables

const app = express();
app.use(express.json());

// Initializing the Redish Client token can be created n ustash website..
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

app.post("/", async (req, res) => {
  const { context, question } = req.body;
  console.log("Context:", req.body.context);

  //Checking if response is catched if already catched then response with the catched answer..
  const cacheKey = `response:${context}:${question}`;
  const cachedResponse = await redis.get(cacheKey);

  if (cachedResponse) {
    return res.json({
      message: cachedResponse,
    });
  }

  // Generating the response from Mistral Server
  const llm = new ChatMistralAI({
    model: "mistral-large-latest",
    temperature: 0,
    apiKey: process.env.MISTRAL_API_KEY,
  });

  // Load PDFs (assume you have an array of PDF file paths)
  const pdfPaths = [don];

  let allDocs = [];
  for (const pdfPath of pdfPaths) {
    const loader = new PDFLoader(pdfPath);
    const docs = await loader.load();
    allDocs = allDocs.concat(docs);
  }

  // Split documents into smaller chunks
  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });
  const allSplits = await textSplitter.splitDocuments(allDocs);

  // Store & Embedding
  const vectorStore = await MemoryVectorStore.fromDocuments(
    allSplits,
    new HuggingFaceTransformersEmbeddings()
  );

  // Retrieve
  const retriever = vectorStore.asRetriever({ k: 6, searchType: "similarity" });
  const retrievedDocs = await retriever.invoke(context);

  // Customizing prompt
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

  const response = await ragChain.invoke({
    question: question,
    context: retrievedDocs,
  });

  // Caching the response for future requests;
  await redis.set(cacheKey, response);

  res.json({
    message: response,
  });
});

app.listen(3000, () => {
  console.log("Listening on port http://localhost:3000");
});
