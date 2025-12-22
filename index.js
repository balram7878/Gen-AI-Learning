import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
dotenv.config();


const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const history=[
  {
    role:"user",
    parts:[{text:"Hi, how are you?"}]
  },
  {
    role:"user",
    parts:[{text:"My name is Balram Meena"}]
  },
  {
    role:"user",
    parts:[{text:"tell me current date?"}]
  }

];

async function main() {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents:history,
  });
  

  console.log(response.text);
  history.push({
    role:"model",
    parts:[{text:response.text}]
  })
}

main();
