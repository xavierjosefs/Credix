import NewClientPageView from "@/app/src/modules/client/components/NewClientPageView";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function NewClientPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) {
    redirect("/login");
  }

  return <NewClientPageView />;
}
