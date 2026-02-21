"use client";

import { motion } from "framer-motion";
import { X } from "lucide-react";
import { WaveformIndicator } from "@/components/session/WaveformIndicator";
import { modalCardVariants } from "@/lib/animations";
import type { VoiceStatus } from "@/hooks/useVoiceCapture";
import type { Persona, AvatarState } from "@/types";
import { AvatarCore } from "@/components/session/AvatarCore";

interface BalanceGamePopupProps {
    question: string;
    choices: [string, string];
    voiceStatus: VoiceStatus;
    onClose: () => void;
    persona: Persona;
    avatarState: AvatarState;
    forceCommit: () => void;
    isWaiting: boolean;
}

export function BalanceGamePopup({
    question,
    choices,
    voiceStatus,
    onClose,
    persona,
    avatarState,
    forceCommit,
    isWaiting,
}: BalanceGamePopupProps) {
    return (
        <motion.div
            className="relative w-full popup-sheet rounded-[2rem] overflow-hidden z-30"
            variants={modalCardVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
        >
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-5 pb-3">
                <span className="text-xs font-bold tracking-widest uppercase text-gold">
                    밸런스 게임
                </span>
            </div>

            {/* Question */}
            <p className="px-6 pb-4 text-base font-semibold text-[#1A1A1A] dark:text-[#F0F0F0] leading-relaxed text-balance">
                {question}
            </p>

            {/* VS cards */}
            <div className="px-6 pb-4 grid grid-cols-2 gap-3">
                {/* Option A */}
                <motion.div
                    className="rounded-2xl flex items-center justify-center py-10 px-3 text-center cursor-default"
                    style={{ backgroundColor: "#86E3E3" }}
                    whileTap={{ scale: 0.97 }}
                >
                    <span className="font-black text-xl leading-tight text-[#0A4040]">
                        {choices[0]}
                    </span>
                </motion.div>

                {/* Option B */}
                <motion.div
                    className="rounded-2xl flex items-center justify-center py-10 px-3 text-center cursor-default"
                    style={{ backgroundColor: "#FAA2EE" }}
                    whileTap={{ scale: 0.97 }}
                >
                    <span className="font-black text-xl leading-tight text-[#4A0A40]">
                        {choices[1]}
                    </span>
                </motion.div>
            </div>

            {/* Voice hint */}
            {voiceStatus !== "idle" && !isWaiting && (
                <p className="px-6 pb-2 text-[10px] text-[#1A1A1A]/40 dark:text-white/30 text-center tracking-widest uppercase">
                    A 또는 B를 말하고 아바타를 탭하세요
                </p>
            )}

            {/* Avatar / Voice indicator */}
            <div className="px-6 pb-6 pt-2 flex justify-center">
                <motion.button
                    onClick={voiceStatus !== "idle" && !isWaiting ? forceCommit : undefined}
                    className={voiceStatus !== "idle" && !isWaiting ? "cursor-pointer" : "cursor-default"}
                    whileTap={voiceStatus !== "idle" && !isWaiting ? { scale: 0.95 } : {}}
                    style={{ transform: "scale(0.8)" }} // Make it slightly smaller in popup
                >
                    <AvatarCore
                        avatarState={avatarState}
                        voiceStatus={voiceStatus}
                        persona={persona}
                    />
                </motion.button>
            </div>
        </motion.div>
    );
}
