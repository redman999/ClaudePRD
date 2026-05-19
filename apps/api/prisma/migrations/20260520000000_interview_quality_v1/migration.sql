-- AlterTable Project: add template
ALTER TABLE "Project" ADD COLUMN "template" TEXT NOT NULL DEFAULT 'standard';

-- AlterTable Session: add coveredAreas
ALTER TABLE "Session" ADD COLUMN "coveredAreas" JSONB NOT NULL DEFAULT '{}';

-- CreateTable PrdVersion
CREATE TABLE "PrdVersion" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "markdown" TEXT NOT NULL,
    "ralphJson" TEXT NOT NULL,
    "triggeringSessionId" TEXT,
    "synthesisSkipped" BOOLEAN NOT NULL DEFAULT false,
    "skipReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PrdVersion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PrdVersion_projectId_version_key" ON "PrdVersion"("projectId", "version");
CREATE INDEX "PrdVersion_projectId_createdAt_idx" ON "PrdVersion"("projectId", "createdAt");

-- AddForeignKey
ALTER TABLE "PrdVersion" ADD CONSTRAINT "PrdVersion_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PrdVersion" ADD CONSTRAINT "PrdVersion_triggeringSessionId_fkey" FOREIGN KEY ("triggeringSessionId") REFERENCES "Session"("id") ON DELETE SET NULL ON UPDATE CASCADE;
