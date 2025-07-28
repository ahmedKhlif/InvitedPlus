-- CreateTable
CREATE TABLE "whiteboards" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventId" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "whiteboards_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "whiteboard_elements" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "whiteboardId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "whiteboard_elements_whiteboardId_fkey" FOREIGN KEY ("whiteboardId") REFERENCES "whiteboards" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "whiteboard_elements_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "whiteboards_eventId_key" ON "whiteboards"("eventId");
