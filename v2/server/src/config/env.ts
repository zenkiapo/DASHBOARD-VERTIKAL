export function getRedisUrl(): string {
  const value = process.env.REDIS_URL?.trim();
  if (!value) {
    throw new Error("REDIS_URL wajib diisi untuk penyimpanan sesi.");
  }
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error("REDIS_URL harus berupa URL Redis yang valid.");
  }
  if (!["redis:", "rediss:"].includes(url.protocol) || !url.hostname) {
    throw new Error("REDIS_URL harus menggunakan protokol redis:// atau rediss://.");
  }
  return value;
}

export function getAllowedOrigins(): Set<string> {
  const configuredOrigins =
    process.env.CLIENT_ORIGINS?.trim() ||
    process.env.CLIENT_ORIGIN?.trim() ||
    "http://localhost:5173";
  const origins = configuredOrigins.split(",").map((origin) => origin.trim());
  if (origins.some((origin) => !origin)) {
    throw new Error("CLIENT_ORIGINS tidak boleh berisi origin kosong.");
  }

  const normalizedOrigins = origins.map((origin) => {
    let url: URL;
    try {
      url = new URL(origin);
    } catch {
      throw new Error("CLIENT_ORIGINS harus berupa daftar origin URL yang valid.");
    }
    if (
      !["http:", "https:"].includes(url.protocol) ||
      url.pathname !== "/" ||
      url.search ||
      url.hash
    ) {
      throw new Error("CLIENT_ORIGINS hanya boleh berisi origin, tanpa path.");
    }
    if (process.env.NODE_ENV === "production" && url.protocol !== "https:") {
      throw new Error("CLIENT_ORIGINS harus menggunakan HTTPS di production.");
    }
    return url.origin;
  });

  return new Set(normalizedOrigins);
}

export function getSessionCookieName(): string {
  const name = process.env.SESSION_COOKIE_NAME?.trim() || "smavo.sid";
  if (!/^[A-Za-z0-9._-]+$/.test(name)) {
    throw new Error("SESSION_COOKIE_NAME hanya boleh berisi huruf, angka, titik, garis bawah, dan tanda hubung.");
  }
  return name;
}

export function getSessionTtlSeconds(): number {
  const raw = process.env.SESSION_TTL_SECONDS?.trim();
  if (!raw) return 8 * 60 * 60;
  const ttl = Number(raw);
  if (!Number.isSafeInteger(ttl) || ttl < 60) {
    throw new Error("SESSION_TTL_SECONDS harus berupa bilangan bulat minimal 60.");
  }
  return ttl;
}

export function validateEnvironment(): void {
  getRedisUrl();
  getAllowedOrigins();
  getSessionCookieName();
  getSessionTtlSeconds();
}
