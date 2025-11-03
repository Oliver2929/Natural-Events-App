import { Agent } from "@mastra/core/agent";
import { Memory } from "@mastra/memory";
import { LibSQLStore } from "@mastra/libsql";
import { usgsEarthquakeTool } from "../tool/usgs-tool.js";

export const earthquakeAgent = new Agent({
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
    storage: new LibSQLStore({ url: "file:./mastra-earthquake.db" }),
  }),
});
