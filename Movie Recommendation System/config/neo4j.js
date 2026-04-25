import "dotenv/config";
import neo4j from "neo4j-driver";

const driver = neo4j.driver(
  process.env.NEO4J_URI,
  neo4j.auth.basic(process.env.NEO4J_USERNAME, process.env.NEO4J_PASSWORD)
);


async function closeConnections() {
  await driver.close();
  console.log("All connections closed.");
}

export { driver, closeConnections };