import ClientCollectionReportPageView from "@/app/src/modules/client/components/ClientCollectionReportPageView";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function ClientCollectionReportPage({
  searchParams,
}: {
  searchParams: Promise<{
    frequency?: string;
    collectionMethod?: string;
    institution?: string;
  }>;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  const params = await searchParams;

  if (!token) {
    redirect("/login");
  }

  return <ClientCollectionReportPageView initialParams={params} />;
}
