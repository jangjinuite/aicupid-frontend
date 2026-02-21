"use client";

import { motion } from "framer-motion";
import { avatarVariants, speakingRingVariants } from "@/lib/animations";
import type { AvatarState, Persona } from "@/types";

interface AvatarCoreProps {
    avatarState: AvatarState;
    persona: Persona;
    layoutId?: string;
}

const STATE_LABELS: Record<AvatarState, string> = {
    idle: "대기 중",
    listening: "듣는 중...",
    speaking: "말하는 중...",
    thinking: "생각 중...",
};

const STATE_COLORS: Record<AvatarState, string> = {
    idle: "rgba(255,255,255,0.10)",
    listening: "rgba(255,255,255,0.55)",
    speaking: "rgba(255,255,255,0.70)",
    thinking: "rgba(255,255,255,0.35)",
};

export function AvatarCore({ avatarState, persona, layoutId }: AvatarCoreProps) {
    const stateColor = STATE_COLORS[avatarState];

    return (
        <motion.div
            className="flex flex-col items-center gap-5"
            variants={avatarVariants}
            initial="hidden"
            animate="visible"
        >
            <div className="relative flex items-center justify-center">
                {/* Pulsing state ring */}
                <motion.div
                    className="absolute inset-0 rounded-full scale-[1.22]"
                    style={{ border: `1.5px solid ${stateColor}`, opacity: 0.5 }}
                    variants={speakingRingVariants}
                    animate={avatarState}
                />

                {/* Rotating gradient border */}
                <motion.div
                    className="relative w-64 h-64"
                    layoutId={layoutId}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                >
                    <div
                        className="absolute inset-0 rounded-full animate-spin-slow"
                        style={{
                            background:
                                "conic-gradient(from 0deg, transparent 0%, rgba(255,255,255,0.08) 30%, rgba(255,255,255,0.35) 50%, rgba(255,255,255,0.08) 70%, transparent 100%)",
                        }}
                    />
                    <div
                        className="absolute inset-[3px] rounded-full flex items-center justify-center"
                        style={{ background: "#080808", border: "1px solid rgba(255,255,255,0.06)" }}
                    >
                        <span className="text-7xl select-none">{persona.emoji}</span>
                    </div>
                </motion.div>
            </div>

            {/* Name + state */}
            <div className="text-center">
                <p className="text-base font-medium tracking-wide text-white/70">{persona.name}</p>
                <motion.div
                    className="flex items-center justify-center gap-1.5 mt-1"
                    key={avatarState}
                    initial={{ opacity: 0, y: 3 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                >
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: stateColor }} />
                    <span className="text-xs text-white/35">{STATE_LABELS[avatarState]}</span>
                </motion.div>
            </div>
        </motion.div>
    );
}
