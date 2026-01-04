import OpenAI from "openai";
import fs from "fs";
import path from "path";

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: "Method not allowed" });

  try {
    const filePath = path.join(process.cwd(), 'knowledge.json');
    if (!fs.existsSync(filePath)) {
      return res.status(500).json({ error: "knowledge.json file not found on server." });
    }

    const { prompt } = req.body;
    const client = new OpenAI({
      baseURL: "https://models.github.ai/inference",
      apiKey: process.env.GITHUB_TOKEN, // Verify this is set in Vercel
    });

    const response = await client.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "openai/gpt-4o",
    });

    return res.status(200).json({ answer: response.choices[0].message.content });
  } catch (error) {
    console.error(error); // This will show in Vercel Logs
    return res.status(500).json({ error: error.message }); // Always return JSON
  }
}
