"use client";

import { onAuthStateChanged, signInWithPopup, signInWithRedirect } from "firebase/auth";
import { auth, provider } from "@/app/lib/firebase";
import { useRouter } from "next/navigation";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshDistortMaterial, Sphere } from "@react-three/drei";
import { FcGoogle } from "react-icons/fc";
import { useEffect, useRef, useState } from "react";
import logo from "../../../assets/logo.svg";
import Button from "../utility/Button";
import { toast } from "sonner";

const AnimatedBackground = () => {
  const meshRef = useRef<{ color: { setHSL: (h: number, s: number, l: number) => void } } | null>(null);

  useFrame((state) => {
    if (meshRef.current) {
      const time = state.clock.getElapsedTime();
      const hue = Math.sin(time * 0.3) * 0.05 + 0.45;
      meshRef.current.color.setHSL(hue, 0.7, 0.5);
    }
  });

  return (
    <Float speed={2} rotationIntensity={2} floatIntensity={2}>
      <Sphere args={[1, 64, 64]} scale={2.5}>
        <MeshDistortMaterial ref={meshRef} distort={0.5} speed={2} roughness={0.1} metalness={0.2} />
      </Sphere>
    </Float>
  );
};

export default function Login() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    return onAuthStateChanged(auth, (user) => {
      if (user) {
        router.replace("/dashboard");
      }
    });
  }, [router]);

  const handleLogin = async () => {
    try {
      setLoading(true);
      const shouldUseRedirect =
        typeof window !== "undefined" &&
        (window.innerWidth < 768 ||
          /Android|iPhone|iPad|iPod|Mobile/i.test(window.navigator.userAgent));

      if (shouldUseRedirect) {
        await signInWithRedirect(auth, provider);
        return;
      }

      await signInWithPopup(auth, provider);
      router.push("/dashboard");
    } catch (error: any) {
      const code = error?.code || "";

      if (
        code === "auth/popup-blocked" ||
        code === "auth/popup-closed-by-user" ||
        code === "auth/cancelled-popup-request"
      ) {
        toast.message("Popup issue detect hua, redirect login try ho raha hai...");

        try {
          await signInWithRedirect(auth, provider);
          return;
        } catch (redirectError) {
          console.error("Redirect login failed:", redirectError);
        }
      }

      if (code === "auth/unauthorized-domain") {
        toast.error("Ye domain Firebase auth me authorized nahi hai");
      } else {
        toast.error("Login complete nahi ho paya. Please try again.");
      }

      console.error("Login failed:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-[#0a0f0d] px-4 py-6 sm:px-6 sm:py-8">
      <div className="absolute inset-0 z-0">
        <Canvas camera={{ position: [0, 0, 5] }}>
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} intensity={1} />
          <AnimatedBackground />
        </Canvas>
      </div>

      <div className="relative z-10 flex w-full max-w-[420px] flex-col items-center gap-6 rounded-[32px] border border-white/10 bg-white/6 p-6 shadow-2xl backdrop-blur-3xl sm:gap-8 sm:p-10">
        <img src={logo.src} alt="Logo" className="h-14 w-14 sm:h-16 sm:w-16" />

        <div className="text-center">
          <h1 className="text-2xl font-bold text-white sm:text-3xl">Inventory Management & GST Billing for Indian Shops</h1>
          <p className="text-[11px] uppercase tracking-[0.3em] text-emerald-400 sm:text-xs">Secure Access</p>
          <p className="mt-3 text-sm leading-6 text-white/75">
            Track stock, manage products, monitor sales, handle expiry alerts and create GST invoices from one inventory dashboard.
          </p>
        </div>

        <div className="w-full">
          <Button onClick={handleLogin} loading={loading} variant="login" icon={<FcGoogle />} title="Continue with Google" className="w-full justify-center" />
        </div>

        <div className="grid w-full grid-cols-1 gap-2 text-center text-xs text-white/65">
          <p>Inventory management app</p>
          <p>Stock tracking software</p>
          <p>GST invoice and billing support</p>
          <p>Retail, wholesale and warehouse ready</p>
        </div>

        <p className="text-center text-[10px] uppercase tracking-[0.25em] text-white/40">
          Powered by Firebase
        </p>
      </div>
    </div>
  );
}
