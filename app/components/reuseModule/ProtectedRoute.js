"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/app/lib/firebase";

export default function ProtectedRoute({ children }) {
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        router.push("/");
      }
    });

    return () => unsubscribe();
  }, [router]);

  return children;
}
