"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { useAppContext } from "@/context/AppContext";
import { useVoiceCapture } from "@/hooks/useVoiceCapture";
import { AvatarCore } from "./AvatarCore";
import { WaveformIndicator } from "./WaveformIndicator";
import { PsychTestPopup } from "./popups/PsychTestPopup";
import { BalanceGamePopup } from "./popups/BalanceGamePopup";
import { QuizPopup } from "./popups/QuizPopup";
import { PERSONAS } from "@/lib/mockData";
import { popupVariants } from "@/lib/animations";
import type { GameEvent } from "@/types";

const STATUS_PILL: Record<string, { label: string; bg: string; text: string }> = {
    idle:        { label: "● 대기",      bg: "#F0F0F0",  text: "#9CA3AF" },
    listening:   { label: "◉ 듣는 중",  bg: "#B8F0F0",  text: "#0A4040" },
    speaking:    { label: "🎙 녹음 중", bg: "#FDCFF7",  text: "#4A0A40" },
    ai_speaking: { label: "🔊 AI 응답", bg: "#F5E9BB",  text: "#4A3800" },
    waiting:     { label: "⏳ 처리 중", bg: "#F5E9BB",  text: "#4A3800" },
};

// ── Dev test fixtures (keyboard 1/2/3) ───────────────────────
const DEV_EVENTS: Record<string, GameEvent> = {
    "1": {
        type: "psych",
        question: "당신은 지금 깊은 숲속을 걷고 있습니다. 곁에는 원숭이, 사자, 말, 소, 양 이렇게 다섯 마리의 동물이 함께 있어요. 길을 가다 보니 너무 힘들어서 한 마리씩 버리고 가야 합니다. 어떤 순서로 버리시겠어요?",
        choices: [],
    },
    "2": {
        type: "balance",
        question: "평생 한 종류의 음식만 먹어야 한다면? 단짠(달고 짠 음식) vs 매콤(매운 음식)",
        choices: ["단짠", "매콤"],
    },
    "3": {
        type: "quiz",
        question: "다음 중 사랑의 신 큐피드의 무기는 무엇일까요?",
        choices: ["활과 화살", "마법 지팡이", "황금 방패", "수정 구슬"],
    },
};

export function SessionScreen() {
    const router = useRouter();
    const { state, dispatch } = useAppContext();
    const {
        status, wsStatus, isWaiting, avatarState,
        loading, error, gameEvent,
        start, stop, forceCommit, dismissEvent,
    } = useVoiceCapture();

    const [devEvent, setDevEvent] = useState<GameEvent | null>(null);

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            const ev = DEV_EVENTS[e.key];
            if (ev) setDevEvent(ev);
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, []);

    const activeEvent = gameEvent ?? devEvent;
    const dismissActive = gameEvent ? dismissEvent : () => setDevEvent(null);

    const persona = PERSONAS.find((p) => p.id === state.sessionSettings.selectedPersonaId) ?? PERSONAS[0];
    const isActive = status !== "idle";
    const wsConnected = wsStatus === "connected";
    const pill = STATUS_PILL[status] ?? STATUS_PILL.idle;

    const handleBack = () => {
        stop();
        dispatch({ type: "GO_LANDING" });
        router.push("/");
    };

    return (
        <div
            className="relative flex flex-col bg-white dark:bg-dark-bg overflow-hidden mx-auto w-full"
            style={{ height: "100dvh", maxWidth: 430 }}
        >
            {/* ── Top nav ──────────────────────────────────────── */}
            <div
                className="shrink-0 flex items-center justify-between px-5 pb-3"
                style={{ paddingTop: "max(2.5rem, env(safe-area-inset-top, 2.5rem))" }}
            >
                <motion.button
                    onClick={handleBack}
                    className="flex items-center gap-1 text-sm font-semibold text-primary"
                    whileTap={{ scale: 0.92 }}
                >
                    <ChevronLeft className="w-4 h-4" />
                    뒤로
                </motion.button>

                <span className="font-black text-base text-[#1A1A1A] dark:text-[#F0F0F0] tracking-tight">
                    AI CUPID
                </span>

                {/* WS status */}
                <div className="flex items-center gap-1.5">
                    <div
                        className="w-2 h-2 rounded-full"
                        style={{
                            backgroundColor:
                                wsStatus === "connected"  ? "#86E3E3"
                                : wsStatus === "connecting" ? "#E6D08E"
                                : wsStatus === "error"      ? "#EF4444"
                                : "#9CA3AF",
                            boxShadow: wsConnected ? "0 0 6px #86E3E3" : "none",
                        }}
                    />
                    <span className="text-xs text-[#1A1A1A]/40 dark:text-white/30 font-mono">
                        {wsStatus}
                    </span>
                </div>
            </div>

            {/* ── Avatar area ──────────────────────────────────── */}
            <motion.div
                className="flex-1 flex flex-col items-center justify-center gap-4 px-4 overflow-hidden"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 24, delay: 0.08 }}
            >
                <motion.button
                    onClick={isActive && !isWaiting ? forceCommit : undefined}
                    className={isActive && !isWaiting ? "cursor-pointer" : "cursor-default"}
                    whileTap={isActive && !isWaiting ? { scale: 0.97 } : {}}
                >
                    <AvatarCore
                        avatarState={avatarState}
                        voiceStatus={status}
                        persona={persona}
                    />
                </motion.button>

                {/* Status pill */}
                <AnimatePresence mode="wait">
                    <motion.span
                        key={status}
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 6 }}
                        transition={{ duration: 0.15 }}
                        className="status-pill font-bold"
                        style={{ backgroundColor: pill.bg, color: pill.text }}
                    >
                        {pill.label}
                    </motion.span>
                </AnimatePresence>

                {isActive && !isWaiting && (
                    <p className="text-[11px] text-[#1A1A1A]/25 dark:text-white/20 tracking-widest uppercase">
                        탭하여 답변 전송
                    </p>
                )}

                {error && (
                    <p className="text-red-500 text-xs text-center max-w-xs break-words">{error}</p>
                )}

                {/* Dev keyboard hint */}
                <p className="text-[10px] text-[#1A1A1A]/18 dark:text-white/12 font-mono">
                    [dev] 키보드 1=심리 2=밸런스 3=퀴즈
                </p>
            </motion.div>

            {/* ── Bottom controls ───────────────────────────────── */}
            <div
                className="shrink-0 px-5 flex flex-col gap-3"
                style={{ paddingBottom: "max(2rem, env(safe-area-inset-bottom, 2rem))" }}
            >
                {/* Start / Stop */}
                <motion.button
                    onClick={isActive ? stop : start}
                    disabled={loading || !!error}
                    className="w-full py-4 rounded-2xl font-black text-base disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{
                        backgroundColor: isActive ? "#FAA2EE" : "#86E3E3",
                        color: isActive ? "#4A0A40" : "#0A4040",
                    }}
                    whileTap={{ scale: 0.97 }}
                >
                    {loading ? "로딩 중..." : error ? "오류" : isActive ? "중지" : "시작"}
                </motion.button>

                {/* Always-visible voice bar */}
                <WaveformIndicator status={status} wsConnected={wsConnected} />
            </div>

            {/* ── Game event popups ─────────────────────────────── */}
            <AnimatePresence>
                {activeEvent && (
                    <motion.div
                        className="absolute inset-0 z-20 flex items-center justify-center px-5"
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        variants={popupVariants}
                    >
                        {/* Dim backdrop */}
                        <div
                            className="absolute inset-0 bg-black/40"
                            onClick={dismissActive}
                        />

                        {activeEvent.type === "psych" && (
                            <PsychTestPopup
                                question={activeEvent.question}
                                voiceStatus={status}
                                wsConnected={wsConnected}
                                onClose={dismissActive}
                            />
                        )}

                        {activeEvent.type === "balance" && (
                            <BalanceGamePopup
                                question={activeEvent.question}
                                choices={[activeEvent.choices[0] ?? "A", activeEvent.choices[1] ?? "B"]}
                                voiceStatus={status}
                                wsConnected={wsConnected}
                                onClose={dismissActive}
                            />
                        )}

                        {activeEvent.type === "quiz" && (
                            <QuizPopup
                                question={activeEvent.question}
                                choices={activeEvent.choices}
                                voiceStatus={status}
                                wsConnected={wsConnected}
                                onClose={dismissActive}
                            />
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
