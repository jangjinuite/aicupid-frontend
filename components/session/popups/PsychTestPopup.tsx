"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { WaveformIndicator } from "@/components/session/WaveformIndicator";
import { modalCardVariants } from "@/lib/animations";
import type { VoiceStatus } from "@/hooks/useVoiceCapture";
import type { Persona, AvatarState } from "@/types";
import { AvatarCore } from "@/components/session/AvatarCore";

interface PsychTestPopupProps {
    question: string;
    /** 참가자 수 (기본 2명) */
    participantCount?: number;
    /** 참가자 이름 목록 (없으면 "참가자 1", "참가자 2" 사용) */
    participants?: string[];
    voiceStatus: VoiceStatus;
    onClose: () => void;
    registerSpeechHandler?: (handler: (blob: Blob) => void) => void;
    unregisterSpeechHandler?: () => void;
    submitPsychTestResult?: (blob1: Blob, blob2: Blob) => Promise<any>;
    persona: Persona;
    avatarState: AvatarState;
    forceCommit: () => void;
    isWaiting: boolean;
}

export function PsychTestPopup({
    question,
    participantCount = 2,
    participants,
    voiceStatus,
    onClose,
    registerSpeechHandler,
    unregisterSpeechHandler,
    submitPsychTestResult,
    persona,
    avatarState,
    forceCommit,
    isWaiting,
}: PsychTestPopupProps) {
    const [currentIdx, setCurrentIdx] = useState(0); // 0=P1, 1=P2, 2=loading, 3=result
    const [finalResult, setFinalResult] = useState<string | null>(null);
    const audioBlobsRef = useRef<Blob[]>([]);

    // 2명의 턴이 모두 끝났는지 여부
    const isDone = currentIdx >= 2;

    useEffect(() => {
        if (!registerSpeechHandler || !unregisterSpeechHandler) return;

        registerSpeechHandler(async (blob: Blob) => {
            const currentCount = audioBlobsRef.current.length;
            if (currentCount === 0) {
                audioBlobsRef.current.push(blob);
                setCurrentIdx(1); // Move to P2
            } else if (currentCount === 1) {
                audioBlobsRef.current.push(blob);
                setCurrentIdx(2); // Move to Processing

                try {
                    unregisterSpeechHandler();
                    if (submitPsychTestResult) {
                        const result = await submitPsychTestResult(audioBlobsRef.current[0], audioBlobsRef.current[1]);
                        setFinalResult(result.reply || result.response || "결과 분석이 완료되었습니다.");
                    }
                } catch (err) {
                    setFinalResult("오류가 발생했습니다.");
                } finally {
                    setCurrentIdx(3); // Show Result
                }
            }
        });

        return () => unregisterSpeechHandler();
    }, [registerSpeechHandler, unregisterSpeechHandler, submitPsychTestResult]);

    const handleNext = () => {
        if (currentIdx === 3) {
            onClose();
        } else {
            // 버튼 클릭으로 임의 진행 (디버깅/폴백 용)
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
            </div>

            {/* Question */}
            <p className="px-6 text-base font-medium text-[#1A1A1A] dark:text-[#F0F0F0] leading-relaxed text-balance">
                {question}
            </p>

            {/* Person indicator & instructions */}
            <div className="px-6 pt-4 pb-2">
                {currentIdx < 2 && (
                    <>
                        <div className="flex gap-2 mb-3">
                            {[0, 1].map((i) => (
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
                                className="flex items-center gap-2 mb-2"
                            >
                                <div
                                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                                    style={{ backgroundColor: "#86E3E3" }}
                                >
                                    {currentIdx + 1}
                                </div>
                                <span className="font-bold text-[#1A1A1A] dark:text-[#F0F0F0] text-lg">
                                    {currentIdx === 0 ? "첫 번째 사람이 말하세요 🗣️" : "이제 두 번째 사람이 말하세요 🗣️"}
                                </span>
                            </motion.div>
                        </AnimatePresence>
                    </>
                )}

                {currentIdx === 2 && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        className="text-center py-6 font-bold text-[#1A1A1A] dark:text-[#F0F0F0] text-lg"
                    >
                        궁합 분석 중입니다... ⏳
                    </motion.div>
                )}

                {currentIdx === 3 && finalResult && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        className="mt-4 p-4 rounded-xl text-sm leading-relaxed whitespace-pre-wrap font-medium"
                        style={{ backgroundColor: "#F5E9BB", color: "#4A3800" }}
                    >
                        {finalResult}
                    </motion.div>
                )}
            </div>

            {/* Avatar / Voice indicator */}
            <div className="px-6 py-4 flex flex-col items-center justify-center gap-3">
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
                {voiceStatus !== "idle" && !isWaiting && currentIdx < 2 && (
                    <p className="text-[10px] text-[#1A1A1A]/30 dark:text-white/20 tracking-widest uppercase">
                        입력이 끝나면 아바타를 탭하세요
                    </p>
                )}
            </div>

            {/* Next / Done button */}
            {currentIdx === 3 && (
                <div className="px-6 pb-6 pt-1">
                    <button
                        onClick={handleNext}
                        className="w-full py-3.5 rounded-2xl font-bold text-base text-white transition-transform active:scale-[0.97]"
                        style={{ backgroundColor: "#86E3E3", color: "#0A4040" }}
                    >
                        닫기
                    </button>
                </div>
            )}
        </motion.div>
    );
}
