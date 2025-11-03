import { registerApiRoute } from "@mastra/core/server";
import { randomUUID } from "crypto";

export const a2aAgentRoute = registerApiRoute("/a2a/agent/:agentId", {
  method: "POST",
  handler: async (c) => {
    try {
      const mastra = c.get("mastra");
      const agentId = c.req.param("agentId");
      const { jsonrpc, id: requestId, params } = await c.req.json();

      if (jsonrpc !== "2.0" || !requestId) {
        return c.json(
          {
            jsonrpc: "2.0",
            id: requestId || null,
            error: { code: -32600, message: "Invalid JSON-RPC request" },
          },
          400
        );
      }

      const agent = mastra.getAgent(agentId);
      if (!agent) {
        return c.json(
          {
            jsonrpc: "2.0",
            id: requestId,
            error: { code: -32602, message: `Agent '${agentId}' not found` },
          },
          404
        );
      }

      const messagesList = params?.messages || [];
      const mastraMessages = messagesList.map((msg: any) => ({
        role: msg.role,
        content:
          msg.parts
            ?.map((p: any) =>
              p.kind === "text" ? p.text : JSON.stringify(p.data)
            )
            .join("\n") || "",
      }));

      const response = await agent.generate(mastraMessages);
      const agentText = response.text || "";

      const artifacts = [
        {
          artifactId: randomUUID(),
          name: `${agentId}Response`,
          parts: [{ kind: "text", text: agentText }],
        },
      ];

      if (response.toolResults?.length) {
        artifacts.push({
          artifactId: randomUUID(),
          name: "ToolResults",
          parts: response.toolResults.map((r: any) => ({
            kind: "text",
            text: JSON.stringify(r),
          })),
        });
      }
      const history = [
        ...messagesList,
        {
          kind: "message",
          role: "agent",
          parts: [{ kind: "text", text: agentText }],
          messageId: randomUUID(),
        },
      ];

      return c.json({
        jsonrpc: "2.0",
        id: requestId,
        result: {
          id: randomUUID(),
          contextId: randomUUID(),
          status: {
            state: "completed",
            timestamp: new Date().toISOString(),
            message: {
              role: "agent",
              parts: [{ kind: "text", text: agentText }],
            },
          },
          artifacts,
          history,
          kind: "task",
        },
      });
    } catch (err: any) {
      return c.json(
        {
          jsonrpc: "2.0",
          id: null,
          error: {
            code: -32603,
            message: "Internal error",
            data: { details: err.message },
          },
        },
        500
      );
    }
  },
});
