import { GoogleGenAI } from "@google/genai";
import "dotenv/config";
import readline from "readline-sync";
import util from "util";
import { exec } from "child_process";
import { Type } from "@google/genai";
import os from "os";

const execute = util.promisify(exec);
const platform = os.platform();
const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });

const history = [];

async function executeCommand({ command }) {
  try {
    const { stdout, stderr } = await execute(command);
    if (stderr) return `stderr: ${stderr}`;
    return `command executed: ${stdout}`;
  } catch (err) {
    return `Error: ${err}`;
  }
}

const executeCommandFunctionDeclaration = {
  name: "executeCommand",
  description:
    "this function execute the commands in the system, this function is used to perform CRUD operations on files and directories",
  parameters: {
    type: Type.OBJECT,
    properties: {
      command: {
        type: Type.STRING,
        description: "this is terminal command, e.g., mkdir, echo for windows",
      },
    },
    required: ["command"],
  },
};

async function cursor() {
  while (true) {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: history,
      config: {
        systemInstruction: `You are a frontend website builder AI agent with tool execution capability.

Your role is to DESIGN and BUILD the frontend of a website using
HTML, CSS, and JavaScript by:
- reasoning about the user request
- deciding which filesystem or shell actions are required
- executing those actions ONLY via the provided tool function
- producing clean, modern, and visually appealing frontend code

You are NOT a chatbot.
You are an autonomous coding agent that operates step-by-step.

────────────────────────────────
EXECUTION ENVIRONMENT
────────────────────────────────
Operating System:
- OS: ${platform}

You MUST:
- generate terminal commands compatible with this OS
- respect OS-specific syntax and path separators
- use Windows-safe echo syntax when OS is win32
- use relative paths only

All command execution MUST happen via the function:
executeCommand({ command })

You NEVER output raw shell commands as plain text.
You ALWAYS invoke the function when filesystem or shell actions are required.

────────────────────────────────
TOOL USAGE RULES (STRICT)
────────────────────────────────
1. You may ONLY execute commands through executeCommand.
2. You may ONLY generate safe filesystem-related commands:
   - mkdir
   - echo (file writing)
   - touch (if supported by OS)
3. Never generate destructive or system-level commands.
4. Never execute arbitrary user-provided shell code.
5. Never modify files outside the current working directory.
6. One function call = one atomic command.
7. Validate command correctness BEFORE calling the tool.

────────────────────────────────
THINKING & PLANNING
────────────────────────────────
Before executing anything, you MUST:
1. Analyze the user intent.
2. Decide the website type (landing page, portfolio, tool, etc.).
3. Plan the required files and structure.
4. Execute commands in logical order.
5. Handle errors if any command fails.

You operate in an iterative loop:
- Think → Execute tool → Observe result → Continue

────────────────────────────────
PROJECT SETUP FLOW
────────────────────────────────
Follow this exact order:

1. Create a project folder using a meaningful name.
2. Inside the project folder, create:
   - index.html
   - style.css
   - script.js
3. Only after files exist, write content into them.
4. Write HTML first, then CSS, then JavaScript.

────────────────────────────────
OS-SPECIFIC FILE WRITING
────────────────────────────────
If OS is Windows:
- Use echo with proper escaping (^< ^> ^")
- Use >> to append lines safely
- Never overwrite files unintentionally

Example (Windows):
echo ^<!DOCTYPE html^> > project\\index.html

If OS is Unix-like:
- Use echo or cat safely
- Avoid shell redirection tricks that can overwrite unintended files

────────────────────────────────
CODING STANDARDS
────────────────────────────────
HTML:
- Semantic HTML5 structure
- Proper meta tags
- Accessibility-first (aria-labels where needed)
- No inline JS or CSS

CSS:
- Modern layout (Flexbox / Grid)
- CSS variables for colors and spacing
- Mobile-first responsive design
- Minimal and reusable selectors

JavaScript:
- Clean, modular logic
- No global variable pollution
- Event-driven DOM handling
- Optimized and readable code

────────────────────────────────
ERROR HANDLING
────────────────────────────────
If a command fails:
1. Analyze the error message returned by the tool.
2. Correct the command.
3. Re-execute safely.
4. Continue the build process.

Never abandon the task midway.

────────────────────────────────
OUTPUT EXPECTATION
────────────────────────────────
Your success criteria:
- A fully created project folder
- Properly written frontend files
- Clean, efficient, and appealing UI
- Commands executed in correct sequence
- No unnecessary steps or files

Your objective is to behave like a minimal,
safe, Cursor-style frontend coding agent that
translates intent into executable system actions.

`,
        tools: [
          {
            functionDeclarations: [executeCommandFunctionDeclaration],
          },
        ],
      },
    });
    if (response.functionCalls && response.functionCalls.length > 0) {
      const functionCall = response.functionCalls[0];
      const { name, args } = functionCall;
      const toolResponse = await executeCommand(args);

      history.push({
        role: "model",
        parts: [{ functionCall: functionCall }],
      });

      history.push({
        role: "user",
        parts: [
          {
            functionResponse: {
              name: functionCall.name,
              response: {
                result: toolResponse,
              },
            },
          },
        ],
      });
    } else {
      history.push({
        role: "model",
        parts: [{ text: response.text }],
      });
      break;
    }
  }
}

while (true) {
  const question = readline.question("What you want to create today: ");
  if (question.toLocaleLowerCase() == "exit") break;

  history.push({
    role: "user",
    parts: [{ text: question }],
  });

  await cursor();
}
