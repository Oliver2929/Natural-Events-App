import fetch from "node-fetch";
import { createTool } from "@mastra/core/tools";
import { z } from "zod";

interface USGSEarthquakeResponse {
  features: {
    id: string;
    properties: {
      place?: string;
      mag?: number;
      time: number;
      url?: string;
    };
    geometry: {
      coordinates?: [number, number, number];
    };
  }[];
}

export const usgsEarthquakeTool = createTool({
  id: "get-earthquakes",
  description: "Fetch recent earthquakes from the USGS API",
  inputSchema: z.object({
    feed: z
      .union([z.literal("hour"), z.literal("day"), z.literal("week")])
      .default("day"),
    minMagnitude: z.number().optional(),
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
        coordinates: z.tuple([z.number(), z.number(), z.number()]).nullable(),
      })
    ),
  }),
  execute: async ({ context }) => {
    const { feed = "day", minMagnitude } = context;

    const feedUrl =
      feed === "hour"
        ? "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_hour.geojson"
        : feed === "week"
          ? "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson"
          : "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson";

    const response = await fetch(feedUrl);
    const data = (await response.json()) as USGSEarthquakeResponse;

    const events = data.features
      .map((f: any) => ({
        id: f.id,
        place: f.properties?.place ?? null,
        magnitude: f.properties?.mag ?? null,
        time: f.properties?.time,
        url: f.properties?.url ?? null,
        coordinates: f.geometry?.coordinates ?? null,
      }))
      .filter((e: any) => (minMagnitude ? e.magnitude >= minMagnitude : true));

    return {
      fetchedAt: new Date().toISOString(),
      feed,
      events,
    };
  },
});
