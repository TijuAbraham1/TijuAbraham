import OpenAI from "openai";
import fs from "fs";
import path from "path";

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    // Look for the file in the current directory first, then the root
    const rootPath = path.join(process.cwd(), 'knowledge.json');
    const apiPath = path.join(process.cwd(), 'api', 'knowledge.json');
    
    let filePath = fs.existsSync(rootPath) ? rootPath : apiPath;

    if (!fs.existsSync(filePath)) {
       return res.status(500).json({ answer: "Error: knowledge.json not found on server." });
    }

    const knowledgeBase = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const { prompt } = req.body;

    const keywords = prompt.toLowerCase().split(' ');
    const context = knowledgeBase
      .filter(chunk => keywords.some(word => chunk.text.toLowerCase().includes(word)))
      .slice(0, 3)
      .map(c => c.text).join("\n\n");

    const client = new OpenAI({
      baseURL: "models.github.ai",
      apiKey: process.env.GITHUB_TOKEN,
    });

    const response = await client.chat.completions.create({
      messages: [
        { role: "system", content: "Answer based on: " + context },
        { role: "user", content: prompt },
      ],
      model: "openai/gpt-4o",
    });

    res.status(200).json({ answer: response.choices.message.content });
  } catch (error) {
    res.status(500).json({ answer: "Server Error: " + error.message });
  }
}
