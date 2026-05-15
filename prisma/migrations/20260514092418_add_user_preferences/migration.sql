-- AlterTable
ALTER TABLE "users"
ADD COLUMN "email_notifications" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "locale" TEXT NOT NULL DEFAULT 'th',
ADD COLUMN "push_notifications" BOOLEAN NOT NULL DEFAULT true;