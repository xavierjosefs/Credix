import LoansPageView from "@/app/src/modules/loan/components/LoansPageView";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function LoansPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) {
    redirect("/login");
  }

  return <LoansPageView />;
}
