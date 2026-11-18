import "dotenv/config";
import app from "./app.js";
import { validateEnvironment } from "./config/env.js";
import { prisma } from "./lib/prisma.js";
import { closeRedis, connectRedis } from "./lib/redis.js";

const port = Number(process.env.PORT ?? 4000);

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("PORT harus berupa bilangan bulat antara 1 dan 65535.");
}

async function startServer(): Promise<void> {
  validateEnvironment();
  await Promise.all([prisma.$connect(), connectRedis()]);
  const server = app.listen(port, () => {
    console.log(`7 KAIH dashboard API berjalan di http://localhost:${port}`);
  });

  const shutdown = (signal: string) => {
    server.close((error) => {
      if (error) {
        console.error(`[server] Gagal berhenti setelah ${signal}.`, error);
        process.exitCode = 1;
      }
      void Promise.allSettled([prisma.$disconnect(), closeRedis()]).then(
        (results) => {
          for (const result of results) {
            if (result.status === "rejected") {
              console.error("[server] Gagal menutup koneksi database.", result.reason);
              process.exitCode = 1;
            }
          }
        },
      );
    });
  };
  process.once("SIGINT", () => shutdown("SIGINT"));
  process.once("SIGTERM", () => shutdown("SIGTERM"));
}

startServer().catch((error: unknown) => {
  console.error("[server] Gagal memulai API.", error);
  void Promise.allSettled([prisma.$disconnect(), closeRedis()]).then(() => {
    process.exitCode = 1;
  });
});
