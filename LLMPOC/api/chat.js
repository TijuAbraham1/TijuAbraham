import OpenAI from "openai";
import fs from "fs";
import path from "path";

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 1. Load your knowledge data
    // process.cwd() ensures Vercel finds the file in your LLMPOC folder
    const filePath = path.join(process.cwd(), 'knowledge.json');
    const fileData = fs.readFileSync(filePath, 'utf8');
    const knowledgeBase = JSON.parse(fileData);

    const { prompt } = req.body;

    // 2. Simple Retrieval (RAG)
    // We look for chunks of text that contain words from the user's question
    const keywords = prompt.toLowerCase().split(' ');
    const relevantContext = knowledgeBase
      .filter(chunk => keywords.some(word => chunk.text.toLowerCase().includes(word)))
      .slice(0, 3) // Take the top 3 matches to stay under token limits
      .map(c => c.text)
      .join("\n\n");

    // 3. Setup OpenAI Client for GitHub Models
    const client = new OpenAI({
      baseURL: "models.github.ai",
      apiKey: process.env.GITHUB_TOKEN,
    });

    // 4. Generate Response with Context
    const response = await client.chat.completions.create({
      messages: [
        { 
          role: "system", 
          content: "You are a helpful assistant. Use the following information to answer the user. If the answer is not in the text, say you don't know based on the provided documents.\n\nContext:\n" + relevantContext 
        },
        { role: "user", content: prompt },
      ],
      model: "openai/gpt-4o",
    });

    // 5. Send answer back to your index.html
    res.status(200).json({ answer: response.choices.message.content });

  } catch (error) {
    console.error("Server Error:", error.message);
    res.status(500).json({ error: error.message });
  }
}
