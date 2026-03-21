/*
  Warnings:

  - A unique constraint covering the columns `[username]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "AiDestinationCache" ADD COLUMN     "explorePlaces" JSONB;

-- AlterTable
ALTER TABLE "Trip" ADD COLUMN     "aiCustomPrompt" TEXT,
ADD COLUMN     "aiItinerary" JSONB,
ADD COLUMN     "aiPackingList" JSONB,
ADD COLUMN     "aiTravelTips" JSONB,
ADD COLUMN     "explorePlaces" JSONB,
ADD COLUMN     "mapPins" JSONB,
ADD COLUMN     "weatherCache" JSONB;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "username" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
