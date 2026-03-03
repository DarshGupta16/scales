-- CreateTable
CREATE TABLE "SyncLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "timestamp" BIGINT NOT NULL,
    "operation" TEXT NOT NULL,
    "payload" TEXT NOT NULL
);

-- CreateIndex
CREATE INDEX "SyncLog_timestamp_idx" ON "SyncLog"("timestamp");
