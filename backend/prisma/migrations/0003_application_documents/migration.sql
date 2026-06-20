CREATE TABLE "documents" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "original_name" TEXT NOT NULL,
    "stored_name" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "documents_stored_name_key" ON "documents"("stored_name");
CREATE INDEX "documents_application_id_idx" ON "documents"("application_id");

ALTER TABLE "documents"
ADD CONSTRAINT "documents_application_id_fkey"
FOREIGN KEY ("application_id") REFERENCES "applications"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
