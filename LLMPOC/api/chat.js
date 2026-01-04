import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default async function handler(req, res) {
  // Use __dirname to go up one level from /api/ to the LLMPOC root
  const filePath = path.join(__dirname, '..', 'knowledge.json');
  
  if (!fs.existsSync(filePath)) {
    // This will help you see exactly where the function is looking in your Vercel logs
    return res.status(500).json({ error: `File missing at ${filePath}` });
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
