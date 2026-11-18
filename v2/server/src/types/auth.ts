import type { Role } from "@prisma/client";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  assignedClass: string | null;
}

export interface AuthSessionDTO {
  user: AuthUser;
}

export interface CreatedAuthSession extends AuthSessionDTO {
  sessionId: string;
}

declare global {
  namespace Express {
    interface Request {
      authUser?: AuthUser;
      authSessionId?: string;
    }
  }
}
