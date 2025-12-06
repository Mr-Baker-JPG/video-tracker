/*
  Warnings:

  - Added the required column `trackingObjectId` to the `TrackingPoint` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_TrackingPoint" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "frame" INTEGER NOT NULL,
    "x" REAL NOT NULL,
    "y" REAL NOT NULL,
    "trackingObjectId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "videoId" TEXT NOT NULL,
    CONSTRAINT "TrackingPoint_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "Video" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
-- Assign unique trackingObjectId to each existing point (using the point's own ID)
INSERT INTO "new_TrackingPoint" ("createdAt", "frame", "id", "videoId", "x", "y", "trackingObjectId") 
SELECT "createdAt", "frame", "id", "videoId", "x", "y", "id" FROM "TrackingPoint";
DROP TABLE "TrackingPoint";
ALTER TABLE "new_TrackingPoint" RENAME TO "TrackingPoint";
CREATE INDEX "TrackingPoint_videoId_idx" ON "TrackingPoint"("videoId");
CREATE INDEX "TrackingPoint_videoId_frame_idx" ON "TrackingPoint"("videoId", "frame");
CREATE INDEX "TrackingPoint_videoId_trackingObjectId_idx" ON "TrackingPoint"("videoId", "trackingObjectId");
CREATE INDEX "TrackingPoint_videoId_trackingObjectId_frame_idx" ON "TrackingPoint"("videoId", "trackingObjectId", "frame");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
