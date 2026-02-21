"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import { useAppContext } from "@/context/AppContext";
import { LandingScreen } from "@/components/landing/LandingScreen";
import { SessionScreen } from "@/components/session/SessionScreen";

export default function Home() {
    const router = useRouter();
    const { state } = useAppContext();

    useEffect(() => {
        if (!state.userProfile) {
            router.push("/login");
        }
    }, [state.userProfile, router]);

    if (!state.userProfile) return null;

    return (
        <main className="relative min-h-screen overflow-hidden bg-hero-gradient">
            <AnimatePresence mode="wait">
                {state.phase === "landing" || state.phase === "transitioning" ? (
                    <LandingScreen key="landing" />
                ) : (
                    <SessionScreen key="session" />
                )}
            </AnimatePresence>
        </main>
    );
}
