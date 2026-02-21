"use client";

import { motion } from "framer-motion";
import { X } from "lucide-react";
import { WaveformIndicator } from "@/components/session/WaveformIndicator";
import { modalCardVariants } from "@/lib/animations";
import type { VoiceStatus } from "@/hooks/useVoiceCapture";

interface BalanceGamePopupProps {
    question: string;
    choices: [string, string];
    voiceStatus: VoiceStatus;
    wsConnected: boolean;
    onClose: () => void;
}

export function BalanceGamePopup({
    question,
    choices,
    voiceStatus,
    wsConnected,
    onClose,
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
                <button
                    onClick={onClose}
                    className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center"
                >
                    <X className="w-4 h-4 text-[#1A1A1A] dark:text-[#F0F0F0]" />
                </button>
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
            <p className="px-6 pb-2 text-xs text-[#1A1A1A]/40 dark:text-white/30 text-center">
                음성으로 답변해 주세요
            </p>

            {/* Voice indicator */}
            <div className="px-6 pb-6">
                <WaveformIndicator status={voiceStatus} wsConnected={wsConnected} />
            </div>
        </motion.div>
    );
}
