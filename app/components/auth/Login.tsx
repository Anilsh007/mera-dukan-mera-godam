"use client";

import { getRedirectResult, onAuthStateChanged, signInWithPopup, signInWithRedirect } from "firebase/auth";
import { auth, authReady, firebaseErrorMessage, isFirebaseConfigured, provider } from "@/app/lib/firebase";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { FcGoogle } from "react-icons/fc";
import { useEffect, useState } from "react";
import logo from "../../../assets/logo.webp";
import Button from "@/app/components/ui/Button";
import { notify as toast } from "@/app/lib/notifications";
import { en } from "@/app/messages/en";

export default function Login() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [authBootstrapping, setAuthBootstrapping] = useState(Boolean(auth));

  useEffect(() => {
    if (!auth) return;

    let isMounted = true;

    authReady
      .then(async () => {
        try {
          await getRedirectResult(auth);
        } catch (error: unknown) {
          const code =
            typeof error === "object" && error && "code" in error && typeof error.code === "string"
              ? error.code
              : "";

          if (code === "auth/unauthorized-domain") {
            toast.error(en.auth.unauthorizedDomain);
          } else if (code) {
            toast.error(en.auth.loginFailed);
          }
        } finally {
          if (isMounted) {
            setAuthBootstrapping(false);
          }
        }
      })
      .catch(() => {
        if (isMounted) {
          setAuthBootstrapping(false);
        }
      });

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.replace("/dashboard");
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [router]);

  const handleLogin = async () => {
    if (loading || authBootstrapping) return;

    if (!isFirebaseConfigured || !auth || !provider) {
      toast.error(firebaseErrorMessage || en.auth.loginNotConfigured);
      return;
    }

    try {
      setLoading(true);
      await authReady;

      await signInWithPopup(auth, provider);
      router.replace("/dashboard");
    } catch (error: unknown) {
      const code =
        typeof error === "object" && error && "code" in error && typeof error.code === "string"
          ? error.code
          : "";

      if (
        code === "auth/popup-blocked" ||
        code === "auth/popup-closed-by-user" ||
        code === "auth/cancelled-popup-request"
      ) {
        toast.message(en.auth.popupFallback);

        try {
          await authReady;
          await signInWithRedirect(auth, provider);
          return;
        } catch {
          toast.error(en.auth.redirectLoginFailed);
        }
      }

      if (code === "auth/unauthorized-domain") {
        toast.error(en.auth.unauthorizedDomain);
      } else if (code === "auth/invalid-api-key") {
        toast.error(en.auth.invalidApiKey);
      } else {
        toast.error(en.auth.loginFailed);
      }

    } finally {
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
        <Image src={logo} alt={en.profile.logoAlt} width={64} height={64} className="" priority />

        <div className="text-center">
          <h1 className="text-2xl font-bold text-white sm:text-3xl">{en.auth.title}</h1>
          <p className="text-[11px] uppercase tracking-[0.3em] text-emerald-600 sm:text-xs">{en.auth.eyebrow}</p>
          <p className="mt-3 text-sm leading-6 text-white/75">{en.auth.description}</p>
        </div>

        {!isFirebaseConfigured && (
          <div className="w-full rounded-2xl border border-amber-400/30 bg-amber-500/10 p-3 text-center text-xs leading-5 text-amber-100">
            {en.auth.firebaseNotConfigured}
          </div>
        )}

        <div className="w-full">
          <Button onClick={handleLogin} disabled={!isFirebaseConfigured || loading || authBootstrapping} loading={loading || authBootstrapping} variant="login" icon={<FcGoogle />} title={en.auth.continueWithGoogle} className="w-full justify-center" />
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
