# Agent Marketplace Portal

Internal web portal to authenticate users with Microsoft Entra ID, create simple agents across supported platforms (Microsoft Copilot Studio, Azure AI Foundry, and AWS Bedrock), and publish them in a unified marketplace view.

## Architecture

- `apps/web`: React + Vite frontend, Entra login with MSAL, role-aware create flow, search/filter UI, and agent details panel.
- `apps/api`: Node + Express backend, token validation, RBAC authorization, provider adapters for Microsoft and AWS APIs, normalized agent catalog.
- `PostgreSQL`: durable persistence for users, roles, and agent catalog metadata.
- Shared contracts are simple JSON DTOs under `apps/api/src/types`.

## Quick start

1. Install dependencies in each app:
   - `cd apps/api && npm install`
   - `cd ../web && npm install`
2. Copy `.env.example` to `.env` in both apps and fill values.
3. Run API:
   - `cd apps/api && npm run dev`
4. Run web:
   - `cd apps/web && npm run dev`

## Features

- Microsoft Entra authentication and bearer-token validation
- Role-based access (`viewer`, `creator`, `admin`) with Entra role/group mapping
- Agent creation against Copilot Studio, Foundry, or Bedrock via provider adapters
- Marketplace listing with search (`q`), platform filter, and tag filter
- Details view per agent

## Notes

- This scaffold includes real auth wiring for Entra sign-in and API bearer token usage.
- Microsoft and AWS provider clients are implemented as service adapters with clear TODO markers for endpoint specifics (tenant-specific APIs differ by setup and region).
- API creates required PostgreSQL tables at startup.

## Azure deployment

- Infrastructure and deployment automation are in `infra/main.bicep` and `infra/deploy-azure.ps1`.
- Deployment guide is in `AZURE_DEPLOYMENT.md`.
- Static Web Apps uses its generated default domain by default.

## GitHub Actions deployment

- CI/CD workflow is in `.github/workflows/deploy-azure.yml`.
- Setup instructions and required repository secrets are in `GITHUB_ACTIONS_SETUP.md`.
