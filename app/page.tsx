"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppContext } from "@/context/AppContext";
import { LandingScreen } from "@/components/landing/LandingScreen";

export default function Home() {
    const router = useRouter();
    const { state } = useAppContext();

    useEffect(() => {
        if (!state.userProfile) {
            router.push("/login");
        }
    }, [state.userProfile, router]);

    if (!state.userProfile) return null;

    return <LandingScreen />;
}
