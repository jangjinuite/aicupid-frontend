"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAppContext } from "@/context/AppContext";
import { PersonaCarousel } from "./PersonaCarousel";
import { PERSONAS } from "@/lib/mockData";

export function LandingScreen() {
    const router = useRouter();
    const { state, dispatch } = useAppContext();

    const handleStartSession = () => {
        if (state.phase === "transitioning") return;
        dispatch({ type: "START_TRANSITION" });
        setTimeout(() => {
            dispatch({ type: "SESSION_READY" });
            router.push("/session");
        }, 300);
    };

    return (
        <motion.div
            className="flex flex-col items-center justify-center min-h-screen px-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
        >
            <PersonaCarousel
                personas={PERSONAS}
                selectedId={state.sessionSettings.selectedPersonaId}
                onSelect={(id) => dispatch({ type: "SET_PERSONA", payload: id })}
                onStart={handleStartSession}
            />
        </motion.div>
    );
}
