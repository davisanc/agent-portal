import { FormEvent, useEffect, useMemo, useState } from "react";
import { useMsal } from "@azure/msal-react";
import { InteractionRequiredAuthError } from "@azure/msal-browser";
import { api } from "./api";
import { loginRequest } from "./msalConfig";
import { AgentRecord, Platform, PlatformOption, UserProfile } from "./types";

async function getAccessToken(instance: ReturnType<typeof useMsal>["instance"]) {
  const account = instance.getActiveAccount() ?? instance.getAllAccounts()[0];
  if (!account) {
    throw new Error("No signed in account found");
  }
  try {
    const result = await instance.acquireTokenSilent({ ...loginRequest, account });
    return result.accessToken;
  } catch (error) {
    if (error instanceof InteractionRequiredAuthError) {
      const result = await instance.acquireTokenPopup({ ...loginRequest, account });
      return result.accessToken;
    }
    throw error;
  }
}

export function App() {
  const { instance, accounts } = useMsal();
  const [platforms, setPlatforms] = useState<PlatformOption[]>([]);
  const [agents, setAgents] = useState<AgentRecord[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<AgentRecord | null>(null);
  const [me, setMe] = useState<UserProfile | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [platform, setPlatform] = useState<Platform>("copilot-studio");
  const [query, setQuery] = useState("");
  const [platformFilter, setPlatformFilter] = useState<string>("");
  const [tagFilter, setTagFilter] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const account = useMemo(() => accounts[0], [accounts]);

  const canCreate = me?.role === "creator" || me?.role === "admin";

  const signIn = async () => {
    const result = await instance.loginPopup(loginRequest);
    instance.setActiveAccount(result.account);
  };

  const signOut = async () => {
    await instance.logoutPopup({
      account: account
    });
  };

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getAccessToken(instance);
      const [profile, p, a] = await Promise.all([
        api.getMe(token),
        api.getPlatforms(token),
        api.getAgents(token, {
          q: query || undefined,
          platform: platformFilter || undefined,
          tag: tagFilter || undefined
        })
      ]);
      setMe(profile);
      setPlatforms(p);
      setAgents(a);
      if (a.length > 0 && !selectedAgent) {
        setSelectedAgent(a[0]);
      }
      if (p.length) {
        setPlatform(p[0].id);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (account) {
      loadData().catch(() => undefined);
    }
  }, [account]);

  const onCreate = async (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim() || !description.trim()) {
      setError("Name and description are required.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const token = await getAccessToken(instance);
      await api.createAgent(token, {
        name: name.trim(),
        description: description.trim(),
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        platform
      });
      setName("");
      setDescription("");
      setTags("");
      await loadData();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Agent creation failed");
    } finally {
      setLoading(false);
    }
  };

  const onViewDetails = async (agentId: string) => {
    try {
      const token = await getAccessToken(instance);
      const detail = await api.getAgentById(token, agentId);
      setSelectedAgent(detail);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load details");
    }
  };

  const onSearch = async (event: FormEvent) => {
    event.preventDefault();
    await loadData();
  };

  return (
    <main className="container">
      <header className="header">
        <h1>Agent Marketplace</h1>
        {!account ? (
          <button onClick={signIn}>Sign in with Microsoft Entra</button>
        ) : (
          <div className="headerActions">
            <span>{account.username}</span>
            {me ? <span className="badge">{me.role}</span> : null}
            <button onClick={signOut}>Sign out</button>
          </div>
        )}
      </header>

      {!account ? (
        <section className="card">Authenticate to manage and publish agents.</section>
      ) : (
        <>
          <section className="card">
            <h2>Create Agent</h2>
            {!canCreate ? (
              <p>Your role is viewer. Ask an admin to grant creator/admin permissions.</p>
            ) : null}
            <form onSubmit={onCreate} className="form">
              <label>
                Name
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Customer Support Assistant"
                />
              </label>
              <label>
                Description
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Helps users with support workflows."
                />
              </label>
              <label>
                Tags (comma separated)
                <input
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="support, hr, finance"
                />
              </label>
              <label>
                Platform
                <select value={platform} onChange={(e) => setPlatform(e.target.value as Platform)}>
                  {platforms.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </label>
              <button type="submit" disabled={loading || !canCreate}>
                {loading ? "Creating..." : "Create Agent"}
              </button>
            </form>
          </section>

          <section className="card">
            <h2>Marketplace Catalog</h2>
            <form className="filters" onSubmit={onSearch}>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search name or description"
              />
              <select value={platformFilter} onChange={(e) => setPlatformFilter(e.target.value)}>
                <option value="">All platforms</option>
                {platforms.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <input
                value={tagFilter}
                onChange={(e) => setTagFilter(e.target.value)}
                placeholder="Filter by tag"
              />
              <button type="submit">Apply</button>
            </form>
            {agents.length === 0 ? (
              <p>No agents yet. Create your first one.</p>
            ) : (
              <ul className="agentList">
                {agents.map((agent) => (
                  <li key={agent.id} className="agentItem">
                    <h3>{agent.name}</h3>
                    <p>{agent.description}</p>
                    <p className="tags">{agent.tags.map((tag) => `#${tag}`).join(" ")}</p>
                    <small>
                      {agent.platform} | External ID: {agent.externalId}
                    </small>
                    <div className="itemActions">
                      <button type="button" onClick={() => onViewDetails(agent.id)}>
                        View Details
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="card">
            <h2>Agent Details</h2>
            {!selectedAgent ? (
              <p>Select an agent to view full details.</p>
            ) : (
              <div className="details">
                <p>
                  <strong>Name:</strong> {selectedAgent.name}
                </p>
                <p>
                  <strong>Description:</strong> {selectedAgent.description}
                </p>
                <p>
                  <strong>Platform:</strong> {selectedAgent.platform}
                </p>
                <p>
                  <strong>Tags:</strong> {selectedAgent.tags.join(", ") || "none"}
                </p>
                <p>
                  <strong>Owner:</strong> {selectedAgent.ownerUserId}
                </p>
                <p>
                  <strong>External ID:</strong> {selectedAgent.externalId}
                </p>
                <p>
                  <strong>Created:</strong> {new Date(selectedAgent.createdAt).toLocaleString()}
                </p>
              </div>
            )}
          </section>
        </>
      )}

      {error ? <p className="error">{error}</p> : null}
    </main>
  );
}
