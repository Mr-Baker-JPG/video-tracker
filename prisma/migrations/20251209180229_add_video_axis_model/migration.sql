-- CreateTable
CREATE TABLE "VideoAxis" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "videoId" TEXT NOT NULL,
    "originX" REAL NOT NULL,
    "originY" REAL NOT NULL,
    "rotationAngle" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "VideoAxis_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "Video" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "VideoAxis_videoId_key" ON "VideoAxis"("videoId");

-- CreateIndex
CREATE INDEX "VideoAxis_videoId_idx" ON "VideoAxis"("videoId");
