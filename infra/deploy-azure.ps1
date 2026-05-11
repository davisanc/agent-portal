param(
  [Parameter(Mandatory = $true)][string]$SubscriptionId,
  [Parameter(Mandatory = $true)][string]$EntraTenantId,
  [Parameter(Mandatory = $true)][string]$EntraApiClientId,
  [Parameter(Mandatory = $true)][string]$EntraSpaClientId,
  [Parameter(Mandatory = $true)][string]$ApiScope,
  [string]$ResourceGroupName = "rg-agent-marketplace-weu",
  [string]$Location = "westeurope",
  [string]$Prefix = "agentmkt$((Get-Random -Minimum 1000 -Maximum 9999))",
  [string]$PostgresAdminUser = "pgadmin",
  [string]$PostgresAdminPassword = "",
  [string]$AwsRegion = "us-east-1",
  [string]$AwsAccessKeyId = "",
  [string]$AwsSecretAccessKey = "",
  [string]$AwsBedrockAgentRoleArn = "",
  [string]$FoundryApiBaseUrl = "",
  [string]$FoundryApiKey = "",
  [string]$EntraAdminGroupIds = ""
)

$ErrorActionPreference = "Stop"

if (-not $PostgresAdminPassword) {
  $PostgresAdminPassword = -join ((48..57 + 65..90 + 97..122) | Get-Random -Count 24 | ForEach-Object {[char]$_})
}

Write-Host "Using prefix: $Prefix"
Write-Host "Setting subscription..."
az account set --subscription $SubscriptionId | Out-Null

Write-Host "Creating resource group..."
az group create --name $ResourceGroupName --location $Location | Out-Null

Write-Host "Deploying infrastructure..."
$deployment = az deployment group create `
  --resource-group $ResourceGroupName `
  --template-file "infra/main.bicep" `
  --parameters `
      location=$Location `
      prefix=$Prefix `
      postgresAdminUser=$PostgresAdminUser `
      postgresAdminPassword=$PostgresAdminPassword `
  --query properties.outputs -o json | ConvertFrom-Json

$apiName = $deployment.apiName.value
$apiHost = $deployment.apiDefaultHostname.value
$swaName = $deployment.staticWebAppName.value
$swaHost = $deployment.staticWebAppDefaultHostname.value
$pgHost = $deployment.postgresFqdn.value
$pgDb = $deployment.postgresDatabase.value
$kvName = $deployment.keyVaultName.value

$postgresUrl = "postgres://$PostgresAdminUser`:$PostgresAdminPassword@$pgHost:5432/$pgDb?sslmode=require"

Write-Host "Allowing Azure services to access PostgreSQL..."
az postgres flexible-server firewall-rule create `
  --resource-group $ResourceGroupName `
  --name "$Prefix-pg" `
  --rule-name AllowAzureServices `
  --start-ip-address 0.0.0.0 `
  --end-ip-address 0.0.0.0 | Out-Null

Write-Host "Configuring Key Vault secrets..."
az keyvault secret set --vault-name $kvName --name "postgres-url" --value $postgresUrl | Out-Null
az keyvault secret set --vault-name $kvName --name "aws-region" --value $AwsRegion | Out-Null
az keyvault secret set --vault-name $kvName --name "aws-access-key-id" --value $AwsAccessKeyId | Out-Null
az keyvault secret set --vault-name $kvName --name "aws-secret-access-key" --value $AwsSecretAccessKey | Out-Null
az keyvault secret set --vault-name $kvName --name "aws-bedrock-agent-role-arn" --value $AwsBedrockAgentRoleArn | Out-Null
az keyvault secret set --vault-name $kvName --name "foundry-api-base-url" --value $FoundryApiBaseUrl | Out-Null
az keyvault secret set --vault-name $kvName --name "foundry-api-key" --value $FoundryApiKey | Out-Null
az keyvault secret set --vault-name $kvName --name "entra-admin-group-ids" --value $EntraAdminGroupIds | Out-Null

Write-Host "Configuring API app settings..."
az webapp config appsettings set `
  --resource-group $ResourceGroupName `
  --name $apiName `
  --settings `
    PORT=8080 `
    WEBSITE_NODE_DEFAULT_VERSION="~20" `
    POSTGRES_URL=$postgresUrl `
    ALLOWED_ORIGIN="https://$swaHost" `
    ENTRA_TENANT_ID=$EntraTenantId `
    ENTRA_CLIENT_ID=$EntraApiClientId `
    ENTRA_ADMIN_GROUP_IDS=$EntraAdminGroupIds `
    AWS_REGION=$AwsRegion `
    AWS_ACCESS_KEY_ID=$AwsAccessKeyId `
    AWS_SECRET_ACCESS_KEY=$AwsSecretAccessKey `
    AWS_BEDROCK_AGENT_ROLE_ARN=$AwsBedrockAgentRoleArn `
    MICROSOFT_GRAPH_BASE_URL="https://graph.microsoft.com" `
    FOUNDRY_API_BASE_URL=$FoundryApiBaseUrl `
    FOUNDRY_API_KEY=$FoundryApiKey | Out-Null

Write-Host "Building and packaging API..."
Push-Location "apps/api"
npm install
npm run build
npm install --omit=dev
if (Test-Path "api-deploy.zip") { Remove-Item "api-deploy.zip" -Force }
Compress-Archive -Path "dist","package.json","package-lock.json","node_modules" -DestinationPath "api-deploy.zip"
Pop-Location

Write-Host "Deploying API package..."
az webapp deploy `
  --resource-group $ResourceGroupName `
  --name $apiName `
  --src-path "apps/api/api-deploy.zip" `
  --type zip | Out-Null

Write-Host "Building web app with generated SWA domain..."
Push-Location "apps/web"
$env:VITE_ENTRA_CLIENT_ID = $EntraSpaClientId
$env:VITE_ENTRA_TENANT_ID = $EntraTenantId
$env:VITE_ENTRA_REDIRECT_URI = "https://$swaHost"
$env:VITE_API_BASE_URL = "https://$apiHost"
$env:VITE_API_SCOPE = $ApiScope
npm install
npm run build
Pop-Location

Write-Host "Fetching SWA deployment token..."
$deploymentToken = az staticwebapp secrets list `
  --resource-group $ResourceGroupName `
  --name $swaName `
  --query properties.apiKey `
  -o tsv

Write-Host "Deploying static web app..."
Push-Location "apps/web"
npx @azure/static-web-apps-cli deploy ./dist --deployment-token $deploymentToken --env production
Pop-Location

Write-Host ""
Write-Host "Deployment complete."
Write-Host "Static Web App URL: https://$swaHost"
Write-Host "API URL: https://$apiHost"
Write-Host "Resource Group: $ResourceGroupName"
Write-Host "Key Vault: $kvName"
