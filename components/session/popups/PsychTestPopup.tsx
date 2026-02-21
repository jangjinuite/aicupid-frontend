"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { WaveformIndicator } from "@/components/session/WaveformIndicator";
import { modalCardVariants } from "@/lib/animations";
import type { VoiceStatus } from "@/hooks/useVoiceCapture";

interface PsychTestPopupProps {
    question: string;
    /** 참가자 수 (기본 2명) */
    participantCount?: number;
    /** 참가자 이름 목록 (없으면 "참가자 1", "참가자 2" 사용) */
    participants?: string[];
    voiceStatus: VoiceStatus;
    onClose: () => void;
}

export function PsychTestPopup({
    question,
    participantCount = 2,
    participants,
    voiceStatus,
    onClose,
}: PsychTestPopupProps) {
    const [currentIdx, setCurrentIdx] = useState(0);
    const total = participantCount;
    const names = participants ?? Array.from({ length: total }, (_, i) => `참가자 ${i + 1}`);
    const isLast = currentIdx === total - 1;

    const handleNext = () => {
        if (isLast) {
            onClose();
        } else {
            setCurrentIdx((p) => p + 1);
        }
    };

    return (
        <motion.div
            className="relative w-full popup-sheet rounded-[2rem] overflow-hidden z-30"
            style={{ maxHeight: "85dvh", overflowY: "auto" }}
            variants={modalCardVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
        >
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-5 pb-3">
                <span className="text-xs font-bold tracking-widest uppercase text-primary">
                    심리 테스트
                </span>
                <button
                    onClick={onClose}
                    className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center"
                >
                    <X className="w-4 h-4 text-[#1A1A1A] dark:text-[#F0F0F0]" />
                </button>
            </div>

            {/* Question */}
            <p className="px-6 text-base font-medium text-[#1A1A1A] dark:text-[#F0F0F0] leading-relaxed text-balance">
                {question}
            </p>

            {/* Person indicator */}
            <div className="px-6 pt-4 pb-2">
                {/* Progress dots */}
                <div className="flex gap-2 mb-3">
                    {names.map((_, i) => (
                        <div
                            key={i}
                            className="h-1.5 rounded-full transition-all duration-300"
                            style={{
                                flex: i === currentIdx ? 2 : 1,
                                backgroundColor: i <= currentIdx ? "#86E3E3" : "#E5E7EB",
                            }}
                        />
                    ))}
                </div>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentIdx}
                        initial={{ opacity: 0, x: 16 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -16 }}
                        transition={{ duration: 0.2 }}
                        className="flex items-center gap-2"
                    >
                        <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white"
                            style={{ backgroundColor: "#86E3E3" }}
                        >
                            {currentIdx + 1}
                        </div>
                        <span className="font-semibold text-[#1A1A1A] dark:text-[#F0F0F0]">
                            {names[currentIdx]} 답변 중
                        </span>
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Voice indicator */}
            <div className="px-6 py-3">
                <WaveformIndicator status={voiceStatus} />
            </div>

            {/* Next / Done button */}
            <div className="px-6 pb-6 pt-1">
                <button
                    onClick={handleNext}
                    className="w-full py-3.5 rounded-2xl font-bold text-base text-white transition-transform active:scale-[0.97]"
                    style={{ backgroundColor: "#86E3E3", color: "#0A4040" }}
                >
                    {isLast ? "완료" : "다음 →"}
                </button>
            </div>
        </motion.div>
    );
}
