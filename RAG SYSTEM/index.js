import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { storeInPinecone } from "./config/pinecone.js";
import axiosClient from "./axios.js";

async function createEmbeddings(chunk) {
  const response = await axiosClient.post("/api/embed", {
    text: chunk,
  });
  return response.data.embedding;
}

const textSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 800,
  chunkOverlap: 200,
});

async function loadPDF(filePath) {
  const loader = new PDFLoader(filePath);
  const docs = await loader.load();
  const splitDocs = await textSplitter.splitDocuments(docs);
  return splitDocs;
}

async function main() {
  try {
    const chunks = await loadPDF("./Book.pdf");
    console.log(`Loaded ${chunks.length} chunks`);

    console.log("Generating embeddings...");
    const vectors = await Promise.all(
      chunks.map((chunk) => createEmbeddings(chunk.pageContent)),
    );

    console.log(`Generated ${vectors.length} embeddings`);
    console.log("Sample embedding dimensions:", vectors[0].length);

    const pineconeData = chunks.map((chunk, index) => ({
    
      id: `chunk-${index}`,
      values: vectors[index],
      metadata: {
        text: chunk.pageContent,
        page: chunk.metadata.loc?.pageNumber || 0,
        source: "Book.pdf",
      },
    }));

    console.log(pineconeData[0]);

    const batchSize = 100;

    for (let i = 0; i < pineconeData.length; i += batchSize) {
      const batch = pineconeData.slice(i, i + batchSize);
      await storeInPinecone(batch);
      console.log(`Uploaded batch ${i / batchSize + 1}`);
    }
    console.log("Data stored in Pinecone successfully!");
  } catch (error) {
    console.error("Error:", error);
  }
}

main();
