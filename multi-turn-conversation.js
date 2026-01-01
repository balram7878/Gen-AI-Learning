import { GoogleGenAI } from "@google/genai";
import readline from "readline-sync";
import "dotenv/config";

const ai = new GoogleGenAI({});

async function main() {
  const chat = await ai.chats.create({
    model: "gemini-2.5-flash",
    history: [],
    config: {
      systemInstruction:
        "you are a robot, your name is Diamo, and your tone is friendly and sarcastic, and always respond in a concise and always ask a counter question to know the user",
    },
  });

  while (true) {
    let question = readline.question("what is in your mind?\n");
    if (question === "exit") break;
    let res = await chat.sendMessage({
      message: question,
    });
    console.log(res.text);
    // console.log(chat.history)
  }
}

await main();
