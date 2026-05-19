-- AlterTable
ALTER TABLE "users" ADD COLUMN "password_hash" VARCHAR(255);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");