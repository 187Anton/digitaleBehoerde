CREATE TABLE "application_comments" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "author_id" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "application_comments_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "application_comments_application_id_created_at_idx"
ON "application_comments"("application_id", "created_at");

CREATE INDEX "application_comments_author_id_idx"
ON "application_comments"("author_id");

ALTER TABLE "application_comments"
ADD CONSTRAINT "application_comments_application_id_fkey"
FOREIGN KEY ("application_id") REFERENCES "applications"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "application_comments"
ADD CONSTRAINT "application_comments_author_id_fkey"
FOREIGN KEY ("author_id") REFERENCES "users"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
