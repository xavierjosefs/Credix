import CashPageView from "@/app/src/modules/cash/components/CashPageView";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function CashPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) {
    redirect("/login");
  }

  return <CashPageView />;
}
