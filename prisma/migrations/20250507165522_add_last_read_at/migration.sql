/*
  Warnings:

  - You are about to drop the `_UserChats` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_UserChats" DROP CONSTRAINT "_UserChats_A_fkey";

-- DropForeignKey
ALTER TABLE "_UserChats" DROP CONSTRAINT "_UserChats_B_fkey";

-- DropTable
DROP TABLE "_UserChats";

-- CreateTable
CREATE TABLE "ChatUser" (
    "chatId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lastReadAt" TIMESTAMP(3),

    CONSTRAINT "ChatUser_pkey" PRIMARY KEY ("chatId","userId")
);

-- AddForeignKey
ALTER TABLE "ChatUser" ADD CONSTRAINT "ChatUser_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "Chat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatUser" ADD CONSTRAINT "ChatUser_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
