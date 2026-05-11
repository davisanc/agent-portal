import {
  BedrockAgentClient,
  CreateAgentCommand
} from "@aws-sdk/client-bedrock-agent";
import { AgentProvider } from "./providerClient.js";
import { config } from "../config.js";
import { CreateAgentRequest, ProviderCreatedAgent } from "../types/agent.js";

export class BedrockProvider implements AgentProvider {
  private readonly client: BedrockAgentClient;

  constructor() {
    this.client = new BedrockAgentClient({
      region: config.awsRegion,
      credentials: {
        accessKeyId: config.awsAccessKeyId,
        secretAccessKey: config.awsSecretAccessKey
      }
    });
  }

  async createAgent(input: CreateAgentRequest): Promise<ProviderCreatedAgent> {
    const result = await this.client.send(
      new CreateAgentCommand({
        agentName: input.name,
        description: input.description,
        instruction: `You are ${input.name}. Provide concise and reliable answers.`,
        foundationModel: "anthropic.claude-3-haiku-20240307-v1:0",
        agentResourceRoleArn: config.awsBedrockAgentRoleArn
      })
    );

    if (!result.agent?.agentId) {
      throw new Error("AWS Bedrock did not return an agent id");
    }

    return {
      externalId: result.agent.agentId,
      raw: result
    };
  }
}
