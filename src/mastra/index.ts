import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import { Mastra } from "@mastra/core/mastra";
import { PinoLogger } from "@mastra/loggers";
import { LibSQLStore } from "@mastra/libsql";
import { earthquakeAgent } from "../agent/earthquake-agent.js";
import { createA2ARoute } from "../server/a2a-route.js";

dotenv.config();

export const mastra = new Mastra({
  agents: { earthquakeAgent },
  storage: new LibSQLStore({ url: ":memory:" }),
  logger: new PinoLogger({ name: "MastraEarthquake", level: "debug" }),
  server: { build: { openAPIDocs: false, swaggerUI: false }, apiRoutes: [] },
  bundler: { externals: ["express", "body-parser", "dotenv"] },
});

export function startServer() {
  const app = express();

  app.get("/", (req, res) => res.send("Server is running"));

  app.use(bodyParser.json());
  app.use("/", createA2ARoute(mastra));

  const port = Number(process.env.PORT) || 4112;

  app.listen(port, "0.0.0.0", () =>
    console.log(`✅ Mastra A2A server running on port ${port}`)
  );
}

startServer();
