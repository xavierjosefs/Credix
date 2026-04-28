import LoginPageView from "@/app/src/modules/auth/components/LoginPageView";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function LoginPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (token) {
    redirect("/home");
  }

  return <LoginPageView />;
}
