import axios from "axios";
import { AgentProvider } from "./providerClient.js";
import { CreateAgentRequest, ProviderCreatedAgent } from "../types/agent.js";
import { config } from "../config.js";

export class CopilotStudioProvider implements AgentProvider {
  async createAgent(input: CreateAgentRequest): Promise<ProviderCreatedAgent> {
    // TODO: Replace endpoint with your actual Copilot Studio API endpoint.
    const url = `${config.microsoftGraphBaseUrl}/beta/copilot/agents`;
    const response = await axios.post(
      url,
      {
        displayName: input.name,
        description: input.description
      },
      {
        headers: {
          "Content-Type": "application/json"
        },
        validateStatus: () => true
      }
    );

    if (response.status < 200 || response.status >= 300) {
      throw new Error(`Copilot Studio API error: ${response.status} ${JSON.stringify(response.data)}`);
    }

    return {
      externalId: String(response.data?.id ?? response.data?.name ?? input.name),
      raw: response.data
    };
  }
}
