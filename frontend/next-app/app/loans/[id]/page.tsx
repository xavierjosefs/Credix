import LoanDetailPageView from "@/app/src/modules/loan/components/LoanDetailPageView";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function LoanDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) {
    redirect("/login");
  }

  const { id } = await params;

  return <LoanDetailPageView loanId={id} />;
}
