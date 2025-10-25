-- AlterTable
ALTER TABLE "User" ADD COLUMN     "assignedAgentId" INTEGER;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_assignedAgentId_fkey" FOREIGN KEY ("assignedAgentId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
