# GitHub Actions Setup

This repository includes a deployment workflow at:

- `.github/workflows/deploy-azure.yml`

It deploys:

1. API (`apps/api`) to Azure App Service
2. Frontend (`apps/web`) to Azure Static Web Apps

on push to `main` (or manual run via `workflow_dispatch`).

## Required GitHub secrets

Add these in your GitHub repository:

`Settings -> Secrets and variables -> Actions -> New repository secret`

### Azure API deployment

- `AZURE_API_APP_NAME`
  - Example: `agentmkt1234-api`
- `AZURE_API_PUBLISH_PROFILE`
  - Download from Azure Portal:
    - App Service -> Overview -> Get publish profile
  - Paste full XML content as secret value.

### Static Web App deployment

- `AZURE_STATIC_WEB_APPS_API_TOKEN`
  - Get from Azure Portal:
    - Static Web App -> Manage deployment token

### Frontend build-time variables

- `VITE_ENTRA_CLIENT_ID`
- `VITE_ENTRA_TENANT_ID`
- `VITE_ENTRA_REDIRECT_URI`
  - Use the generated SWA domain, e.g. `https://<random>.azurestaticapps.net`
- `VITE_API_BASE_URL`
  - Your API app URL, e.g. `https://agentmkt1234-api.azurewebsites.net`
- `VITE_API_SCOPE`
  - `api://<api-app-client-id>/access_as_user`

## First run checklist

1. Ensure Azure resources are already created.
2. Ensure API App Service environment variables are configured (database, AWS, Foundry, Entra).
3. Add all secrets listed above.
4. Push to `main` or trigger workflow manually.

## Notes

- Frontend deploy runs after successful API deploy.
- If you change the Static Web App generated domain, update:
  - `VITE_ENTRA_REDIRECT_URI`
  - API `ALLOWED_ORIGIN` app setting
