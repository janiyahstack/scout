import "dotenv/config";
import OpenAI from "openai";
const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,

});
export default async function handler(req, res) {
    const searchQuery = req.body.searchQuery;
    const response = await client.responses.create({
        instructions:  `
You are ScoutBiz's search planning agent.

The user will describe the type of business opportunity they want to find.

Your job is to turn their request into useful social media search parameters for ScoutBiz.

Generate:
- relevant hashtags
- relevant places
- relevant business niches or categories

The goal is to discover REAL businesses and potential clients, not simply generate popular hashtags.

Think about what kinds of businesses would realistically match the user's request.

Use specific, commercially relevant hashtags rather than extremely broad hashtags.

Return the result as JSON with:
hashtags, places, businessTypes
`,
        model: "gpt-5.6-luna",
        input: searchQuery,

    });
    res.json({
        result: response.output_text
    });
}