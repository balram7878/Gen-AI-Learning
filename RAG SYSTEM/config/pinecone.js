import { Pinecone } from "@pinecone-database/pinecone";
import dotenv from "dotenv";

dotenv.config();

const pc = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
});

const index = pc.index("rag-systems");

async function storeInPinecone(batch) {
  if (!batch || batch.length === 0) {
    console.error(" No records to upsert");
    return;
  }

  console.log(`Upserting ${batch.length} vectors...`);
  await index.upsert({ records: batch });

  console.log(` Upserted ${batch.length} vectors`);
}

export { storeInPinecone };
