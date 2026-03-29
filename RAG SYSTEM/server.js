import express from "express";
import { pipeline } from "@xenova/transformers";

let embedder;

async function startServer() {
  // Load model ONCE at startup
  console.log("Loading embedding model...");
  embedder = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
  console.log("Model ready");

  const app = express();
  app.use(express.json());

  app.post("/api/embed", async (req, res) => {
    try {
      const { text } = req?.body;

      //   Model already loaded, this is instant
      const embedding = await embedder(text, {
        pooling: "mean",
        normalize: true,
      });

    //   console.log("Embedding generated:", embedding.data.length);

      res.status(200).json({ embedding: Array.from(embedding.data) });
    } catch (error) {
      console.error("Error generating embedding:", error);
      res.status(500).json({ error: "Failed to generate embedding" });
    }
  });

  app.listen(3000, () => {
    console.log("Server running on port 3000");
  });
}

startServer();
