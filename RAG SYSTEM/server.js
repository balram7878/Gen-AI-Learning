import express from "express";
import { pipeline } from "@xenova/transformers";
import { searchPinecone } from "./config/pinecone.js";
import ollama from "ollama";
import Groq from "groq-sdk";

let embedder;

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY, // Get free at console.groq.com
});

async function generateAnswer(relevantChunks, question) {
  try {
    // Build context from the retrieved chunks
    const context = relevantChunks
      .map((chunk, i) => `[Chunk ${i + 1} - Page ${chunk.page}]\n${chunk.text}`)
      .join("\n\n---\n\n");

    // Build the prompt
    const prompt = `You are a helpful assistant answering questions based on the book "Men Are from Mars, Women Are from Venus".

Use the following context from the book to answer the question. If the answer is not in the context, say "I don't have enough information from the book to answer this."

Context:
${context}

Question: ${question}

Answer:`;

    console.log("Generating answer with Ollama...");

    // Call Ollama
    const response = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant", // or 'phi3' if you want faster
      messages: [
        {
          role: "system",
          content:
            "You are a helpful assistant answering questions based on book context.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    console.log("✅ Answer generated");

    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error("Error generating answer with Ollama:", error.message);
    throw error;
  }
}

export { generateAnswer };

async function startServer() {
  // Load model ONCE at startup
  console.log("Loading embedding model...");
  embedder = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
  console.log("Model ready");

  const app = express();
  app.use(express.json());

  app.post("/api/embed", async (req, res) => {
    try {
      const { text } = req?.body;

      //   Model already loaded, this is instant
      const embedding = await embedder(text, {
        pooling: "mean",
        normalize: true,
      });

      //   console.log("Embedding generated:", embedding.data.length);

      res.status(200).json({ embedding: Array.from(embedding.data) });
    } catch (error) {
      console.error("Error generating embedding:", error);
      res.status(500).json({ error: "Failed to generate embedding" });
    }
  });

  // In your server.js (where you have /api/embed)

  app.get("/api/query", async (req, res) => {
    try {
      const question = req.query?.question ?? req.body?.question;
      console.log("Received query:", question);

      if (!question || typeof question !== "string") {
        return res.status(400).json({
          message:
            "Please provide question as query param (?question=...) or JSON body.",
        });
      }

      const embedding = await embedder(question, {
        pooling: "mean",
        normalize: true,
      });

      const searchResults = await searchPinecone(Array.from(embedding.data));
      console.log("Top match score:", searchResults[0]?.score);

      const answer = await generateAnswer(searchResults, question);

      res.status(200).json({ answer });
    } catch (error) {
      console.error("Error processing query:", error);
      res.status(500).json({ message: "Failed to process query" });
    }
  });

  app.listen(3000, () => {
    console.log("Server running on port 3000");
  });
}

startServer();
