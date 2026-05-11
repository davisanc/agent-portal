import { AgentRecord, PlatformOption, UserProfile } from "./types";

const baseUrl = import.meta.env.VITE_API_BASE_URL as string;

async function withAuth<T>(path: string, accessToken: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      ...(init?.headers ?? {})
    }
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status} ${await response.text()}`);
  }
  return (await response.json()) as T;
}

export const api = {
  getMe(accessToken: string) {
    return withAuth<UserProfile>("/me", accessToken);
  },
  getPlatforms(accessToken: string) {
    return withAuth<PlatformOption[]>("/platforms", accessToken);
  },
  getAgents(
    accessToken: string,
    filters?: { q?: string; platform?: string; tag?: string }
  ) {
    const params = new URLSearchParams();
    if (filters?.q) params.set("q", filters.q);
    if (filters?.platform) params.set("platform", filters.platform);
    if (filters?.tag) params.set("tag", filters.tag);
    const suffix = params.toString() ? `?${params.toString()}` : "";
    return withAuth<AgentRecord[]>(`/agents${suffix}`, accessToken);
  },
  getAgentById(accessToken: string, agentId: string) {
    return withAuth<AgentRecord>(`/agents/${agentId}`, accessToken);
  },
  createAgent(
    accessToken: string,
    payload: { name: string; description: string; tags: string[]; platform: string }
  ) {
    return withAuth<AgentRecord>("/agents", accessToken, {
      method: "POST",
      body: JSON.stringify(payload)
    });
  }
};
