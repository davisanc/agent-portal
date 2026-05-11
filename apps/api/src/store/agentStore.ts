import { db } from "../db.js";
import { AgentRecord, CreateAgentRequest, Platform } from "../types/agent.js";

export interface AgentQuery {
  q?: string;
  platform?: Platform;
  tag?: string;
}

function mapRow(row: Record<string, unknown>): AgentRecord {
  return {
    id: String(row.id),
    name: String(row.name),
    description: String(row.description),
    tags: Array.isArray(row.tags) ? row.tags.map(String) : [],
    platform: row.platform as Platform,
    createdAt: new Date(String(row.created_at)).toISOString(),
    externalId: String(row.external_id),
    ownerUserId: String(row.owner_user_id)
  };
}

export async function upsertUser(input: {
  userId: string;
  userName?: string;
  userEmail?: string;
  role: "viewer" | "creator" | "admin";
}): Promise<void> {
  await db.query(
    `
      INSERT INTO users (user_id, user_name, user_email, role)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (user_id) DO UPDATE
      SET user_name = EXCLUDED.user_name,
          user_email = EXCLUDED.user_email,
          role = EXCLUDED.role,
          updated_at = NOW()
    `,
    [input.userId, input.userName ?? null, input.userEmail ?? null, input.role]
  );
}

export async function listAgents(filters: AgentQuery): Promise<AgentRecord[]> {
  const where: string[] = [];
  const values: unknown[] = [];

  if (filters.q) {
    values.push(`%${filters.q}%`);
    const idx = values.length;
    where.push(`(name ILIKE $${idx} OR description ILIKE $${idx})`);
  }
  if (filters.platform) {
    values.push(filters.platform);
    where.push(`platform = $${values.length}`);
  }
  if (filters.tag) {
    values.push(filters.tag);
    where.push(`$${values.length} = ANY(tags)`);
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const result = await db.query(
    `
      SELECT id, name, description, tags, platform, created_at, external_id, owner_user_id
      FROM agents
      ${whereSql}
      ORDER BY created_at DESC
      LIMIT 200
    `,
    values
  );
  return result.rows.map(mapRow);
}

export async function getAgentById(id: string): Promise<AgentRecord | null> {
  const result = await db.query(
    `
      SELECT id, name, description, tags, platform, created_at, external_id, owner_user_id
      FROM agents
      WHERE id = $1
      LIMIT 1
    `,
    [id]
  );
  if (!result.rows.length) {
    return null;
  }
  return mapRow(result.rows[0]);
}

export async function saveAgent(
  input: CreateAgentRequest & { externalId: string; ownerUserId: string }
): Promise<AgentRecord> {
  const result = await db.query(
    `
      INSERT INTO agents (name, description, tags, platform, external_id, owner_user_id)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, name, description, tags, platform, created_at, external_id, owner_user_id
    `,
    [
      input.name,
      input.description,
      input.tags,
      input.platform,
      input.externalId,
      input.ownerUserId
    ]
  );
  return mapRow(result.rows[0]);
}
