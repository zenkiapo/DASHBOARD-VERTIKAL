import type { RequestHandler } from "express";
import { ApiError } from "../errors/ApiError.js";
import { DEMO_ACCOUNTS } from "../auth/demoAccounts.js";
import {
  clearSessionCookie,
  setSessionCookie,
} from "../middleware/auth.js";
import {
  getAuthUserById,
  loginAsDemo,
  loginWithPassword,
} from "../services/authService.js";
import { destroyAuthSession } from "../services/sessionService.js";

function readCredentials(body: unknown): { email: string; password: string } {
  if (typeof body !== "object" || body === null) {
    throw new ApiError("Email dan kata sandi wajib diisi.", 400);
  }
  const { email, password } = body as Record<string, unknown>;
  if (
    typeof email !== "string" ||
    typeof password !== "string" ||
    email.length > 254 ||
    password.length > 128 ||
    !email.trim() ||
    !password
  ) {
    throw new ApiError("Email dan kata sandi wajib diisi.", 400);
  }
  return { email: email.trim().toLowerCase(), password };
}

export const loginController: RequestHandler = async (request, response, next) => {
  try {
    const { email, password } = readCredentials(request.body);
    const session = await loginWithPassword(email, password);
    setSessionCookie(response, session.sessionId);
    response.json({ user: session.user });
  } catch (error) {
    next(error);
  }
};

export const demoLoginController: RequestHandler = async (
  request,
  response,
  next,
) => {
  try {
    const role = (request.body as { role?: unknown } | null)?.role;
    const account = DEMO_ACCOUNTS.find((candidate) => candidate.role === role);
    if (!account) {
      throw new ApiError("Pilih role demo yang tersedia.", 400);
    }
    const session = await loginAsDemo(account.role);
    setSessionCookie(response, session.sessionId);
    response.json({ user: session.user });
  } catch (error) {
    next(error);
  }
};

export const currentUserController: RequestHandler = async (
  request,
  response,
  next,
) => {
  try {
    if (!request.authUser) throw new ApiError("Autentikasi diperlukan.", 401);
    const user = await getAuthUserById(request.authUser.id);
    if (!user) throw new ApiError("Akun tidak lagi tersedia.", 401);
    response.json({ user });
  } catch (error) {
    next(error);
  }
};

export const logoutController: RequestHandler = async (
  request,
  response,
  next,
) => {
  try {
    if (request.authSessionId) {
      await destroyAuthSession(request.authSessionId);
    }
    clearSessionCookie(response);
    response.status(204).end();
  } catch (error) {
    next(error);
  }
};
