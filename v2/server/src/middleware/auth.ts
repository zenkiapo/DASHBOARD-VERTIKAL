import type { RequestHandler, Response } from "express";
import { getSessionCookieName, getSessionTtlSeconds } from "../config/env.js";
import { ApiError } from "../errors/ApiError.js";
import { getAuthUserById } from "../services/authService.js";
import {
  destroyAuthSession,
  getSessionUserId,
} from "../services/sessionService.js";

function readSessionId(cookieHeader: string | undefined): string | null {
  if (!cookieHeader) return null;
  const cookieName = getSessionCookieName();
  const cookie = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${cookieName}=`));
  const sessionId = cookie?.slice(cookieName.length + 1);
  return sessionId && /^[A-Za-z0-9_-]{43}$/.test(sessionId) ? sessionId : null;
}

export function setSessionCookie(response: Response, sessionId: string): void {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  const sameSite = process.env.NODE_ENV === "production" ? "None" : "Lax";
  response.append(
    "Set-Cookie",
    `${getSessionCookieName()}=${sessionId}; Path=/; HttpOnly; SameSite=${sameSite}; Max-Age=${getSessionTtlSeconds()}${secure}`,
  );
}

export function clearSessionCookie(response: Response): void {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  const sameSite = process.env.NODE_ENV === "production" ? "None" : "Lax";
  response.append(
    "Set-Cookie",
    `${getSessionCookieName()}=; Path=/; HttpOnly; SameSite=${sameSite}; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT${secure}`,
  );
}

async function authenticate(
  cookieHeader: string | undefined,
  optional: boolean,
  request: Parameters<RequestHandler>[0],
  response: Parameters<RequestHandler>[1],
  next: Parameters<RequestHandler>[2],
): Promise<void> {
  const sessionId = readSessionId(cookieHeader);
  request.authSessionId = sessionId ?? undefined;
  if (!sessionId) {
    if (optional) {
      next();
      return;
    }
    response.status(401).json({ error: "Autentikasi diperlukan." });
    return;
  }

  const userId = await getSessionUserId(sessionId);
  if (!userId) {
    clearSessionCookie(response);
    response.status(401).json({ error: "Sesi berakhir atau tidak valid." });
    return;
  }

  const user = await getAuthUserById(userId);
  if (!user) {
    await destroyAuthSession(sessionId);
    clearSessionCookie(response);
    response.status(401).json({ error: "Akun tidak lagi tersedia." });
    return;
  }
  request.authUser = user;
  next();
}

export const requireAuth: RequestHandler = async (request, response, next) => {
  try {
    await authenticate(request.headers.cookie, false, request, response, next);
  } catch (error) {
    next(error);
  }
};

export const optionalAuth: RequestHandler = async (request, response, next) => {
  try {
    await authenticate(request.headers.cookie, true, request, response, next);
  } catch (error) {
    next(error);
  }
};

export function authorizeRoles(
  ...roles: Array<"KEPSEK" | "GURU_BK" | "WALI_KELAS" | "ADMIN" | "SISWA">
): RequestHandler {
  return (request, response, next) => {
    if (!request.authUser) {
      next(new ApiError("Autentikasi diperlukan.", 401));
      return;
    }
    if (!roles.includes(request.authUser.role)) {
      next(new ApiError("Role tidak memiliki izin untuk tindakan ini.", 403));
      return;
    }
    next();
  };
}
