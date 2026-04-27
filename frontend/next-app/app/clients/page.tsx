import ClientsPageView from "@/app/src/modules/client/components/ClientsPageView";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  const params = await searchParams;

  if (!token) {
    redirect("/login");
  }

  return <ClientsPageView initialQuery={params.search ?? ""} />;
}
