-- CreateTable
CREATE TABLE "TrackingPoint" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "frame" INTEGER NOT NULL,
    "x" REAL NOT NULL,
    "y" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "videoId" TEXT NOT NULL,
    CONSTRAINT "TrackingPoint_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "Video" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "TrackingPoint_videoId_idx" ON "TrackingPoint"("videoId");

-- CreateIndex
CREATE INDEX "TrackingPoint_videoId_frame_idx" ON "TrackingPoint"("videoId", "frame");
