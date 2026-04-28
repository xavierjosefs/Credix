import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginService } from "../services/auth.service";
import { saveSession } from "../services/session.service";

export function useLogin() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const login = async (data: { email: string; password: string }) => {
    try {
      setLoading(true);
      const res = await loginService(data);
      saveSession(res.data);

      console.log("Login success:", res);
      router.push("/home");

    } catch (error) {
      console.error("Login error", error);
      alert("Credenciales incorrectas");
    } finally {
      setLoading(false);
    }
  };

  return { login, loading };
}
