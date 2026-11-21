CREATE TABLE "RtlPlan" (
    "id" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "habitCategory" TEXT NOT NULL,
    "targetScope" TEXT NOT NULL,
    "planContent" TEXT NOT NULL,
    "responsibleRole" "Role" NOT NULL,
    "status" "NoteStatus" NOT NULL DEFAULT 'PENDING',
    "comparisonFrom" INTEGER NOT NULL,
    "comparisonTo" INTEGER NOT NULL,
    "comparisonSummary" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RtlPlan_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "RtlPlan_targetScope_createdAt_idx" ON "RtlPlan"("targetScope", "createdAt");
CREATE INDEX "RtlPlan_responsibleRole_status_idx" ON "RtlPlan"("responsibleRole", "status");
CREATE INDEX "RtlPlan_authorId_idx" ON "RtlPlan"("authorId");

ALTER TABLE "RtlPlan" ADD CONSTRAINT "RtlPlan_authorId_fkey"
    FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
