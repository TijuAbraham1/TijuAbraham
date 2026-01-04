import OpenAI from "openai";
import fs from "fs";
import path from "path";

export default async function handler(req, res) {
  // 1. Only allow POST requests from your frontend
  if (req.method !== 'POST') {
    return res.status(405).json({ answer: "Method not allowed" });
  }

  try {
    // 2. Locate the knowledge.json file
    // In Vercel 2026, process.cwd() points to the root of your LLMPOC folder
    const filePath = path.join(process.cwd(), 'knowledge.json');

    // 3. Check if the file actually exists to prevent crashing
    if (!fs.existsSync(filePath)) {
      return res.status(500).json({ 
        answer: "Error: knowledge.json not found on server. Ensure it is in the LLMPOC folder." 
      });
    }

    // 4. Read and Parse the Knowledge Base
    const fileData = fs.readFileSync(filePath, 'utf8');
    const knowledgeBase = JSON.parse(fileData);

    const { prompt } = req.body;

    // 5. RAG: Simple Keyword Search
    // We filter the JSON for chunks that contain words from the user's question
    const keywords = prompt.toLowerCase().split(' ');
    const relevantContext = knowledgeBase
      .filter(chunk => keywords.some(word => chunk.text.toLowerCase().includes(word)))
      .slice(0, 3) // Only take top 3 matches to save tokens
      .map(c => c.text)
      .join("\n\n");

    // 6. Setup OpenAI Client for GitHub Models
    const client = new OpenAI({
      baseURL: "models.github.ai",
      apiKey: process.env.GITHUB_TOKEN,
    });

    // 7. Generate Response with Context
    const response = await client.chat.completions.create({
      messages: [
        { 
          role: "system", 
          content: "You are a helpful assistant. Use the following context to answer the user. If the answer is not in the context, use your general knowledge but mention that the document doesn't specify it.\n\nContext:\n" + relevantContext 
        },
        { role: "user", content: prompt },
      ],
      model: "openai/gpt-4o",
    });

    // 8. Return the AI's answer
    res.status(200).json({ answer: response.choices.message.content });

  } catch (error) {
    console.error("Server Error:", error.message);
    res.status(500).json({ answer: "Server Error: " + error.message });
  }
}
