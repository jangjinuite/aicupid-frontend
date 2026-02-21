"use client";

import { motion } from "framer-motion";
import { X } from "lucide-react";
import { WaveformIndicator } from "@/components/session/WaveformIndicator";
import { modalCardVariants } from "@/lib/animations";
import type { VoiceStatus } from "@/hooks/useVoiceCapture";
import type { Persona, AvatarState } from "@/types";
import { AvatarCore } from "@/components/session/AvatarCore";

interface QuizPopupProps {
    question: string;
    choices: string[];
    voiceStatus: VoiceStatus;
    onClose: () => void;
    persona: Persona;
    avatarState: AvatarState;
    forceCommit: () => void;
    isWaiting: boolean;
}

const CHOICE_STYLES = [
    { bg: "#B8F0F0", text: "#0A4040", label: "A" },
    { bg: "#F5E9BB", text: "#4A3800", label: "B" },
    { bg: "#FDCFF7", text: "#4A0A40", label: "C" },
    { bg: "#E8E8F0", text: "#1A1A2A", label: "D" },
];

export function QuizPopup({
    question,
    choices,
    voiceStatus,
    onClose,
    persona,
    avatarState,
    forceCommit,
    isWaiting,
}: QuizPopupProps) {
    const displayChoices = choices.slice(0, 4);

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
                <span className="text-xs font-bold tracking-widest uppercase" style={{ color: "#E6D08E" }}>
                    퀴즈
                </span>
            </div>

            {/* Question */}
            <p className="px-6 pb-4 text-base font-semibold text-[#1A1A1A] dark:text-[#F0F0F0] leading-relaxed text-balance">
                {question}
            </p>

            {/* 2×2 choice grid */}
            <div className="px-6 pb-4 grid grid-cols-2 gap-3">
                {displayChoices.map((choice, i) => {
                    const style = CHOICE_STYLES[i] ?? CHOICE_STYLES[3];
                    return (
                        <motion.div
                            key={i}
                            className="rounded-2xl p-4 flex flex-col gap-1 cursor-default"
                            style={{ backgroundColor: style.bg }}
                            whileTap={{ scale: 0.97 }}
                        >
                            <span
                                className="text-xs font-black"
                                style={{ color: style.text, opacity: 0.5 }}
                            >
                                {style.label}
                            </span>
                            <span
                                className="font-bold text-sm leading-snug"
                                style={{ color: style.text }}
                            >
                                {choice}
                            </span>
                        </motion.div>
                    );
                })}
            </div>

            {/* Voice hint */}
            {voiceStatus !== "idle" && !isWaiting && (
                <p className="px-6 pb-2 text-[10px] text-[#1A1A1A]/40 dark:text-white/30 text-center tracking-widest uppercase">
                    원하는 보기를 읽은 후 아바타를 탭하세요
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
