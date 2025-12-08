-- CreateTable
CREATE TABLE "TrackingObject" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "color" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "videoId" TEXT NOT NULL,
    CONSTRAINT "TrackingObject_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "Video" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "TrackingObject_videoId_idx" ON "TrackingObject"("videoId");

-- CreateIndex
CREATE UNIQUE INDEX "TrackingObject_videoId_id_key" ON "TrackingObject"("videoId", "id");

-- Create TrackingObject entries for all existing unique trackingObjectIds
-- This ensures backward compatibility with existing tracking points
INSERT INTO "TrackingObject" ("id", "videoId", "createdAt", "updatedAt")
SELECT DISTINCT "trackingObjectId", "videoId", MIN("createdAt"), MIN("createdAt")
FROM "TrackingPoint"
GROUP BY "trackingObjectId", "videoId";
