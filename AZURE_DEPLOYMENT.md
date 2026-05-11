# Azure Deployment (West Europe)

This project can be deployed to Azure using:

- Azure Static Web Apps (frontend, default generated domain)
- Azure App Service (Node.js API)
- Azure Database for PostgreSQL Flexible Server
- Azure Key Vault (secret storage)

Region is set to `westeurope` by default.

## Prerequisites

- Azure CLI logged in (`az login`)
- PowerShell
- Node.js 20+
- `npx` available
- Permissions to create resources in your subscription

## One-command deployment

From project root:

```powershell
.\infra\deploy-azure.ps1 `
  -SubscriptionId "<your-subscription-id>" `
  -EntraTenantId "<entra-tenant-id>" `
  -EntraApiClientId "<api-app-client-id>" `
  -EntraSpaClientId "<spa-app-client-id>" `
  -ApiScope "api://<api-app-client-id>/access_as_user" `
  -FoundryApiBaseUrl "https://<your-foundry>.openai.azure.com" `
  -FoundryApiKey "<foundry-key>" `
  -AwsAccessKeyId "<aws-key>" `
  -AwsSecretAccessKey "<aws-secret>" `
  -AwsBedrockAgentRoleArn "<aws-bedrock-role-arn>" `
  -EntraAdminGroupIds "<group-id-1>,<group-id-2>"
```

The script will:

1. Provision resources with Bicep in `westeurope`
2. Create/get the Static Web App default hostname (random Azure domain)
3. Configure API CORS to allow that hostname
4. Build/deploy API to App Service
5. Build web app with production env vars
6. Deploy web bundle to Static Web Apps

## Important Entra setup

Update your Entra app registrations after first deploy:

- SPA app redirect URI: `https://<generated-swa-hostname>`
- API app expose scope: `access_as_user`
- Ensure SPA has delegated permission to that API scope
- Optional app roles:
  - `Marketplace.Creator`
  - `Marketplace.Admin`

## Outputs

At the end, script prints:

- Static Web App URL
- API URL
- Resource group name
- Key Vault name
