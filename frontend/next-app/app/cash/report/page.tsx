import CashReportPageView from "@/app/src/modules/cash/components/CashReportPageView";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function CashReportPage({
  searchParams,
}: {
  searchParams: Promise<{
    mode?: string;
    day?: string;
    month?: string;
    year?: string;
    admin?: string;
    q?: string;
  }>;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) {
    redirect("/login");
  }

  const params = await searchParams;

  return <CashReportPageView initialParams={params} />;
}
