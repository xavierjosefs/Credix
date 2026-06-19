-- CreateEnum
CREATE TYPE "CollectionMethod" AS ENUM ('CAJERO', 'DEPOSITO', 'EFECTIVO', 'TRANSFERENCIA');

-- AlterTable
ALTER TABLE "Client" ADD COLUMN "collectionMethod" "CollectionMethod";
