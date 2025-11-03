import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
import { LibSQLStore } from '@mastra/libsql';
import { Agent } from '@mastra/core/agent';
import { Memory } from '@mastra/memory';
import fetch from 'node-fetch';
import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

const usgsEarthquakeTool = createTool({
  id: "get-earthquakes",
  description: "Fetch recent earthquakes from the USGS API",
  inputSchema: z.object({
    feed: z.union([z.literal("hour"), z.literal("day"), z.literal("week")]).default("day"),
    minMagnitude: z.number().optional()
  }),
  outputSchema: z.object({
    fetchedAt: z.string(),
    feed: z.string(),
    events: z.array(
      z.object({
        id: z.string(),
        place: z.string().nullable(),
        magnitude: z.number().nullable(),
        time: z.number(),
        url: z.string().nullable(),
        coordinates: z.tuple([z.number(), z.number(), z.number()]).nullable()
      })
    )
  }),
  execute: async ({ context }) => {
    const { feed = "day", minMagnitude } = context;
    const feedUrl = feed === "hour" ? "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_hour.geojson" : feed === "week" ? "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson" : "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson";
    const response = await fetch(feedUrl);
    const data = await response.json();
    const events = data.features.map((f) => ({
      id: f.id,
      place: f.properties?.place ?? null,
      magnitude: f.properties?.mag ?? null,
      time: f.properties?.time,
      url: f.properties?.url ?? null,
      coordinates: f.geometry?.coordinates ?? null
    })).filter((e) => minMagnitude ? e.magnitude >= minMagnitude : true);
    return {
      fetchedAt: (/* @__PURE__ */ new Date()).toISOString(),
      feed,
      events
    };
  }
});

const earthquakeAgent = new Agent({
  name: "Earthquake & Natural Events Agent",
  instructions: `
You are an assistant that monitors and reports on global earthquakes and natural events.
Use the 'get-earthquakes' tool to fetch recent events.
When replying:
- Always specify the location, magnitude, and time (UTC).
- Summarize the 5 strongest quakes.
- If no parameters are provided, default to recent daily quakes.
  `,
  model: "google/gemini-2.0-flash",
  tools: { usgsEarthquakeTool },
  memory: new Memory({
    storage: new LibSQLStore({ url: ":memory:" })
  })
});

const mastra = new Mastra({
  agents: {
    earthquakeAgent
  },
  storage: new LibSQLStore({
    url: ":memory:"
  }),
  logger: new PinoLogger({
    name: "MastraEarthquake",
    level: "debug"
  }),
  server: {
    build: {
      openAPIDocs: false,
      swaggerUI: false
    },
    apiRoutes: []
  }
});

export { mastra };
