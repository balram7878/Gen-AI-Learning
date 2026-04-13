import { GoogleGenAI } from "@google/genai";
import "dotenv/config";

const ai = new GoogleGenAI({});

const chats = [];

async function augment({ context, question }) {
  try {
    if (!context || context.trim().length === 0) {
      return "I don't have enough information to answer that question.";
    }

    if (!question || question.trim().length === 0) {
      return "Please provide a valid question.";
    }

    chats.push({ role: "user", parts: [{ text: question }] });

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: chats,
      config: {
        systemInstruction: `
        You are a helpful assistant answering questions based on the provided documentation.

Context from the documentation:
${context}

Question: ${question}

Instructions:
- Be concise and clear


        `,
      },
    });
    console.log("Generated response:", response);

    chats.push({ role: "model", parts: [{ text: response.text }] });
    return response.text;
  } catch (err) {
    console.log(err.message);
    return err.message;
  }
}

export default augment;
