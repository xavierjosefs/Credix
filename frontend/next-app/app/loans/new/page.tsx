import NewLoanPageView from "@/app/src/modules/loan/components/NewLoanPageView";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function NewLoanPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) {
    redirect("/login");
  }

  return <NewLoanPageView />;
}
