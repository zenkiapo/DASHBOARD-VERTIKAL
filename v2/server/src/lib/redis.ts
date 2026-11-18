import { Redis } from "@upstash/redis";
import { getUpstashRedisConfig } from "../config/env.js";

let client: Redis | undefined;

export function getRedisClient(): Redis {
  if (!client) {
    const { url, token } = getUpstashRedisConfig();
    client = new Redis({ url, token });
  }
  return client;
}

export async function connectRedis(): Promise<void> {
  await getRedisClient().ping();
}
