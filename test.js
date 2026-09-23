import "dotenv/config";
import express from "express";
import cors from "cors";
import OpenAI from "openai";
const app = express();
app.use(cors());
app.use|(express.json());

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,

});
app.post("/search", async (req, res) => {
    const searchQuery = req.body.searchQuery;
    const response = await client.responses.create({
         model: "gpt-5.6-luna",
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
        input: searchQuery,

});
    res.json({
        result: response.output_text
});

});
    const PORT = process.env.PORT
    || 10000;
    app.listen(PORT, "0.0.0.0", () => {
        console.log(`API running on port ${PORT}`);
    });