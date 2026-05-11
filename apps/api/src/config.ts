import "dotenv/config";

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

export const config = {
  port: Number(process.env.PORT ?? 4000),
  allowedOrigin: process.env.ALLOWED_ORIGIN ?? "http://localhost:5173",
  postgresUrl: required("POSTGRES_URL"),
  entraTenantId: required("ENTRA_TENANT_ID"),
  entraClientId: required("ENTRA_CLIENT_ID"),
  entraAdminGroupIds: (process.env.ENTRA_ADMIN_GROUP_IDS ?? "")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean),
  awsRegion: required("AWS_REGION"),
  awsAccessKeyId: required("AWS_ACCESS_KEY_ID"),
  awsSecretAccessKey: required("AWS_SECRET_ACCESS_KEY"),
  awsBedrockAgentRoleArn: required("AWS_BEDROCK_AGENT_ROLE_ARN"),
  microsoftGraphBaseUrl: process.env.MICROSOFT_GRAPH_BASE_URL ?? "https://graph.microsoft.com",
  foundryApiBaseUrl: required("FOUNDRY_API_BASE_URL"),
  foundryApiKey: required("FOUNDRY_API_KEY")
};
