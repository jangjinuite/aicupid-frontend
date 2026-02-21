"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { WaveformIndicator } from "@/components/session/WaveformIndicator";
import { modalCardVariants } from "@/lib/animations";
import type { VoiceStatus } from "@/hooks/useVoiceCapture";
import type { Persona, AvatarState } from "@/types";
import { AvatarCore } from "@/components/session/AvatarCore";

interface QuizPopupProps {
    questionId?: string;
    question: string;
    choices: string[];
    voiceStatus: VoiceStatus;
    onClose: () => void;
    registerSpeechHandler?: (handler: (blob: Blob) => void) => void;
    unregisterSpeechHandler?: () => void;
    submitQuizResult?: (blob: Blob, questionId: string) => Promise<any>;
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
    questionId,
    question,
    choices,
    voiceStatus,
    onClose,
    registerSpeechHandler,
    unregisterSpeechHandler,
    submitQuizResult,
    persona,
    avatarState,
    forceCommit,
    isWaiting,
}: QuizPopupProps) {
    const [isProcessing, setIsProcessing] = useState(false);
    const [resultData, setResultData] = useState<{ isCorrect: boolean; text: string } | null>(null);

    const displayChoices = choices.slice(0, 4);

    useEffect(() => {
        if (!registerSpeechHandler || !submitQuizResult || !questionId) return;

        const handleSpeech = async (blob: Blob) => {
            if (unregisterSpeechHandler) unregisterSpeechHandler();
            setIsProcessing(true);

            try {
                const res = await submitQuizResult(blob, questionId);
                // Assume res has { is_correct: boolean, text: string }
                setResultData({
                    isCorrect: res.is_correct === true,
                    text: res.text || (res.is_correct ? "정답입니다!" : "틀렸습니다."),
                });
            } catch (err) {
                console.error("Quiz result error:", err);
                setResultData({
                    isCorrect: false,
                    text: "오류가 발생했습니다. 다시 시도해주세요.",
                });
            } finally {
                setIsProcessing(false);
            }
        };

        registerSpeechHandler(handleSpeech);

        return () => {
            if (unregisterSpeechHandler) unregisterSpeechHandler();
        };
    }, [registerSpeechHandler, unregisterSpeechHandler, submitQuizResult, questionId]);

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

            {/* Body Conditionals */}
            {!isProcessing && !resultData && (
                <>
                    <p className="px-6 pb-4 text-base font-semibold text-[#1A1A1A] dark:text-[#F0F0F0] leading-relaxed text-balance">
                        {question}
                    </p>

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

                    {voiceStatus !== "idle" && !isWaiting && (
                        <p className="px-6 pb-2 text-[10px] text-[#1A1A1A]/40 dark:text-white/30 text-center tracking-widest uppercase">
                            원하는 보기를 읽은 후 아바타를 탭하세요
                        </p>
                    )}

                    <div className="px-6 pb-6 pt-2 flex justify-center">
                        <motion.button
                            onClick={voiceStatus !== "idle" && !isWaiting ? forceCommit : undefined}
                            className={voiceStatus !== "idle" && !isWaiting ? "cursor-pointer" : "cursor-default"}
                            whileTap={voiceStatus !== "idle" && !isWaiting ? { scale: 0.95 } : {}}
                            style={{ transform: "scale(0.8)" }}
                        >
                            <AvatarCore
                                avatarState={avatarState}
                                voiceStatus={voiceStatus}
                                persona={persona}
                            />
                        </motion.button>
                    </div>
                </>
            )}

            {isProcessing && (
                <div className="px-6 py-12 flex flex-col items-center justify-center gap-4">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                        className="w-8 h-8 border-4 border-[#1A1A1A]/10 border-t-[#E6D08E] rounded-full"
                    />
                    <p className="text-sm font-bold text-[#1A1A1A]/50 dark:text-white/50 animate-pulse">
                        정답을 확인하는 중입니다... 🧐
                    </p>
                </div>
            )}

            {resultData && !isProcessing && (
                <motion.div
                    className="px-6 py-8 flex flex-col items-center justify-center gap-6"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                >
                    <div
                        className="w-20 h-20 rounded-full flex items-center justify-center text-4xl shadow-inner"
                        style={{
                            backgroundColor: resultData.isCorrect ? "#B8F0F0" : "#FDCFF7",
                            color: resultData.isCorrect ? "#0A4040" : "#4A0A40",
                        }}
                    >
                        {resultData.isCorrect ? "O" : "X"}
                    </div>

                    <p className="text-base font-bold text-center text-[#1A1A1A] dark:text-[#F0F0F0] leading-relaxed break-keep">
                        {resultData.text}
                    </p>

                    <button
                        onClick={onClose}
                        className="mt-4 px-8 py-3 rounded-full font-bold text-sm bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 transition-colors"
                    >
                        닫기
                    </button>
                </motion.div>
            )}
        </motion.div>
    );
}
