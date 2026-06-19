ALTER TABLE "Client"
ADD COLUMN IF NOT EXISTS "clientNumber" TEXT;

ALTER TABLE "Client"
ADD COLUMN IF NOT EXISTS "devicePhone" TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'CollectionMethod'
  ) THEN
    CREATE TYPE "CollectionMethod" AS ENUM ('CAJERO', 'DEPOSITO', 'EFECTIVO', 'TRANSFERENCIA');
  END IF;
END
$$;

ALTER TABLE "Client"
ADD COLUMN IF NOT EXISTS "collectionMethod" "CollectionMethod";

CREATE UNIQUE INDEX IF NOT EXISTS "Client_clientNumber_key"
ON "Client"("clientNumber");
