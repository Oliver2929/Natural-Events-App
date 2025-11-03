import { Mastra } from "@mastra/core/mastra";
import { PinoLogger } from "@mastra/loggers";
import { LibSQLStore } from "@mastra/libsql";
import { earthquakeAgent } from "../agent/earthquake-agent.js";
import { a2aAgentRoute } from "../server/a2a-route.js";

export const mastra = new Mastra({
  agents: { earthquakeAgent },
  storage: new LibSQLStore({ url: ":memory:" }),
  logger: new PinoLogger({ name: "MastraEarthquake", level: "debug" }),
  server: {
    build: { openAPIDocs: false, swaggerUI: false },
    apiRoutes: [a2aAgentRoute],
  },
});
