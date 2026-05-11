export type Platform = "copilot-studio" | "foundry" | "bedrock";

export interface AgentRecord {
  id: string;
  name: string;
  description: string;
  tags: string[];
  platform: Platform;
  createdAt: string;
  externalId: string;
  ownerUserId: string;
}

export interface CreateAgentRequest {
  name: string;
  description: string;
  tags: string[];
  platform: Platform;
}

export interface ProviderCreatedAgent {
  externalId: string;
  raw?: unknown;
}
