"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { User } from "lucide-react";
import { useAppContext } from "@/context/AppContext";
import { PersonaCarousel } from "./PersonaCarousel";
import { ProfileEditModal } from "@/components/profile/ProfileEditModal";
import { PERSONAS } from "@/lib/mockData";

export function LandingScreen() {
    const router = useRouter();
    const { state, dispatch } = useAppContext();
    const [showEditModal, setShowEditModal] = useState(false);

    const handleStart = () => {
        if (state.phase === "transitioning") return;
        dispatch({ type: "START_TRANSITION" });
        setTimeout(() => {
            dispatch({ type: "SESSION_READY" });
        }, 300);
    };

    return (
        <motion.div
            className="absolute inset-0 flex flex-col bg-white dark:bg-dark-bg overflow-auto mx-auto w-full z-10"
            style={{ maxWidth: 430 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
        >
            {/* Top branding */}
            <div className="shrink-0 relative pt-[clamp(3rem,8vh,5rem)] pb-[clamp(1.5rem,4vh,2.5rem)] text-center px-6">
                {/* My Page (Edit Profile) Button */}
                <motion.button
                    onClick={() => setShowEditModal(true)}
                    className="absolute top-8 right-6 flex items-center justify-center w-10 h-10 rounded-full bg-[#F6FAFA] text-[#0A4040] shadow-sm z-10"
                    style={{ border: "2px solid #86E3E3" }}
                    whileTap={{ scale: 0.92 }}
                >
                    <User className="w-5 h-5" />
                </motion.button>

                <div
                    className="inline-block px-4 py-1.5 rounded-full text-xs font-black tracking-widest uppercase mb-3"
                    style={{ backgroundColor: "#B8F0F0", color: "#0A4040" }}
                >
                    AI CUPID
                </div>
                <h1 className="font-black text-[clamp(1.6rem,6vw,2rem)] text-[#1A1A1A] dark:text-[#F0F0F0] tracking-tight leading-tight">
                    오늘의 큐피드를<br />만나보세요
                </h1>
                <p className="text-sm text-[#1A1A1A]/45 dark:text-white/35 mt-1.5">
                    AI가 여러분의 파티를 진행합니다
                </p>
            </div>

            {/* Persona carousel — fills remaining space, centered */}
            <div className="flex-1 flex items-center justify-center px-6 py-4">
                <div className="w-full" style={{ maxWidth: "min(320px, 100%)" }}>
                    <PersonaCarousel
                        personas={PERSONAS}
                        selectedId={state.sessionSettings.selectedPersonaId}
                        onSelect={(id) => dispatch({ type: "SET_PERSONA", payload: id })}
                        onStart={handleStart}
                    />
                </div>
            </div>

            {/* Safe area bottom */}
            <div style={{ height: "max(1.5rem, env(safe-area-inset-bottom, 1.5rem))" }} />

            {/* Profile Edit Modal Overlay */}
            <AnimatePresence>
                {showEditModal && state.userProfile && (
                    <ProfileEditModal
                        initialProfile={state.userProfile}
                        onSave={(updated) => {
                            dispatch({ type: "SET_USER_PROFILE", payload: updated });
                            setShowEditModal(false);
                        }}
                        onClose={() => setShowEditModal(false)}
                    />
                )}
            </AnimatePresence>
        </motion.div>
    );
}
