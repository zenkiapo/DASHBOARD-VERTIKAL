import type { NoteStatus, UserRole } from "./policyNotes";
import type { PeriodComparison } from "./dashboard";

export interface RtlPlanDTO {
  id: string;
  habitCategory: string;
  targetScope: string;
  planContent: string;
  responsibleRole: UserRole;
  status: NoteStatus;
  comparisonFrom: number;
  comparisonTo: number;
  comparison: PeriodComparison;
  createdAt: string;
  updatedAt: string;
  author: {
    name: string;
    role: UserRole;
  };
}

export interface RtlPlanDraft {
  habitCategory: string;
  targetScope: string;
  planContent: string;
  responsibleRole: UserRole;
  comparisonFrom: number;
  comparisonTo: number;
  kelas: string;
  jenisKelamin: string;
}
