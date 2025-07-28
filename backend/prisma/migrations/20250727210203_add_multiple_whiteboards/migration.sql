-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_whiteboards" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventId" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'Whiteboard',
    "data" JSONB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "whiteboards_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_whiteboards" ("createdAt", "data", "eventId", "id", "updatedAt") SELECT "createdAt", "data", "eventId", "id", "updatedAt" FROM "whiteboards";
DROP TABLE "whiteboards";
ALTER TABLE "new_whiteboards" RENAME TO "whiteboards";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
