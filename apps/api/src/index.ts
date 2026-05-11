import express from "express";
import cors from "cors";
import { config } from "./config.js";
import { requireAuth } from "./middleware/auth.js";
import { platformsRouter } from "./routes/platforms.js";
import { agentsRouter } from "./routes/agents.js";
import { CopilotStudioProvider } from "./providers/copilotStudioProvider.js";
import { FoundryProvider } from "./providers/foundryProvider.js";
import { BedrockProvider } from "./providers/bedrockProvider.js";
import { meRouter } from "./routes/me.js";
import { initDb } from "./db.js";

const app = express();
app.use(
  cors({
    origin: config.allowedOrigin
  })
);
app.use(express.json());

const providers = {
  "copilot-studio": new CopilotStudioProvider(),
  foundry: new FoundryProvider(),
  bedrock: new BedrockProvider()
};

app.get("/health", (_req, res) => res.json({ ok: true }));
app.use("/me", requireAuth, meRouter());
app.use("/platforms", requireAuth, platformsRouter());
app.use("/agents", requireAuth, agentsRouter(providers));

async function start() {
  await initDb();
  app.listen(config.port, () => {
    // eslint-disable-next-line no-console
    console.log(`API listening on http://localhost:${config.port}`);
  });
}

start().catch((error) => {
  // eslint-disable-next-line no-console
  console.error("Failed to start API", error);
  process.exit(1);
});
