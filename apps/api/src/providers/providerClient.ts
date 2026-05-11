import { CreateAgentRequest, Platform, ProviderCreatedAgent } from "../types/agent.js";

export interface AgentProvider {
  createAgent(input: CreateAgentRequest): Promise<ProviderCreatedAgent>;
}

export interface ProvidersRegistry {
  [key: string]: AgentProvider;
}

export function getProvider(
  providers: ProvidersRegistry,
  platform: Platform
): AgentProvider {
  const provider = providers[platform];
  if (!provider) {
    throw new Error(`Provider not configured for platform ${platform}`);
  }
  return provider;
}
