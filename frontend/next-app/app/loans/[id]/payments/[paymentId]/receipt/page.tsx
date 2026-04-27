import PaymentReceiptPageView from "@/app/src/modules/loan/components/PaymentReceiptPageView";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function PaymentReceiptPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; paymentId: string }>;
  searchParams: Promise<{ method?: string }>;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) {
    redirect("/login");
  }

  const { id, paymentId } = await params;
  const { method } = await searchParams;

  return <PaymentReceiptPageView loanId={id} paymentId={paymentId} paymentMethod={method} />;
}
