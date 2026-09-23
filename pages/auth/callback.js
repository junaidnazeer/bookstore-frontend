import { useEffect } from "react";
import { useRouter } from "next/router";

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    if (!router.isReady) return;

    const { token } = router.query;

    if (token) {
      window.localStorage.setItem("token", token);
      router.push("/");
    } else {
      router.push("/login");
    }
  }, [router.isReady, router.query, router]);

  return <p className="p-8 text-center text-neutral-500">Signing you in...</p>;
}
