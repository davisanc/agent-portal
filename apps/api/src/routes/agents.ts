import { Router } from "express";
import { z } from "zod";
import { getAgentById, listAgents, saveAgent, upsertUser } from "../store/agentStore.js";
import { CreateAgentRequest, Platform } from "../types/agent.js";
import { getProvider, ProvidersRegistry } from "../providers/providerClient.js";
import { AuthenticatedRequest, requireRole } from "../middleware/auth.js";

const createAgentSchema = z.object({
  name: z.string().min(3).max(64),
  description: z.string().min(3).max(1000),
  tags: z.array(z.string().min(1).max(32)).max(10).default([]),
  platform: z.enum(["copilot-studio", "foundry", "bedrock"])
});

export function agentsRouter(providers: ProvidersRegistry): Router {
  const router = Router();

  router.get("/", async (req, res) => {
    try {
      const q = typeof req.query.q === "string" ? req.query.q : undefined;
      const tag = typeof req.query.tag === "string" ? req.query.tag : undefined;
      const platform =
        req.query.platform === "copilot-studio" ||
        req.query.platform === "foundry" ||
        req.query.platform === "bedrock"
          ? req.query.platform
          : undefined;

      const agents = await listAgents({ q, tag, platform });
      res.json(agents);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ error: "Failed to fetch agents", message });
    }
  });

  router.get("/:agentId", async (req, res) => {
    try {
      const agent = await getAgentById(req.params.agentId);
      if (!agent) {
        res.status(404).json({ error: "Agent not found" });
        return;
      }
      res.json(agent);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ error: "Failed to fetch agent", message });
    }
  });

  router.post("/", requireRole(["creator", "admin"]), async (req: AuthenticatedRequest, res) => {
    const parsed = createAgentSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid payload", details: parsed.error.flatten() });
      return;
    }

    try {
      await upsertUser({
        userId: req.user?.oid ?? "unknown",
        userName: req.user?.name,
        userEmail: req.user?.upn,
        role: req.user?.role ?? "viewer"
      });
      const payload = parsed.data as CreateAgentRequest;
      const provider = getProvider(providers, payload.platform as Platform);
      const created = await provider.createAgent(payload);
      const saved = saveAgent({
        ...payload,
        externalId: created.externalId,
        ownerUserId: req.user?.oid ?? "unknown"
      });
      res.status(201).json(saved);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      res.status(502).json({ error: "Provider integration failed", message });
    }
  });

  return router;
}
