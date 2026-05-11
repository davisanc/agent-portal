import { Router } from "express";
import { AuthenticatedRequest } from "../middleware/auth.js";
import { upsertUser } from "../store/agentStore.js";

export function meRouter(): Router {
  const router = Router();
  router.get("/", async (req: AuthenticatedRequest, res) => {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    try {
      await upsertUser({
        userId: req.user.oid,
        userName: req.user.name,
        userEmail: req.user.upn,
        role: req.user.role
      });

      res.json({
        userId: req.user.oid,
        name: req.user.name,
        email: req.user.upn,
        role: req.user.role
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ error: "Failed to load user profile", message });
    }
  });
  return router;
}
