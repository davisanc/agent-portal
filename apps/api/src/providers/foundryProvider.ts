import axios from "axios";
import { AgentProvider } from "./providerClient.js";
import { CreateAgentRequest, ProviderCreatedAgent } from "../types/agent.js";
import { config } from "../config.js";

export class FoundryProvider implements AgentProvider {
  async createAgent(input: CreateAgentRequest): Promise<ProviderCreatedAgent> {
    // TODO: Replace path with your Azure AI Foundry Agent API route/version.
    const url = `${config.foundryApiBaseUrl}/agents?api-version=2024-05-01-preview`;
    const response = await axios.post(
      url,
      {
        name: input.name,
        description: input.description,
        instructions: `You are ${input.name}. Keep answers concise and useful.`,
        model: "gpt-4o-mini"
      },
      {
        headers: {
          "api-key": config.foundryApiKey,
          "Content-Type": "application/json"
        },
        validateStatus: () => true
      }
    );

    if (response.status < 200 || response.status >= 300) {
      throw new Error(`Foundry API error: ${response.status} ${JSON.stringify(response.data)}`);
    }

    return {
      externalId: String(response.data?.id ?? response.data?.name ?? input.name),
      raw: response.data
    };
  }
}
