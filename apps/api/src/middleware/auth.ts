import jwt, { JwtHeader, SigningKeyCallback } from "jsonwebtoken";
import jwksClient from "jwks-rsa";
import type { Request, Response, NextFunction } from "express";
import { config } from "../config.js";

export interface AuthenticatedRequest extends Request {
  user?: {
    oid: string;
    upn?: string;
    name?: string;
    role: "viewer" | "creator" | "admin";
  };
}

const client = jwksClient({
  jwksUri: `https://login.microsoftonline.com/${config.entraTenantId}/discovery/v2.0/keys`,
  cache: true,
  cacheMaxAge: 10 * 60 * 1000
});

function getKey(header: JwtHeader, callback: SigningKeyCallback) {
  if (!header.kid) {
    callback(new Error("JWT kid missing"));
    return;
  }
  client.getSigningKey(header.kid, (err, key) => {
    if (err || !key) {
      callback(err ?? new Error("Signing key not found"));
      return;
    }
    callback(null, key.getPublicKey());
  });
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.header("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing bearer token" });
    return;
  }

  const token = authHeader.replace("Bearer ", "");
  jwt.verify(
    token,
    getKey,
    {
      algorithms: ["RS256"],
      issuer: `https://login.microsoftonline.com/${config.entraTenantId}/v2.0`,
      audience: config.entraClientId
    },
    (err, decoded) => {
      if (err || !decoded || typeof decoded === "string") {
        res.status(401).json({ error: "Invalid token" });
        return;
      }

      req.user = {
        oid: String(decoded.oid ?? decoded.sub ?? ""),
        upn: decoded.preferred_username ? String(decoded.preferred_username) : undefined,
        name: decoded.name ? String(decoded.name) : undefined,
        role: resolveRole(decoded)
      };

      if (!req.user.oid) {
        res.status(401).json({ error: "Token missing oid/sub claim" });
        return;
      }
      next();
    }
  );
}

function resolveRole(decoded: jwt.JwtPayload): "viewer" | "creator" | "admin" {
  const groups = Array.isArray(decoded.groups) ? decoded.groups.map(String) : [];
  const roleClaims = Array.isArray(decoded.roles) ? decoded.roles.map(String) : [];

  if (groups.some((groupId) => config.entraAdminGroupIds.includes(groupId))) {
    return "admin";
  }
  if (roleClaims.includes("Marketplace.Admin")) {
    return "admin";
  }
  if (roleClaims.includes("Marketplace.Creator")) {
    return "creator";
  }
  return "viewer";
}

export function requireRole(allowed: Array<"viewer" | "creator" | "admin">) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const role = req.user?.role;
    if (!role || !allowed.includes(role)) {
      res.status(403).json({ error: "Forbidden", requiredRole: allowed });
      return;
    }
    next();
  };
}
