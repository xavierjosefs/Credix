"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardView from "@/app/src/modules/dashboard/components/DashboardView";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      router.push("/login");
    }
  }, [router]);

  return <DashboardView />;
}