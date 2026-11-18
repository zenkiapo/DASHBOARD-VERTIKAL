CREATE SCHEMA IF NOT EXISTS "public";

CREATE TYPE "Role" AS ENUM ('KEPSEK', 'GURU_BK', 'WALI_KELAS', 'ADMIN');
CREATE TYPE "NoteStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED');

CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "assignedClass" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PolicyNote" (
    "id" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "habitCategory" TEXT NOT NULL,
    "targetScope" TEXT NOT NULL,
    "noteContent" TEXT NOT NULL,
    "followUpNote" TEXT,
    "status" "NoteStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PolicyNote_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE INDEX "PolicyNote_targetScope_createdAt_idx" ON "PolicyNote"("targetScope", "createdAt");
CREATE INDEX "PolicyNote_authorId_idx" ON "PolicyNote"("authorId");

ALTER TABLE "PolicyNote"
ADD CONSTRAINT "PolicyNote_authorId_fkey"
FOREIGN KEY ("authorId") REFERENCES "User"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
