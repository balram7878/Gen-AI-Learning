import { driver, closeConnections } from "./config/neo4j.js";
import { pinecone, pineconeIndex } from "./config/pinecone.js";

async function initializeConnections() {
  console.log("Testing all connections...\n");

  // Test 1: Neo4j
  try {
    const session = driver.session();
    const result = await session.run("RETURN 'Neo4j Connected!' AS message");
    console.log("Neo4j:", result.records[0].get("message"));
    await session.close();
  } catch (err) {
    console.error("Neo4j:", err.message);
  }

  // Test 2: Pinecone
  try {
    const stats = await pineconeIndex.describeIndexStats();
    console.log("Pinecone: Connected | Vectors:", stats.totalRecordCount || 0);
  } catch (err) {
    console.error("Pinecone:", err.message);
  }

  await closeConnections();
}

initializeConnections();
