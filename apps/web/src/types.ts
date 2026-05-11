export type Platform = "copilot-studio" | "foundry" | "bedrock";

export interface PlatformOption {
  id: Platform;
  name: string;
  vendor: string;
}

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

export interface UserProfile {
  userId: string;
  name?: string;
  email?: string;
  role: "viewer" | "creator" | "admin";
}
