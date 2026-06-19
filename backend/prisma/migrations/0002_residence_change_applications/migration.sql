-- CreateEnum
CREATE TYPE "ApplicationType" AS ENUM ('RESIDENCE_CHANGE');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('SUBMITTED', 'IN_REVIEW', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "applications" (
    "id" TEXT NOT NULL,
    "type" "ApplicationType" NOT NULL,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'SUBMITTED',
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "residence_changes" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "move_date" DATE NOT NULL,
    "old_street" TEXT NOT NULL,
    "old_postal_code" TEXT NOT NULL,
    "old_city" TEXT NOT NULL,
    "new_street" TEXT NOT NULL,
    "new_postal_code" TEXT NOT NULL,
    "new_city" TEXT NOT NULL,
    "household_size" INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT "residence_changes_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "applications_user_id_created_at_idx" ON "applications"("user_id", "created_at");
CREATE UNIQUE INDEX "residence_changes_application_id_key" ON "residence_changes"("application_id");

ALTER TABLE "applications" ADD CONSTRAINT "applications_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "residence_changes" ADD CONSTRAINT "residence_changes_application_id_fkey"
FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;
