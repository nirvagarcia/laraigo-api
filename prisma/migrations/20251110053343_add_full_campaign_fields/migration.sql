/*
  Warnings:

  - You are about to drop the column `name` on the `campaigns` table. All the data in the column will be lost.
  - Added the required column `channel` to the `campaigns` table without a default value. This is not possible if the table is not empty.
  - Added the required column `executionType` to the `campaigns` table without a default value. This is not possible if the table is not empty.
  - Added the required column `group` to the `campaigns` table without a default value. This is not possible if the table is not empty.
  - Added the required column `messageType` to the `campaigns` table without a default value. This is not possible if the table is not empty.
  - Added the required column `source` to the `campaigns` table without a default value. This is not possible if the table is not empty.
  - Added the required column `template` to the `campaigns` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `campaigns` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_campaigns" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME,
    "source" TEXT NOT NULL,
    "executionType" TEXT NOT NULL,
    "scheduledDate" DATETIME,
    "scheduledTime" TEXT,
    "group" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "messageType" TEXT NOT NULL,
    "template" TEXT NOT NULL,
    "persons" JSONB,
    "filePath" TEXT,
    "status" TEXT DEFAULT 'draft',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_campaigns" ("createdAt", "description", "endDate", "id", "persons", "startDate", "status", "updatedAt") SELECT "createdAt", "description", "endDate", "id", "persons", "startDate", "status", "updatedAt" FROM "campaigns";
DROP TABLE "campaigns";
ALTER TABLE "new_campaigns" RENAME TO "campaigns";
CREATE INDEX "campaigns_status_idx" ON "campaigns"("status");
CREATE INDEX "campaigns_startDate_idx" ON "campaigns"("startDate");
CREATE INDEX "campaigns_source_idx" ON "campaigns"("source");
CREATE INDEX "campaigns_channel_idx" ON "campaigns"("channel");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
