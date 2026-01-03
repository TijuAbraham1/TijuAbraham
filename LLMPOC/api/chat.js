import OpenAI from "openai";

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const client = new OpenAI({
    baseURL: "https://models.github.ai/inference",
    apiKey: process.env.GITHUB_TOKEN,
  });

  try {
    const { prompt } = req.body;
    const response = await client.chat.completions.create({
      messages: [
        { role: "system", content: "You are an AI assistant for a POC." },
        { role: "user", content: prompt },
      ],
      model: "openai/gpt-4o", // Prefix with 'openai/' as per 2026 standards
    });

    res.status(200).json({ answer: response.choices.message.content });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
