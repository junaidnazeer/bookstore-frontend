import { useEffect } from "react";
import { useRouter } from "next/router";

export default function AdminIndex() {
  const router = useRouter();

  useEffect(() => {
    const role = window.localStorage.getItem("role");
    if (role === "ADMIN") {
      router.replace("/admin/dashboard");
    } else {
      router.replace("/admin/login");
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center text-neutral-400">
      Redirecting...
    </div>
  );
}
