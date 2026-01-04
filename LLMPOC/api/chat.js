import OpenAI from "openai";
import fs from "fs";
import path from "path";

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    // 1. Precise pathing for Vercel
    const filePath = path.join(process.cwd(), 'knowledge.json');
    
    // Check if file exists before reading to avoid ENOENT crash
    if (!fs.existsSync(filePath)) {
      throw new Error(`Knowledge file not found at ${filePath}`);
    }

    const fileData = fs.readFileSync(filePath, 'utf8');
    const knowledgeBase = JSON.parse(fileData);

    const { prompt } = req.body;

    // 2. Simple Keyword Retrieval
    const keywords = prompt.toLowerCase().split(' ');
    const relevantContext = knowledgeBase
      .filter(chunk => keywords.some(word => chunk.text.toLowerCase().includes(word)))
      .slice(0, 3) 
      .map(c => c.text)
      .join("\n\n");

    // 3. Setup Client
    const client = new OpenAI({
      baseURL: "https://models.github.ai/inference",
      apiKey: process.env.GITHUB_TOKEN,
    });

    // 4. Generate AI response
    const response = await client.chat.completions.create({
      messages: [
        { 
          role: "system", 
          content: "Use the following context to answer. Context: " + relevantContext 
        },
        { role: "user", content: prompt },
      ],
      model: "openai/gpt-4o",
    });

    res.status(200).json({ answer: response.choices.message.content });

  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({ error: error.message });
  }
}
