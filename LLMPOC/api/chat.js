import OpenAI from "openai";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';

// 1. Define __dirname for ES Modules in Vercel 2026
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ answer: "Method not allowed" });
  }

  try {
    /**
     * 2. RESOLVE FILE PATH
     * In Vercel, the 'api' folder is a subdirectory. 
     * '..' moves up to the LLMPOC root where knowledge.json lives.
     */
    const filePath = path.join(__dirname, '..', 'knowledge.json');

    // 3. Verify file existence
    if (!fs.existsSync(filePath)) {
      console.error("Missing file at path:", filePath);
      return res.status(500).json({ 
        answer: `Error: knowledge.json not found. Path searched: ${filePath}` 
      });
    }

    // 4. Load and Parse Knowledge
    const fileData = fs.readFileSync(filePath, 'utf8');
    const knowledgeBase = JSON.parse(fileData);
    const { prompt } = req.body;

    // 5. RAG: Simple Search
    const keywords = prompt.toLowerCase().split(' ');
    const relevantContext = knowledgeBase
      .filter(chunk => keywords.some(word => chunk.text.toLowerCase().includes(word)))
      .slice(0, 3)
      .map(c => c.text)
      .join("\n\n");

    // 6. Setup GitHub Models Client
    const client = new OpenAI({
      baseURL: "models.github.ai",
      apiKey: process.env.GITHUB_TOKEN,
    });

    // 7. Generate Response
    const response = await client.chat.completions.create({
      messages: [
        { 
          role: "system", 
          content: "Use the following context to answer the user. Context: " + relevantContext 
        },
        { role: "user", content: prompt },
      ],
      model: "openai/gpt-4o",
    });

    res.status(200).json({ answer: response.choices.message.content });

  } catch (error) {
    console.error("Server Error:", error.message);
    res.status(500).json({ answer: "Server Error: " + error.message });
  }
}
