import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import DashboardView from "@/app/src/modules/dashboard/components/DashboardView";

export default async function HomePage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) {
    redirect("/login");
  }

  return <DashboardView />;
}
