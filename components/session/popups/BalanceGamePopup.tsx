"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { modalCardVariants } from "@/lib/animations";
import { useAudioQueue } from "@/hooks/useAudioQueue";
import type { VoiceStatus } from "@/hooks/useVoiceCapture";
import type { Persona, AvatarState } from "@/types";
import { AvatarCore } from "@/components/session/AvatarCore";

interface BalanceQuestion {
    text: string;
    options: string[];
    audio?: string;
    mime_type?: string;
}

interface BalanceGamePopupProps {
    questions: BalanceQuestion[];
    voiceStatus: VoiceStatus;
    onClose: () => void;
    persona: Persona;
    avatarState: AvatarState;
    forceCommit: () => void;
    isWaiting: boolean;
    registerSpeechHandler: (handler: (blob: Blob) => void) => void;
    unregisterSpeechHandler: () => void;
    submitBalanceGameResult: (blobs: [Blob, Blob, Blob], texts: [string, string, string]) => Promise<any>;
}

// 0–2: recording each question, 3: loading, 4: result
type Phase = 0 | 1 | 2 | 3 | 4;

export function BalanceGamePopup({
    questions,
    voiceStatus,
    onClose,
    persona,
    avatarState,
    forceCommit,
    isWaiting,
    registerSpeechHandler,
    unregisterSpeechHandler,
    submitBalanceGameResult,
}: BalanceGamePopupProps) {
    const [phase, setPhase] = useState<Phase>(0);
    const [finalResult, setFinalResult] = useState<string | null>(null);
    const audioBlobsRef = useRef<Blob[]>([]);
    const { playResponse } = useAudioQueue();

    const currentQ = questions[phase < 3 ? phase : 0];

    useEffect(() => {
        registerSpeechHandler(async (blob: Blob) => {
            const count = audioBlobsRef.current.length;
            if (count >= 3) return; // already done

            audioBlobsRef.current.push(blob);
            const newCount = audioBlobsRef.current.length;

            if (newCount === 1) {
                // advance to Q2, play its audio
                setPhase(1);
                const q2 = questions[1];
                if (q2?.audio) {
                    await playResponse(q2.audio, q2.mime_type || "audio/wav", () => {});
                }
            } else if (newCount === 2) {
                // advance to Q3, play its audio
                setPhase(2);
                const q3 = questions[2];
                if (q3?.audio) {
                    await playResponse(q3.audio, q3.mime_type || "audio/wav", () => {});
                }
            } else if (newCount === 3) {
                // all answers collected — submit
                setPhase(3);
                unregisterSpeechHandler();
                try {
                    const [b1, b2, b3] = audioBlobsRef.current as [Blob, Blob, Blob];
                    const texts: [string, string, string] = [
                        questions[0].text,
                        questions[1].text,
                        questions[2].text,
                    ];
                    const result = await submitBalanceGameResult([b1, b2, b3], texts);
                    setFinalResult(result?.reply || result?.response || "결과 분석이 완료되었습니다.");
                } catch {
                    setFinalResult("오류가 발생했습니다.");
                } finally {
                    setPhase(4);
                }
            }
        });

        return () => unregisterSpeechHandler();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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
                <span className="text-xs font-bold tracking-widest uppercase text-gold">
                    밸런스 게임
                </span>
            </div>

            {/* Progress bar */}
            {phase < 3 && (
                <div className="px-6 pb-3 flex gap-2">
                    {[0, 1, 2].map((i) => (
                        <div
                            key={i}
                            className="h-1.5 flex-1 rounded-full transition-all duration-300"
                            style={{ backgroundColor: i <= phase ? "#F5C518" : "#E5E7EB" }}
                        />
                    ))}
                </div>
            )}

            {/* Question & choices */}
            <AnimatePresence mode="wait">
                {phase < 3 && (
                    <motion.div
                        key={phase}
                        initial={{ opacity: 0, x: 16 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -16 }}
                        transition={{ duration: 0.2 }}
                    >
                        {/* Question text */}
                        <p className="px-6 pb-4 text-base font-semibold text-[#1A1A1A] dark:text-[#F0F0F0] leading-relaxed text-balance">
                            {currentQ.text}
                        </p>

                        {/* VS cards */}
                        <div className="px-6 pb-4 grid grid-cols-2 gap-3">
                            <motion.div
                                className="rounded-2xl flex items-center justify-center py-10 px-3 text-center"
                                style={{ backgroundColor: "#86E3E3" }}
                                whileTap={{ scale: 0.97 }}
                            >
                                <span className="font-black text-xl leading-tight text-[#0A4040]">
                                    {currentQ.options[0] ?? "A"}
                                </span>
                            </motion.div>

                            <motion.div
                                className="rounded-2xl flex items-center justify-center py-10 px-3 text-center"
                                style={{ backgroundColor: "#FAA2EE" }}
                                whileTap={{ scale: 0.97 }}
                            >
                                <span className="font-black text-xl leading-tight text-[#4A0A40]">
                                    {currentQ.options[1] ?? "B"}
                                </span>
                            </motion.div>
                        </div>
                    </motion.div>
                )}

                {phase === 3 && (
                    <motion.div
                        key="loading"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center py-10 px-6 font-bold text-[#1A1A1A] dark:text-[#F0F0F0] text-lg"
                    >
                        궁합 분석 중입니다... ⏳
                    </motion.div>
                )}

                {phase === 4 && finalResult && (
                    <motion.div
                        key="result"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="px-6 pb-4"
                    >
                        <div
                            className="p-4 rounded-xl text-sm leading-relaxed whitespace-pre-wrap font-medium"
                            style={{ backgroundColor: "#F5E9BB", color: "#4A3800" }}
                        >
                            {finalResult}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Voice hint */}
            {voiceStatus !== "idle" && !isWaiting && phase < 3 && (
                <p className="px-6 pb-2 text-[10px] text-[#1A1A1A]/40 dark:text-white/30 text-center tracking-widest uppercase">
                    A 또는 B를 말하고 아바타를 탭하세요
                </p>
            )}

            {/* Avatar */}
            {phase < 3 && (
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
            )}

            {/* Close button after result */}
            {phase === 4 && (
                <div className="px-6 pb-6 pt-1">
                    <button
                        onClick={onClose}
                        className="w-full py-3.5 rounded-2xl font-bold text-base transition-transform active:scale-[0.97]"
                        style={{ backgroundColor: "#F5C518", color: "#4A3800" }}
                    >
                        닫기
                    </button>
                </div>
            )}
        </motion.div>
    );
}
