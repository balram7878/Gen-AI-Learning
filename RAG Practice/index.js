import { GoogleGenAI } from "@google/genai";
import "dotenv/config";
import readline from "readline-sync";

const ai = new GoogleGenAI({});

const chats = [];

async function main() {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: chats,
    });
    return response.text;
  } catch (err) {
    console.log(err.message);
  }
}

while (true) {
  let q = readline.question("You: ");
  chats.push({
    role: "user",
    parts: [{ text: q }],
  });


  const response = await main();
  console.log("Model: ", response);
  chats.push({
    role: "model",
    parts: [{ text: response }],
  });
}
