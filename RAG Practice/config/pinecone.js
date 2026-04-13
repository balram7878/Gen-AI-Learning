import { Pinecone } from "@pinecone-database/pinecone";
import dotenv from "dotenv";
dotenv.config();

const pinecone = new Pinecone();
const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX);
console.log("Pinecone index configured successfully.");

export async function searchPinecone(queryVector, topK = 5) {
  const searchResults = await pineconeIndex.query({
    vector: queryVector,
    topK: topK,
    includeMetadata: true,
  });

  return searchResults.matches.map((result) => result.metadata.text).join("\n---\n");
}

export default pineconeIndex;
