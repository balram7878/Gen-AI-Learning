import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import embeddings from "./config/gemini.js";
import pineconeIndex from "./config/pinecone.js";

const CHUNK_SIZE = 1000;
const CHUNK_OVERLAP = 200;

const PDF_PATH = "./Book.pdf";
const pdfLoader = new PDFLoader(PDF_PATH);
const rawDocs = await pdfLoader.load();

// console.log(JSON.stringify(rawDocs, null, 2));
// console.log(rawDocs.length)

const textSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: CHUNK_SIZE,
  chunkOverlap: CHUNK_OVERLAP,
});

const chunkedDocs = await textSplitter.splitDocuments(rawDocs);
const validDocs = chunkedDocs.filter((doc) => doc.pageContent && doc.pageContent.trim().length > 0);

// console.log(JSON.stringify(chunkedDocs.slice(0, 2), null, 2));

if (validDocs.length === 0) {
  throw new Error("No valid chunks to index.");
}

const vectors = await embeddings.embedDocuments(validDocs.map((doc) => doc.pageContent));

const records = vectors.map((values, i) => ({
  id: `book-${i}`,
  values,
  metadata: {
    text: validDocs[i].pageContent,
    source: validDocs[i].metadata?.source || PDF_PATH,
    pageNumber: validDocs[i].metadata?.loc?.pageNumber ?? null,
  },
}));

const namespace = pineconeIndex.namespace(process.env.PINECONE_NAMESPACE || "");
const batchSize = 100;

for (let i = 0; i < records.length; i += batchSize) {
  const batch = records.slice(i, i + batchSize);
  await namespace.upsert({ records: batch });
}

console.log(`Indexed ${records.length} documents to Pinecone.`);
