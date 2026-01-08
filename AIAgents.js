import readline, { question } from "readline-sync";
import "dotenv/config";
import { GoogleGenAI } from "@google/genai";
import { Type } from "@google/genai";

const ai = new GoogleGenAI({});

async function getCryptoInfo({ coin }) {
  const response = await fetch(
    `https://api.coingecko.com/api/v3/coins/markets?vs_currency=inr&ids=${coin}`
  );
  const data = await response.json();

  return data;
}

// console.log(await getCryptoInfo({ coin: "Bitcoin" }));

async function getWeatherInfo({ city }) {
  const response = await fetch(
    `http://api.weatherapi.com/v1/current.json?key=${process.env.WEATHER_API_KEY}&q=${city}&aqi=no`
  );
  const data = await response.json();
  return data;
}

// console.log(await getWhetherInfo({ city: "Alwar" }));

const cryptoFunctionDeclaration = {
  name: "getCryptoInfo",
  description:
    "this function give the price and other details of the crypto currency e.g., Bitcoin, solana, ethereum",
  parameters: {
    type: Type.OBJECT,
    properties: {
      coin: {
        type: Type.STRING,
        description: "this will be the name of the crypto currency",
      },
    },
    required: ["coin"],
  },
};

const weatherFunctionDeclaration = {
  name: "getWeatherInfo",
  description:
    "this function give you the weather details like temperature, humidity and other weather related stuff",
  parameters: {
    type: Type.OBJECT,
    properties: {
      city: {
        type: Type.STRING,
        description:
          "this is the name of the city for which function provide weather details",
      },
    },
    required: ["city"],
  },
};

const toolFunctions = {
  getCryptoInfo,
  getWeatherInfo,
};

const history = [];
const tools = [
  {
    functionDeclarations: [cryptoFunctionDeclaration, weatherFunctionDeclaration],
  },
];

async function AIAgent() {
  while (true) {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: history,
      config: {
        tools
      },
    });
    if (response.functionCalls && response.functionCalls.length > 0) {
      const functionCall = response.functionCalls[0];
      const { name, args } = functionCall;
      // console.log(functionCall,name,arg)
      if (!toolFunctions[name]) {
        throw new Error(`Unknown function call: ${name}`);
      }
      const toolResponse = await toolFunctions[name](args);

      const functionResponsePart = {
        name: functionCall.name,
        response: {
          result: toolResponse,
        },
      };

      history.push({
        role: "model",
        parts: [
          {
            functionCall: functionCall,
          },
        ],
      });
      history.push({
        role: "user",
        parts: [
          {
            functionResponse: functionResponsePart,
          },
        ],
      });
    } else {
      history.push({
        role: "model",
        parts: [{ text: response.text }],
      });
      console.log(response.text);
      break;
    }
  }
}
while (true) {
  let question = readline.question("What you want to know: ");
  if (question == "exit") break;
  history.push({
    role: "user",
    parts: [{ text: question }],
  });
  await AIAgent();
}
