import { Router } from "express";

export function platformsRouter(): Router {
  const router = Router();
  router.get("/", (_req, res) => {
    res.json([
      {
        id: "copilot-studio",
        name: "Microsoft Copilot Studio",
        vendor: "Microsoft"
      },
      {
        id: "foundry",
        name: "Azure AI Foundry",
        vendor: "Microsoft"
      },
      {
        id: "bedrock",
        name: "AWS Bedrock",
        vendor: "Amazon Web Services"
      }
    ]);
  });
  return router;
}
