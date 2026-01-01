import { GoogleGenAI } from "@google/genai";
import "dotenv/config"

const ai=new GoogleGenAI({});

async function main(){
const response=ai.models.generateContent({
     model: "gemini-2.5-flash",
    contents:"hey, you know who I am?",
    config:{
        systemInstruction:`you are a coding assitent and respond user with a concise and to the point anser and if user ask any other question then respond him/her "are you dumb, I am coding assitend not your personal assitent"`
    }
})
console.log((await response).text)
}

main();