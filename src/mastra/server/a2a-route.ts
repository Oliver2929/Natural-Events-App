// import { registerApiRoute } from "@mastra/core/server";
// import { randomUUID } from "crypto";
// import express from "express";
// import type { Request, Response } from "express";

// export function createA2ARoute(mastra: any) {
//   const router = express.Router();

//   router.post("/a2a/agent/:agentId", async (req: Request, res: Response) => {
//     try {
//       const { jsonrpc, id: requestId, params } = req.body || {};
//       if (jsonrpc !== "2.0" || !requestId)
//         return res.status(400).json({
//           jsonrpc: "2.0",
//           id: requestId || null,
//           error: { code: -32600, message: "Invalid JSON-RPC request" },
//         });

//       const { agentId } = req.params;
//       const agent = mastra.getAgent(agentId);
//       if (!agent)
//         return res.status(404).json({
//           jsonrpc: "2.0",
//           id: requestId,
//           error: { code: -32602, message: `Agent '${agentId}' not found` },
//         });

//       const messagesList = params?.messages || [];
//       const mastraMessages = messagesList.map((msg: any) => ({
//         role: msg.role,
//         content:
//           msg.parts
//             ?.map((p: any) =>
//               p.kind === "text" ? p.text : JSON.stringify(p.data)
//             )
//             .join("\n") || "",
//       }));

//       const response = await agent.generate(mastraMessages);
//       const agentText = response.text || "";

//       const artifacts = [
//         {
//           artifactId: randomUUID(),
//           name: `${agentId}Response`,
//           parts: [{ kind: "text", text: agentText }],
//         },
//       ];

//       if (response.toolResults?.length) {
//         artifacts.push({
//           artifactId: randomUUID(),
//           name: "ToolResults",
//           parts: response.toolResults.map((r: any) => ({
//             kind: "data",
//             data: r,
//           })),
//         });
//       }

//       const history = [
//         ...messagesList,
//         {
//           kind: "message",
//           role: "agent",
//           parts: [{ kind: "text", text: agentText }],
//           messageId: randomUUID(),
//         },
//       ];

//       return res.json({
//         jsonrpc: "2.0",
//         id: requestId,
//         result: {
//           id: randomUUID(),
//           contextId: randomUUID(),
//           status: {
//             state: "completed",
//             timestamp: new Date().toISOString(),
//             message: {
//               role: "agent",
//               parts: [{ kind: "text", text: agentText }],
//             },
//           },
//           artifacts,
//           history,
//           kind: "task",
//         },
//       });
//     } catch (err: any) {
//       res.status(500).json({
//         jsonrpc: "2.0",
//         id: null,
//         error: {
//           code: -32603,
//           message: "Internal error",
//           data: { details: err.message },
//         },
//       });
//     }
//   });

//   return router;
// }

import { registerApiRoute } from "@mastra/core/server";
import { randomUUID } from "crypto";

export const createA2ARoute = registerApiRoute("/a2a/agent/:agentId", {
  method: "POST",
  handler: async (c) => {
    try {
      const mastra = c.get("mastra");
      const agentId = c.req.param("agentId");

      const body = await c.req.json();
      const { jsonrpc, id: requestId, params } = body;

      if (jsonrpc !== "2.0" || !requestId) {
        return c.json(
          {
            jsonrpc: "2.0",
            id: requestId || null,
            error: {
              code: -32600,
              message:
                'Invalid Request: jsonrpc must be "2.0" and id is required',
            },
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
            error: {
              code: -32602,
              message: `Agent '${agentId}' not found`,
            },
          },
          404
        );
      }

      const { message, messages, contextId, taskId, metadata } = params || {};
      let messagesList = [];
      if (message) {
        messagesList = [message];
      } else if (messages && Array.isArray(messages)) {
        messagesList = messages;
      }

      type Part = { kind: "text"; text: string } | { kind: "data"; data: any };

      const mastraMessages = messagesList.map((msg) => ({
        role: msg.role,
        content:
          msg.parts
            ?.map((part: Part) => {
              if (part.kind === "text") return part.text;
              if (part.kind === "data") return JSON.stringify(part.data);
              return "";
            })
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

      if (response.toolResults && response.toolResults.length > 0) {
        artifacts.push({
          artifactId: randomUUID(),
          name: "ToolResults",
          parts: response.toolResults.map((result) => ({
            kind: "text",
            text: JSON.stringify(result),
          })),
        });
      }

      const history = [
        ...messagesList.map((msg) => ({
          kind: "message",
          role: msg.role,
          parts: msg.parts,
          messageId: msg.messageId || randomUUID(),
          taskId: msg.taskId || taskId || randomUUID(),
        })),
        {
          kind: "message",
          role: "agent",
          parts: [{ kind: "text", text: agentText }],
          messageId: randomUUID(),
          taskId: taskId || randomUUID(),
        },
      ];

      return c.json({
        jsonrpc: "2.0",
        id: requestId,
        result: {
          id: taskId || randomUUID(),
          contextId: contextId || randomUUID(),
          status: {
            state: "completed",
            timestamp: new Date().toISOString(),
            message: {
              messageId: randomUUID(),
              role: "agent",
              parts: [{ kind: "text", text: agentText }],
              kind: "message",
            },
          },
          artifacts,
          history,
          kind: "task",
        },
      });
    } catch (error: unknown) {
      const e = error as Error;
      return c.json(
        {
          jsonrpc: "2.0",
          id: null,
          error: {
            code: -32603,
            message: "Internal error",
            data: { details: e.message },
          },
        },
        500
      );
    }
  },
});
