const { GoogleGenerativeAI } = require('@google/genai');

const genAI = new GoogleGenerativeAI(process.env.VITE_GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

async function query(prompt) {
  const result = await model.generateContent(prompt);
  console.log(result.response.text());
}

query(process.argv[2] || 'Hello');