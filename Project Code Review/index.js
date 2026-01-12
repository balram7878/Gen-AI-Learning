import { GoogleGenAI } from "@google/genai";
import "dotenv/config";
import path from "path";
import fs from "fs";
import readline from "readline-sync";
import { Type } from "@google/genai";

const ai = new GoogleGenAI({});

async function listFiles({ directory }) {
  const files = [];
  const extensions = [".js", ".css", ".html", ".jsx"];

  function scan(directory) {
    const items = fs.readdirSync(directory);
    console.log(items);
    for (let item of items) {
      const fullPath = path.join(directory, item);
      if (
        fullPath.includes("node_modules") ||
        fullPath.includes("dist") ||
        fullPath.includes("build")
      )
        continue;
      console.log(fullPath);
      const stat = fs.statSync(fullPath);
      //   console.log(stat);
      console.log(stat.isDirectory);
      if (stat.isDirectory()) {
        scan(fullPath);
      } else if (stat.isFile()) {
        const ext = path.extname(item);
        if (extensions.includes(ext)) files.push(fullPath);
      }
    }
  }
  scan(directory);
  console.log(`found ${files.length} files`);
  return { files };
}

async function readFile({ filePath }) {
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    console.log("Readling: ", filePath);
    return { content };
  } catch (err) {
    console.log(err);
  }
}

async function writeFile({ filePath, content }) {
  try {
    fs.writeFileSync(filePath, content, "utf-8");
    console.log("writing: ", filePath);
    return { success: true };
  } catch (err) {
    console.log(err);
  }
}

const listFilesFunctionDeclaration = {
  name: "listFiles",
  description: "list all files from a directory",
  parameters: {
    type: Type.OBJECT,
    properties: {
      directory: {
        type: Type.STRING,
        description: "name of the directory to review",
      },
    },
    required: ["directory"],
  },
};

const readFileFunctionDeclaration = {
  name: "readFile",
  description: "read the code of the file",
  parameters: {
    type: Type.OBJECT,
    properties: {
      filePath: {
        type: Type.STRING,
        description: "Path to the file",
      },
    },
    required: ["filePath"],
  },
};

const writeFileFunctionDeclaration = {
  name: "writeFile",
  description: "write fixed code back to the file",
  parameters: {
    type: Type.OBJECT,
    properties: {
      filePath: {
        type: Type.STRING,
        description: "Path to the file to write",
      },
      content: {
        type: Type.STRING,
        description: "The fixed/corrected content",
      },
    },
    required: ["filePath", "content"],
  },
};

const tools = {
  listFiles: listFiles,
  readFile: readFile,
  writeFile: writeFile,
};

async function codeReview(directory) {
  console.log(`Reviewing: ${directory}\n`);

  const history = [
    {
      role: "user",
      parts: [{ text: `Review and fix all JavaScript code in: ${directory}` }],
    },
  ];

  while (true) {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: history,
      config: {
        systemInstruction: `You are an expert JavaScript code reviewer and fixer.

**Your Job:**
1. Use listFiles to get all HTML, CSS, JavaScript, and TypeScript files in the directory
2. Use readFile to read each file's content
3. Analyze for:
   
   **HTML Issues:**
   - Missing doctype, meta tags, semantic HTML
   - Broken links, missing alt attributes
   - Accessibility issues (ARIA, roles)
   - Inline styles that should be in CSS
   
   **CSS Issues:**
   - Syntax errors, invalid properties
   - Browser compatibility issues
   - Inefficient selectors
   - Missing vendor prefixes
   - Unused or duplicate styles
   
   **JavaScript Issues:**
   - BUGS: null/undefined errors, missing returns, type issues, async problems
   - SECURITY: hardcoded secrets, eval(), XSS risks, injection vulnerabilities
   - CODE QUALITY: console.logs, unused code, bad naming, complex logic

4. Use writeFile to FIX the issues you found (write corrected code back)
5. After fixing all files, respond with a summary report in TEXT format

**Summary Report Format:**
📊 CODE REVIEW COMPLETE

Total Files Analyzed: X
Files Fixed: Y

🔴 SECURITY FIXES:
- file.js:line - Fixed hardcoded API key
- auth.js:line - Removed eval() usage

🟠 BUG FIXES:
- app.js:line - Added null check for user object
- index.html:line - Added missing alt attribute

🟡 CODE QUALITY IMPROVEMENTS:
- styles.css:line - Removed duplicate styles
- script.js:line - Removed console.log statements

Be practical and focus on real issues. Actually FIX the code, don't just report.`,
        tools: [
          {
            functionDeclarations: [
              listFilesFunctionDeclaration,
              readFileFunctionDeclaration,
              writeFileFunctionDeclaration,
            ],
          },
        ],
      },
    });

    if (response.functionCalls && response.functionCalls?.length > 0) {
      for (const functionCall of response.functionCalls) {
        const { name, args } = functionCall;

        const toolResponse = await tools[name](args);

        history.push({
          role: "model",
          parts: [{ functionCall }],
        });

        history.push({
          role: "user",
          parts: [
            {
              functionResponse: {
                name,
                response: { result: toolResponse },
              },
            },
          ],
        });
      }
    } else {
      console.log("\n" + response.text);
      break;
    }
  }
}

// while (true) {
//   let question = readline.question("Which folder you want to review: ");
//   if (question == "exit") break;
//   await codeReview();
// }

const directory = process.argv[2];
if (!directory) {
  console.error("Please provide a directory path");
  process.exit(1);
}

await codeReview(directory);
