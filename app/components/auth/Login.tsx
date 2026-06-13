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
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden isolate overflow-hidden bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-[-14rem] top-[-16rem] h-[34rem] w-[34rem] rounded-full bg-[var(--accent-soft)] blur-3xl" />
        <div className="absolute right-[-12rem] top-24 h-[30rem] w-[30rem] rounded-full bg-[var(--surface-soft-strong)] blur-3xl" />
        <div className="absolute inset-x-0 top-0 h-40 bg-[linear-gradient(180deg,var(--surface-highlight),transparent)]" />
      </div>

      <div className="relative z-10 flex w-full max-w-[420px] flex-col items-center gap-6 rounded-[32px] border border-white/10 bg-white/8 p-6 shadow-2xl backdrop-blur-3xl sm:gap-8 sm:p-10">
        <Image src={logo} alt={en.profile.logoAlt} width={64} height={64} priority />

        <div className="text-center text-[var(--text-primary)]">
          <h1 className="text-2xl font-bold sm:text-3xl">{en.auth.title}</h1>
          <p className="text-[11px] uppercase tracking-[0.3em] text-emerald-600 sm:text-xs">{en.auth.eyebrow}</p>
          <p className="mt-3 text-sm leading-6 /75">{en.auth.description}</p>
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

        <div className="grid w-full grid-cols-1 gap-2 text-center text-xs /65">
          {en.auth.keywords.map((item) => (
            <p key={item}>{item}</p>
          ))}
        </div>

        <p className="text-center text-[10px] uppercase tracking-[0.25em] /40">{en.auth.footer}</p>
      </div>
    </div>
  );
}
