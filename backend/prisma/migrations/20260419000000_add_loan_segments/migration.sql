-- CreateTable
CREATE TABLE "LoanSegment" (
    "id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "loanId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoanSegment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LoanSegment_loanId_idx" ON "LoanSegment"("loanId");

-- AddForeignKey
ALTER TABLE "LoanSegment" ADD CONSTRAINT "LoanSegment_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "Loan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
