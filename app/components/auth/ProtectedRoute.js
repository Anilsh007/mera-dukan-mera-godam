"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/app/lib/firebase";

export default function ProtectedRoute({ children }) {
  const router = useRouter();
  const [authResolved, setAuthResolved] = useState(!auth);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    if (!auth) {
      setAuthResolved(true);
      setIsAuthenticated(false);
      router.push("/");
      return;
    }

    const unsubscribe = auth.onAuthStateChanged((user) => {
      setIsAuthenticated(Boolean(user));
      setAuthResolved(true);

      if (!user) {
        router.push("/");
      }
    });

    return () => unsubscribe();
  }, [router]);

  if (!authResolved) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return children;
}
