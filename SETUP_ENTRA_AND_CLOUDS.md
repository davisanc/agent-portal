# Setup Guide

## 1) Microsoft Entra app registrations

Create two app registrations:

- SPA app (frontend)
  - Redirect URI: `http://localhost:5173`
- API app (backend)
  - Expose API scope: `access_as_user`

Grant delegated permissions for sign-in (`openid`, `profile`, `email`) and your API scope to the SPA app.

## 2) API env values

In `apps/api/.env`:

- `POSTGRES_URL`: Postgres connection string
- `ENTRA_TENANT_ID`: your Entra tenant
- `ENTRA_CLIENT_ID`: API app client ID (audience for JWT validation)
- `ENTRA_ADMIN_GROUP_IDS`: comma-separated Entra group IDs mapped to admin role
- `AWS_*`: credentials/role for Bedrock agent creation
- `FOUNDRY_*`: Foundry endpoint and key

## 3) Role-based access setup (Entra)

The API resolves user role in this order:

1. If user belongs to one of `ENTRA_ADMIN_GROUP_IDS` => `admin`
2. If token role claim contains `Marketplace.Admin` => `admin`
3. If token role claim contains `Marketplace.Creator` => `creator`
4. Otherwise => `viewer`

To enable app roles:

- Define `Marketplace.Admin` and `Marketplace.Creator` app roles in your API app registration
- Assign users/groups to those app roles in Enterprise Applications
- Ensure role claims are emitted in access tokens

## 4) Web env values

In `apps/web/.env`:

- `VITE_ENTRA_CLIENT_ID`: SPA app client ID
- `VITE_ENTRA_TENANT_ID`: tenant ID
- `VITE_API_SCOPE`: `api://<api-app-client-id>/access_as_user`
- `VITE_API_BASE_URL`: usually `http://localhost:4000`

## 5) Provider endpoint alignment

Provider APIs vary by tenant configuration and region. Confirm endpoint contracts and update:

- `apps/api/src/providers/copilotStudioProvider.ts`
- `apps/api/src/providers/foundryProvider.ts`

AWS Bedrock provider uses SDK and is ready once IAM role and model access are configured.
