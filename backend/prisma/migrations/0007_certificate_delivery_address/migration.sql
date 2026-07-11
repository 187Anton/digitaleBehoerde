ALTER TABLE "certificate_of_conducts"
ADD COLUMN "delivery_recipient" TEXT NOT NULL DEFAULT '',
ADD COLUMN "delivery_street" TEXT NOT NULL DEFAULT '',
ADD COLUMN "delivery_postal_code" TEXT NOT NULL DEFAULT '',
ADD COLUMN "delivery_city" TEXT NOT NULL DEFAULT '';

ALTER TABLE "certificate_of_conducts"
ALTER COLUMN "delivery_recipient" DROP DEFAULT,
ALTER COLUMN "delivery_street" DROP DEFAULT,
ALTER COLUMN "delivery_postal_code" DROP DEFAULT,
ALTER COLUMN "delivery_city" DROP DEFAULT;
