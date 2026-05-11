import { Configuration } from "@azure/msal-browser";

const clientId = import.meta.env.VITE_ENTRA_CLIENT_ID as string;
const tenantId = import.meta.env.VITE_ENTRA_TENANT_ID as string;

export const loginRequest = {
  scopes: [
    "openid",
    "profile",
    "email",
    import.meta.env.VITE_API_SCOPE as string
  ]
};

export const msalConfig: Configuration = {
  auth: {
    clientId,
    authority: `https://login.microsoftonline.com/${tenantId}`,
    redirectUri: (import.meta.env.VITE_ENTRA_REDIRECT_URI as string) ?? window.location.origin
  },
  cache: {
    cacheLocation: "localStorage"
  }
};
