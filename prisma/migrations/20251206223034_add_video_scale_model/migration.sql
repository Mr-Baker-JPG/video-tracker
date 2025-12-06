-- CreateTable
CREATE TABLE "VideoScale" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "videoId" TEXT NOT NULL,
    "startX" REAL NOT NULL,
    "startY" REAL NOT NULL,
    "endX" REAL NOT NULL,
    "endY" REAL NOT NULL,
    "distanceMeters" REAL NOT NULL,
    "pixelsPerMeter" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "VideoScale_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "Video" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "VideoScale_videoId_key" ON "VideoScale"("videoId");

-- CreateIndex
CREATE INDEX "VideoScale_videoId_idx" ON "VideoScale"("videoId");
