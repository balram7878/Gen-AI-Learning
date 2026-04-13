import { GoogleGenAI } from "@google/genai";
import "dotenv/config";

const apiKey = process.env.GEMINI_API_KEY;
const model = process.env.GEMINI_EMBEDDING_MODEL || "models/gemini-embedding-001";
const outputDimensionality = Number(process.env.GEMINI_EMBEDDING_DIM || 384);

if (!apiKey) {
  throw new Error("GEMINI_API_KEY is missing.");
}

const ai = new GoogleGenAI({ apiKey });

async function embedDocuments(texts) {
  const batchSize = 100;
  const allVectors = [];

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    const response = await ai.models.embedContent({
      model,
      contents: batch,
      config: { outputDimensionality },
    });

    if (response.embeddings && response.embeddings.length > 0) {
      allVectors.push(...response.embeddings.map((entry) => entry.values || []));
      continue;
    }

    if (response.embedding && response.embedding.values) {
      allVectors.push(response.embedding.values);
      continue;
    }
  }

  return allVectors;
}

async function embedQuery(text) {
  const out = await embedDocuments([text]);
  return out[0] || [];
}

const embeddings = { embedDocuments, embedQuery };

console.log("Embeddings configured successfully.");

export default embeddings;