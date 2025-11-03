import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import { Mastra } from "@mastra/core/mastra";
import { PinoLogger } from "@mastra/loggers";
import { LibSQLStore } from "@mastra/libsql";
import { earthquakeAgent } from "./agent/earthquake-agent.js";
import { createA2ARoute } from "./server/a2a-route.js";

dotenv.config();

async function main() {
  const mastra = new Mastra({
    agents: { earthquakeAgent },
    storage: new LibSQLStore({ url: ":memory:" }),
    logger: new PinoLogger({ name: "MastraEarthquake", level: "debug" }),
    server: { build: { openAPIDocs: false, swaggerUI: false }, apiRoutes: [] },
  });

  const app = express();
  app.use(bodyParser.json());

  app.use("/", createA2ARoute(mastra));

  const port = process.env.PORT || 3000;
  app.listen(port, () =>
    console.log(`✅ Mastra A2A server running on http://localhost:${port}`)
  );
}

main();
