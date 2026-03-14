-- CreateTable
CREATE TABLE "AiDestinationCache" (
    "id" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "overview" JSONB,
    "highlights" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiDestinationCache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AiDestinationCache_destination_key" ON "AiDestinationCache"("destination");
