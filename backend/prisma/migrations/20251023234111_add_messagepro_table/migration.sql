-- CreateTable
CREATE TABLE "MessagePro" (
    "id" SERIAL NOT NULL,
    "senderId" INTEGER NOT NULL,
    "receiverId" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "seen" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "MessagePro_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MessagePro_senderId_receiverId_idx" ON "MessagePro"("senderId", "receiverId");

-- AddForeignKey
ALTER TABLE "MessagePro" ADD CONSTRAINT "MessagePro_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessagePro" ADD CONSTRAINT "MessagePro_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
