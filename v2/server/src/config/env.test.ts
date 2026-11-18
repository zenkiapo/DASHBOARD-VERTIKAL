import assert from "node:assert/strict";
import { test } from "node:test";
import { getAllowedOrigins, getUpstashRedisConfig } from "./env.js";

test("CORS allowlist accepts the exact Vercel and local development origins", () => {
  const previousOrigins = process.env.CLIENT_ORIGINS;
  const previousNodeEnv = process.env.NODE_ENV;
  process.env.CLIENT_ORIGINS =
    "https://smavo-dashboard.vercel.app,http://localhost:5173";
  process.env.NODE_ENV = "development";

  try {
    const origins = getAllowedOrigins();
    assert.equal(origins.has("https://smavo-dashboard.vercel.app"), true);
    assert.equal(origins.has("http://localhost:5173"), true);
    assert.equal(origins.has("https://untrusted.example"), false);
  } finally {
    if (previousOrigins === undefined) delete process.env.CLIENT_ORIGINS;
    else process.env.CLIENT_ORIGINS = previousOrigins;
    if (previousNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previousNodeEnv;
  }
});

test("production CORS origins must use HTTPS", () => {
  const previousOrigins = process.env.CLIENT_ORIGINS;
  const previousNodeEnv = process.env.NODE_ENV;
  process.env.CLIENT_ORIGINS = "http://localhost:5173";
  process.env.NODE_ENV = "production";

  try {
    assert.throws(() => getAllowedOrigins(), /HTTPS di production/);
  } finally {
    if (previousOrigins === undefined) delete process.env.CLIENT_ORIGINS;
    else process.env.CLIENT_ORIGINS = previousOrigins;
    if (previousNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previousNodeEnv;
  }
});

test("Upstash Redis config requires a secure URL and a REST token", () => {
  const previousUrl = process.env.UPSTASH_REDIS_REST_URL;
  const previousToken = process.env.UPSTASH_REDIS_REST_TOKEN;
  process.env.UPSTASH_REDIS_REST_URL = "https://example.upstash.io";
  process.env.UPSTASH_REDIS_REST_TOKEN = "test-token";

  try {
    assert.deepEqual(getUpstashRedisConfig(), {
      url: "https://example.upstash.io",
      token: "test-token",
    });

    process.env.UPSTASH_REDIS_REST_URL = "http://example.upstash.io";
    assert.throws(() => getUpstashRedisConfig(), /HTTPS/);

    process.env.UPSTASH_REDIS_REST_URL = "https://example.upstash.io";
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    assert.throws(() => getUpstashRedisConfig(), /UPSTASH_REDIS_REST_URL/);
  } finally {
    if (previousUrl === undefined) delete process.env.UPSTASH_REDIS_REST_URL;
    else process.env.UPSTASH_REDIS_REST_URL = previousUrl;
    if (previousToken === undefined) delete process.env.UPSTASH_REDIS_REST_TOKEN;
    else process.env.UPSTASH_REDIS_REST_TOKEN = previousToken;
  }
});
