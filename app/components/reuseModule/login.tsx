"use client";

import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth, provider } from "@/app/lib/firebase";
import { useRouter } from "next/navigation";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshDistortMaterial, Sphere } from "@react-three/drei";
import { FcGoogle } from "react-icons/fc";
import { useRef } from "react";
import logo from "../../../assets/logo.svg";
import { syncToDrive } from "@/app/lib/drive.service";
import Button from "../utility/Button";

const AnimatedBackground = () => {
    const meshRef = useRef<any>(null);

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
                <MeshDistortMaterial
                    ref={meshRef}
                    distort={0.5}
                    speed={2}
                    roughness={0.1}
                    metalness={0.2}
                />
            </Sphere>
        </Float>
    );
};

export default function Login() {
    const router = useRouter();

    const handleLogin = async () => {
        try {
            const result = await signInWithPopup(auth, provider);

            const credential = GoogleAuthProvider.credentialFromResult(result);
            const token = credential?.accessToken;

            setInterval(() => {
                const token = localStorage.getItem("google_drive_token");
                if (token) {
                    syncToDrive(token);
                }
            }, 60000);

            router.push("/dashboard");
        } catch (error) {
            console.error("Login failed:", error);
        }
    };

    return (
        <div className="relative h-screen w-full bg-[#0a0f0d] flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 z-0">
                <Canvas camera={{ position: [0, 0, 5] }}>
                    <ambientLight intensity={0.5} />
                    <pointLight position={[10, 10, 10]} intensity={1} />
                    <AnimatedBackground />
                </Canvas>
            </div>

            <div className="relative z-10 p-10 bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[40px] shadow-xl flex flex-col items-center gap-8 w-[380px]">
                <img src={logo.src} alt="Logo" className="w-16 h-16" />

                <div className="text-center">
                    <h1 className="text-white text-3xl font-bold">Login</h1>
                    <p className="text-emerald-400 text-xs tracking-widest uppercase">
                        Secure Access
                    </p>
                </div>

                <Button onClick={handleLogin} variant="login" icon={<FcGoogle/>} title="Continue with Google" />

                <p className="text-white/40 text-[10px] uppercase tracking-widest">
                    Powered by Firebase
                </p>
            </div>
        </div>
    );
}