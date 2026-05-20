ALTER TABLE "Client"
ADD COLUMN IF NOT EXISTS "clientNumber" TEXT,
ADD COLUMN IF NOT EXISTS "devicePhone" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "Client_clientNumber_key" ON "Client"("clientNumber");
