import { randomBytes } from "node:crypto";
import { getRedisClient } from "../lib/redis.js";
import { getSessionTtlSeconds } from "../config/env.js";

const SESSION_KEY_PREFIX = "smavo:session:";

function sessionKey(sessionId: string): string {
  return `${SESSION_KEY_PREFIX}${sessionId}`;
}

export async function createAuthSession(userId: string): Promise<string> {
  const sessionId = randomBytes(32).toString("base64url");
  await getRedisClient().set(sessionKey(sessionId), userId, {
    ex: getSessionTtlSeconds(),
  });
  return sessionId;
}

export async function getSessionUserId(
  sessionId: string,
): Promise<string | null> {
  return getRedisClient().get(sessionKey(sessionId));
}

export async function destroyAuthSession(sessionId: string): Promise<void> {
  await getRedisClient().del(sessionKey(sessionId));
}
