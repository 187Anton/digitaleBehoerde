-- AlterEnum
ALTER TYPE "ApplicationType" ADD VALUE 'CERTIFICATE_OF_CONDUCT';

-- CreateTable
CREATE TABLE "certificate_of_conducts" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "delivery_type" TEXT NOT NULL,

    CONSTRAINT "certificate_of_conducts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "certificate_of_conducts_application_id_key" ON "certificate_of_conducts"("application_id");

-- AddForeignKey
ALTER TABLE "certificate_of_conducts" ADD CONSTRAINT "certificate_of_conducts_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;
