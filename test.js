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
  baseURL: "https://ai.hackclub.com/proxy/v1",
});

const apifyClient = new ApifyClient({
  token: process.env.APIFY_API_TOKEN,
});

app.post("/search", async (req, res) => {
  try {
    const searchQuery = req.body.searchQuery;

    const response = await client.chat.completions.create({
      model: "qwen/qwen3-32b",
      messages: [
        {
          role: "system",
          content: `
 I am a Nigerian Student who is broke however skilled in programming. i want to.participate in RoboChallenge Romania but i cannot afford the flight there. i am willing to work with any already registered teams or teens interested in Robotics ti form.or.join a team so i can participate in whatever capacity. Your job is to help me achieve this goal by making Instagram and Google Maps Search Parameters i can use to find someone anyone on this platform that i can reach out to partner with or any.NGOs in Nigeria that might be willing to sponsor me for this competition across this platformnia
          `,
        },
        {
          role: "user",
          content: searchQuery,
        },
      ],
    });

    let content = response.choices[0].message.content;

    content = content
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    const searches = JSON.parse(content);

   
    console.log("Instagram defined");
    const instagramResults = [];

    console.log("Instagram scraper starting");

    for (const query of searches.instagramSearches) {
      const instagramInput = {
        search: query,
        searchType: "user",
        searchLimit: 5,
      };

      const instagramRun = await apifyClient.actor("apify/instagram-search-scraper").call(instagramInput);

      const { items } = await apifyClient.dataset(instagramRun.defaultDatasetId).listItems();

      instagramResults.push(...items);
    }

    console.log("Instagram scraper finished");

    console.log("Google Map is about to be defined");

    const googleMapsResults = [];

    console.log("Google Maps scraper starting");

    for (const query of searches.googleMapsSearches) {
      const googleMapsInput = {
        searchStringsArray: [query],
        maxCrawledPlacesPerSearch: 5,
      };

      const googleMapsRun = await apifyClient.actor("compass/crawler-google-places").call(googleMapsInput);

      const { items } = await apifyClient.dataset(googleMapsRun.defaultDatasetId).listItems();

      if (Array.isArray(items)) {
        googleMapsResults.push(...items);
      }
    }

    console.log("Google Maps scraper finished");

    console.log("Responses starting");

    res.json({
      result: searches,
      instagram: instagramResults,
      googleMaps: googleMapsResults,
    });

  } catch (error) {
    console.error("Search error:", error);

    res.status(500).json({
      error: "Search failed",
      message: error.message,
    });
  }
});

const PORT = process.env.PORT || 10000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`API running on port ${PORT}`);
});
