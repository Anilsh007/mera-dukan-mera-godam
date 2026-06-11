"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { FcGoogle } from "react-icons/fc";
import Button from "@/app/components/ui/Button";
import { supabase, isSupabaseConfigured } from "@/app/lib/supabase";
import { auth } from "@/app/lib/firebase";
import { notify as toast } from "@/app/lib/notifications";
import { en } from "@/app/messages/en";
import logo from "../../../assets/logo.webp";

export default function Login() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [authBootstrapping, setAuthBootstrapping] = useState(true);

  useEffect(() => {
    if (!auth) {
      setAuthBootstrapping(false);
      return;
    }

    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        router.replace("/dashboard");
        return;
      }

      setAuthBootstrapping(false);
    });

    return () => unsubscribe();
  }, [router]);

  const handleLogin = async () => {
    if (loading || authBootstrapping) return;

    if (!isSupabaseConfigured) {
      toast.error(en.auth.loginNotConfigured);
      return;
    }

    try {
      setLoading(true);

      if (typeof window === "undefined") {
        throw new Error(en.auth.loginFailed);
      }

      const redirectTo = `${window.location.origin}/dashboard`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          queryParams: {
            prompt: "select_account",
          },
        },
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error("Supabase Google login failed:", error);
      toast.error(error instanceof Error ? error.message : en.auth.loginFailed);
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-[#061411] px-4 py-6 sm:px-6 sm:py-8">
      <div aria-hidden="true" className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute left-1/2 top-1/2 h-[min(520px,92vw)] w-[min(520px,92vw)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-400/20 blur-3xl" />
        <div className="absolute right-[-10%] top-[-10%] h-[min(420px,80vw)] w-[min(420px,80vw)] rounded-full bg-teal-300/10 blur-3xl" />
        <div className="absolute bottom-[-12%] left-[-8%] h-[min(420px,80vw)] w-[min(420px,80vw)] rounded-full bg-lime-300/10 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.18),transparent_58%),linear-gradient(135deg,rgba(255,255,255,0.05),transparent_38%)]" />
      </div>

      <div className="relative z-10 flex w-full max-w-[420px] flex-col items-center gap-6 rounded-[32px] border border-white/10 bg-white/8 p-6 shadow-2xl backdrop-blur-3xl sm:gap-8 sm:p-10">
        <Image src={logo} alt={en.profile.logoAlt} width={64} height={64} priority />

        <div className="text-center">
          <h1 className="text-2xl font-bold text-white sm:text-3xl">{en.auth.title}</h1>
          <p className="text-[11px] uppercase tracking-[0.3em] text-emerald-600 sm:text-xs">{en.auth.eyebrow}</p>
          <p className="mt-3 text-sm leading-6 text-white/75">{en.auth.description}</p>
        </div>

        {!isSupabaseConfigured && (
          <div className="w-full rounded-2xl border border-amber-400/30 bg-amber-500/10 p-3 text-center text-xs leading-5 text-amber-100">
            {en.auth.loginNotConfigured}
          </div>
        )}

        <div className="w-full">
          <Button
            onClick={handleLogin}
            disabled={!isSupabaseConfigured || loading || authBootstrapping}
            loading={loading || authBootstrapping}
            variant="login"
            icon={<FcGoogle />}
            title={en.auth.continueWithGoogle}
            className="w-full justify-center"
          />
        </div>

        <div className="grid w-full grid-cols-1 gap-2 text-center text-xs text-white/65">
          {en.auth.keywords.map((item) => (
            <p key={item}>{item}</p>
          ))}
        </div>

        <p className="text-center text-[10px] uppercase tracking-[0.25em] text-white/40">{en.auth.footer}</p>
      </div>
    </div>
  );
}
