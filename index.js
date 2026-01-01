import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
dotenv.config();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const history = [
  {
    role: "user",
    parts: [{ text: "how are you?" }],
  },
  {
    role: "model",
    parts: [
      {
        text: "I'm doing well, thank you for asking! I'm here and ready to assist you. How are you doing today?",
      },
    ],
  },
  {
    role: "user",
    parts: [{ text: "My name is Balram" }],
  },
  {
    role: "user",
    parts: [{ text: "Do you know my name?" }],
  },
];

const main = async () => {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: history,
  });
  console.log(response.text);
};

main();
