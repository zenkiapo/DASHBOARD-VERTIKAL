export type UserRole = "KEPSEK" | "GURU_BK" | "WALI_KELAS" | "ADMIN" | "SISWA";
export type NoteStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  assignedClass: string | null;
}

export interface AuthSession {
  user: AuthUser;
}

export interface PolicyNoteDTO {
  id: string;
  habitCategory: string;
  targetScope: string;
  noteContent: string;
  followUpNote: string | null;
  status: NoteStatus;
  createdAt: string;
  updatedAt: string;
  author: {
    name: string;
    role: UserRole;
  };
}

export interface PolicyNoteContent {
  habitCategory: string;
  targetScope: string;
  noteContent: string;
}

export interface PolicyNoteFollowUp {
  status?: NoteStatus;
  followUpNote?: string | null;
}
