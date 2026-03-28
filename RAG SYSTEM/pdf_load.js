import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
// import { storeInPinecone } from "./config/pinecone";
import { OllamaEmbeddings } from "@langchain/ollama";

const embeddings = new OllamaEmbeddings({
  model: "nomic-embed-text",
});

async function createEmbeddings(chunks) {
  const texts = chunks.map((doc) => doc.pageContent);

  const vectors = await embeddings.embedDocuments(texts);

  return vectors;
}

const textSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1500,
  chunkOverlap: 200,
});

async function loadPDF(filePath) {
  const loader = new PDFLoader(filePath);
  const docs = await loader.load();
  const splitDocs = await textSplitter.splitDocuments(docs);
  return splitDocs;
}

function preparePineconeData(chunks, vectors) {
  return chunks.map((chunk, i) => ({
    id: `chunk-${i}`,
    values: vectors[i],
    metadata: {
      text: chunk.pageContent,
    },
  }));
}

async function main() {
  const chunks = await loadPDF("./Book.pdf");
  const vectors = await createEmbeddings(chunks);
  const pineconeData = preparePineconeData(chunks, vectors);

  console.log("Chunks:", chunks.length);
  console.log("Embeddings:", vectors.length);
  console.log("Pinecone Data:", pineconeData.length);

//   await storeInPinecone(pineconeData);
}

main();
