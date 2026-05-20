-- Add interview mode column to Session: 'standard' | 'guided'
ALTER TABLE "Session" ADD COLUMN "mode" TEXT NOT NULL DEFAULT 'standard';
