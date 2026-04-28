import AdminInvitePageView from "@/app/src/modules/auth/components/AdminInvitePageView";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function SettingsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) {
    redirect("/login");
  }

  return <AdminInvitePageView />;
}
