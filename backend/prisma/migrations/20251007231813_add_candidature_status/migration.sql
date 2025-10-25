-- CreateEnum
CREATE TYPE "CandidatureStatus" AS ENUM ('NON_POSTULE', 'EN_ATTENTE', 'ACCEPTE', 'REFUSE');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "candidatureStatus" "CandidatureStatus" NOT NULL DEFAULT 'NON_POSTULE';
