-- AlterTable
ALTER TABLE "invitations" ADD COLUMN "invitation_token_hash" TEXT,
ADD COLUMN "invitation_token_expires_at" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "invitations_invitation_token_hash_key" ON "invitations"("invitation_token_hash");

-- CreateIndex
CREATE INDEX "invitations_invitation_token_expires_at_idx" ON "invitations"("invitation_token_expires_at");
