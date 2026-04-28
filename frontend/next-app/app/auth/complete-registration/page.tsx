import CompleteRegistrationPageView from "@/app/src/modules/auth/components/CompleteRegistrationPageView";

export default async function CompleteRegistrationPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const params = await searchParams;

  return <CompleteRegistrationPageView token={params.token ?? ""} />;
}
