/*
  Warnings:

  - You are about to drop the column `seen` on the `Notification` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Notification` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."Notification" DROP CONSTRAINT "Notification_userId_fkey";

-- AlterTable
ALTER TABLE "Notification" DROP COLUMN "seen",
DROP COLUMN "userId",
ADD COLUMN     "role" "Role";

-- CreateTable
CREATE TABLE "NotificationRecipient" (
    "id" SERIAL NOT NULL,
    "notificationId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "seen" BOOLEAN NOT NULL DEFAULT false,
    "seenAt" TIMESTAMP(3),

    CONSTRAINT "NotificationRecipient_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "NotificationRecipient" ADD CONSTRAINT "NotificationRecipient_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "Notification"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationRecipient" ADD CONSTRAINT "NotificationRecipient_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
