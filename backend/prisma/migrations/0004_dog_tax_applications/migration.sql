-- AlterEnum
ALTER TYPE "ApplicationType" ADD VALUE 'DOG_TAX';

-- CreateTable
CREATE TABLE "dog_taxes" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "dog_name" TEXT NOT NULL,
    "dog_breed" TEXT,
    "dog_birth_date" DATE,
    "chip_number" TEXT,
    "owner_street" TEXT NOT NULL,
    "owner_postal_code" TEXT NOT NULL,
    "owner_city" TEXT NOT NULL,
    "tax_start_date" DATE NOT NULL,

    CONSTRAINT "dog_taxes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "dog_taxes_application_id_key" ON "dog_taxes"("application_id");

-- AddForeignKey
ALTER TABLE "dog_taxes" ADD CONSTRAINT "dog_taxes_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;
