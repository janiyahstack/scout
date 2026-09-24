import "dotenv/config";
import express from "express";
import cors from "cors";
import OpenAI from "openai";
import { ApifyClient } from "apify-client";
const app = express();
app.use(cors());
app.use(express.json());

const client = new OpenAI({
    apiKey: process.env.HACKCLUB_API_KEY,
    baseURL:  "https://ai.hackclub.com/proxy/v1"

});
const apifyClient = new ApifyClient({
    token: process.env.APIFY_API_TOKEN,
});

app.post("/search", async (req, res) => {
    const searchQuery = req.body.searchQuery;
    const response = await client.chat.completions.create({
         model: "qwen/qwen3-32b",
         messages: [
            {
              role: "system",
              content: `You are ScoutBiz's search-query generator. The user will describe the type of freelancer, professional, or service they are trying to find clients for. Your ONLY job is to generate useful search queries that can be directly sent to web scrapers. Generate two groups of search queries:
1. "instagramSearches", These should be natural Instagram search queries that could help discover:- potential clients, - businesses that may need the user's service, - relevant business accounts, - relevant creators or professionals when appropriate
2. "googleMapsSearches"; These should be natural Google Maps / Google Places search queries that could help discover:- businesses that may need the user's service, - agencies, - local businesses, - other physical or locally searchable organizations that could become potential clients
Make the queries specific to the user's location when a location is provided.Return ONLY valid JSON. Keep each query short and directly searchable.Generate 3-5 useful queries for each category.`
            },
            {
            role: "user",
            content: searchQuery
        }
    
    ]

});
    const searches = JSON.parse(response.choices[0].message.content);
    console.log(response.choices[0].message.content);

const instagramResults = [];
console.log("instagram scraper starting");
for (const query of searches.instagramSearches) {
  const instagramInput = {
    search: query,
    searchType: "user",
    searchLimit: 5
  };

  const instagramRun = await apifyClient.actor("apify/instagram-search-scraper").call(instagramInput);

  const { items } = await apifyClient.dataset(instagramRun.defaultDatasetId).listItems();

  instagramResults.push(...items);
}
    console.log("instagram scraper finished");

const googleMapsResults = [];
    console.log("Google map scraper is starting");

for (const query of searches.googleMapsSearches) {
  const googleMapsInput = {
    searchStringsArray: [query],
    maxCrawledPlacesPerSearch: 5
  };

  const googleMapsRun = await apifyClient.actor("compass/crawler-google-places").call(googleMapsInput);

  const { stuff } = await apifyClient.dataset(googleMapsRun.defaultDatasetId).listItems();

  googleMapsResults.push(...stuff);
}
    console.log("Google map scraper finsihed");

res.json({
  result: response.choices[0].message.content,
  instagram: instagramResults,
  googleMaps: googleMapsResults
});

});
    const PORT = process.env.PORT
    || 10000;
    app.listen(PORT, "0.0.0.0", () => {
        console.log(`API running on port ${PORT}`);
    });
