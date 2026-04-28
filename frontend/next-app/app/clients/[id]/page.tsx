import ClientDetailPageView from "@/app/src/modules/client/components/ClientDetailPageView";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function ClientDetailPage({
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

  return <ClientDetailPageView clientId={id} />;
}
