import type { UserRole } from "./policyNotes";

export type AnnouncementPriority = "LOW" | "NORMAL" | "HIGH";

export interface AnnouncementDTO {
  id: string;
  title: string;
  habitCategory: string;
  targetScope: string;
  priority: AnnouncementPriority;
  content: string;
  eventDate: string | null;
  createdAt: string;
  updatedAt: string;
  author: {
    name: string;
    role: UserRole;
  };
}

export interface AnnouncementDraft {
  title: string;
  habitCategory: string;
  targetScope: string;
  priority: AnnouncementPriority;
  content: string;
  eventDate: string;
}
