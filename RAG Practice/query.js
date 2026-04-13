import readline from "readline-sync";
import { searchPinecone } from "./config/pinecone.js";
import embeddings from "./config/gemini.js";
import augment from "./augment.js";

async function main() {
  try {
    const question = readline.question("User: ");
    const queryVector = await embeddings.embedQuery(question);
    // console.log("Query vector generated:", queryVector[0]);
    const searchResults = await searchPinecone(queryVector, 5);
    // console.log("Search results:", searchResults);
    const answer = await augment({ context: searchResults, question });
    console.log("Assistant:", answer);
  } catch (error) {
    console.error("Error during query processing:", error);
  }
}

while (true) {
  await main();
}
