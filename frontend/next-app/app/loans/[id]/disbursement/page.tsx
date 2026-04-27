import LoanDisbursementReceiptPageView from "@/app/src/modules/loan/components/LoanDisbursementReceiptPageView";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function LoanDisbursementReceiptPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    amount?: string;
    issuedAt?: string;
    method?: string;
    mode?: string;
    newBalance?: string;
    previousBalance?: string;
  }>;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) {
    redirect("/login");
  }

  const { id } = await params;
  const { amount, issuedAt, method, mode, newBalance, previousBalance } = await searchParams;

  return (
    <LoanDisbursementReceiptPageView
      loanId={id}
      mode={mode}
      amount={amount}
      method={method}
      issuedAt={issuedAt}
      previousBalance={previousBalance}
      newBalance={newBalance}
    />
  );
}
