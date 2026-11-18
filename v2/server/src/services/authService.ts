import { compare } from "bcryptjs";
import type { Role } from "@prisma/client";
import { DEMO_ACCOUNTS } from "../auth/demoAccounts.js";
import { ApiError } from "../errors/ApiError.js";
import { prisma } from "../lib/prisma.js";
import type { AuthUser, CreatedAuthSession } from "../types/auth.js";
import { createAuthSession } from "./sessionService.js";

function assertDemoAccountsEnabled(email: string): void {
  const isDemoAccount = DEMO_ACCOUNTS.some((account) => account.email === email);
  if (
    isDemoAccount &&
    process.env.NODE_ENV === "production" &&
    process.env.ENABLE_DEMO_LOGIN !== "true"
  ) {
    throw new ApiError("Akun demo dinonaktifkan di environment production.", 403);
  }
}

function toAuthUser(user: AuthUser): AuthUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    assignedClass: user.assignedClass,
  };
}

async function createSession(user: AuthUser): Promise<CreatedAuthSession> {
  return {
    sessionId: await createAuthSession(user.id),
    user: toAuthUser(user),
  };
}

export async function loginWithPassword(
  email: string,
  password: string,
): Promise<CreatedAuthSession> {
  assertDemoAccountsEnabled(email);
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await compare(password, user.passwordHash))) {
    throw new ApiError("Email atau kata sandi tidak valid.", 401);
  }
  return createSession(user);
}

export async function loginAsDemo(role: Role): Promise<CreatedAuthSession> {
  const account = DEMO_ACCOUNTS.find((candidate) => candidate.role === role);
  if (!account) {
    throw new ApiError("Role demo tidak tersedia.", 400);
  }
  assertDemoAccountsEnabled(account.email);

  const user = await prisma.user.findUnique({
    where: { email: account.email },
  });
  if (!user) {
    throw new ApiError(
      "Akun demo belum tersedia. Jalankan npm run db:seed terlebih dahulu.",
      503,
    );
  }

  return createSession(user);
}

export async function getAuthUserById(id: string): Promise<AuthUser | null> {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      assignedClass: true,
    },
  });
}
