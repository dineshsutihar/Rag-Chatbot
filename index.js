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
const don = "./test/data/don.pdf";

dotenv.config(); // Load environment variables

const app = express();
app.use(express.json());

app.post("/", async (req, res) => {
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
  const retrievedDocs = await retriever.invoke(req.body.context);

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

  const context = await retriever.invoke(`${req.body.context}`);

  const response = await ragChain.invoke({
    question: req.body.question,
    context,
  });

  res.json({
    message: response,
  });
});

app.listen(3000, () => {
  console.log("Listening on port 3000");
});
