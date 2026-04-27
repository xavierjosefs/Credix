import LoginForm from "@/app/src/modules/auth/components/LoginForm";
import Link from "next/link";

export default function LoginPageView() {
  return (
    <main className="theme-auth relative min-h-screen overflow-hidden bg-[#f8f9fb]">
      <div className="absolute inset-y-0 right-[-10%] hidden w-[42%] -skew-x-[7deg] bg-[#eef1f5] md:block" />

      <div className="relative z-10 flex min-h-screen flex-col px-6 py-8 sm:px-8 lg:px-10">
        <div className="flex flex-1 items-center justify-center">
          <LoginForm />
        </div>

        <footer className="flex flex-col gap-4 text-[10px] font-semibold uppercase tracking-[0.24em] text-[#94a0b3] sm:flex-row sm:items-center sm:justify-between">
          <p>Copyright 2024 Inversiones Fernandez. Todos los derechos reservados.</p>
          <div className="flex flex-wrap gap-4 sm:gap-6">
            <Link href="#" className="transition hover:text-[#6f7e95]">
              Privacy Policy
            </Link>
            <Link href="#" className="transition hover:text-[#6f7e95]">
              Terms of Service
            </Link>
            <Link href="#" className="transition hover:text-[#6f7e95]">
              Security Standards
            </Link>
          </div>
        </footer>
      </div>
    </main>
  );
}
