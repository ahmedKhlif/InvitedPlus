-- CreateTable
CREATE TABLE "private_message_reactions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "messageId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "private_message_reactions_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "private_messages" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "private_message_reactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "private_message_reactions_messageId_userId_emoji_key" ON "private_message_reactions"("messageId", "userId", "emoji");
