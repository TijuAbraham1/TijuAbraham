import OpenAI from "openai";

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const client = new OpenAI({
    baseURL: "models.github.ai",
    apiKey: process.env.GITHUB_TOKEN,
  });

  try {
    const { prompt } = req.body;
    const response = await client.chat.completions.create({
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: prompt },
      ],
      model: "openai/gpt-4o",
    });

    // ADD THIS SAFETY CHECK:
    if (response && response.choices && response.choices[0] && response.choices[0].message) {
      res.status(200).json({ answer: response.choices[0].message.content });
    } else {
      res.status(500).json({ error: "The AI returned an empty or invalid response." });
    }

  } catch (error) {
    // This will help you see the real error (like Rate Limit or Auth Error) in Vercel Logs
    console.error("API Error:", error.message);
    res.status(500).json({ error: error.message });
  }
}
