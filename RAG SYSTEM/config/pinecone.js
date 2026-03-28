import { Pinecone } from "@pinecone-database/pinecone";

const pc = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
});

await pc.createIndex({
  name: "rag-index",
  dimension: 768, 
  metric: "cosine",
  spec: {
    serverless: {
      cloud: "aws",
      region: "us-east-1",
    },
  },
});

const index = pc.index("rag-index");

async function storeInPinecone(data) {
  await index.upsert(data);
}

export { storeInPinecone };