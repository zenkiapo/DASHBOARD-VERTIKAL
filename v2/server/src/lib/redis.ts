import { createClient } from "redis";
import { getRedisUrl } from "../config/env.js";

let client: ReturnType<typeof createClient> | undefined;

export function getRedisClient(): ReturnType<typeof createClient> {
  if (!client) {
    client = createClient({ url: getRedisUrl() });
    client.on("error", (error: Error) => {
      console.error("[redis] Connection error", error);
    });
  }
  return client;
}

export async function connectRedis(): Promise<void> {
  const redis = getRedisClient();
  if (!redis.isOpen) await redis.connect();
}

export async function closeRedis(): Promise<void> {
  if (client?.isOpen) await client.quit();
}
