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
import { ActionModal } from "@/components/shared/ActionModal";
import { PERSONAS } from "@/lib/mockData";
import { popupVariants, modalCardVariants } from "@/lib/animations";

const STATUS_PILL: Record<string, { label: string; bg: string; text: string }> = {
    idle: { label: "● 대기", bg: "#F0F0F0", text: "#9CA3AF" },
    listening: { label: "◉ 듣는 중", bg: "#B8F0F0", text: "#0A4040" },
    speaking: { label: "🎙 녹음 중", bg: "#FDCFF7", text: "#4A0A40" },
    ai_speaking: { label: "🔊 AI 응답", bg: "#F5E9BB", text: "#4A3800" },
    waiting: { label: "⏳ 처리 중", bg: "#F5E9BB", text: "#4A3800" },
};

const GAME_LABELS: Record<string, string> = {
    psych: "심리 테스트",
    balance: "밸런스 게임",
    quiz: "퀴즈",
};

// ── Loading card shown while API is pending ───────────────────
function GameLoadingCard({ type }: { type: "quiz" | "psych" | "balance" }) {
    return (
        <motion.div
            className="relative z-30 flex flex-col items-center gap-6"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
        >
            <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 0.9, ease: "linear" }}
                className="w-14 h-14 border-4 border-white/20 border-t-white rounded-full"
            />
            <div className="flex flex-col items-center gap-2">
                <span className="text-xs font-bold tracking-widest uppercase text-white/60">
                    {GAME_LABELS[type]}
                </span>
                <p className="text-lg font-black text-white">
                    로딩 중...
                </p>
            </div>
        </motion.div>
    );
}

export function SessionScreen() {
    const router = useRouter();
    const { state, dispatch } = useAppContext();
    const {
        status, isWaiting, avatarState,
        loading, error, gameEvent, lastReply,
        start, stop, forceCommit, dismissEvent,
        registerSpeechHandler, unregisterSpeechHandler,
        triggerPsychTest, submitPsychTestResult,
        triggerQuiz, submitQuizResult,
        triggerBalanceGame, submitBalanceGameResult,
        pauseVAD, resumeVAD, getSessionId
    } = useVoiceCapture();

    const [showStopModal, setShowStopModal] = useState(false);

    useEffect(() => {
        if (!loading && status === "idle") {
            start();
        }
    }, [loading, status, start]);

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            // 팝업이 떠 있으면 다른 키 입력 무시
            if (gameEvent) return;

            if (e.key === "1") void triggerPsychTest();
            else if (e.key === "2") void triggerBalanceGame();
            else if (e.key === "3") void triggerQuiz();
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [triggerPsychTest, triggerBalanceGame, triggerQuiz, gameEvent]);

    const activeEvent = gameEvent;
    const dismissActive = dismissEvent;

    const persona = PERSONAS.find((p) => p.id === state.sessionSettings.selectedPersonaId) ?? PERSONAS[0];
    const isActive = status !== "idle";
    const pill = STATUS_PILL[status] ?? STATUS_PILL.idle;

    const handleBack = () => {
        stop();
        dispatch({ type: "GO_LANDING" });
    };

    const handleStopClick = () => {
        setShowStopModal(true);
    };

    const confirmStop = () => {
        const sessionId = getSessionId();
        if (sessionId) {
            dispatch({ type: "SET_LAST_SESSION_ID", payload: sessionId });
        }
        setShowStopModal(false);
        stop();
        dispatch({ type: "SET_SESSION_SUMMARY", payload: "" });
        router.push("/summary");
    };

    return (
        <motion.div
            className="absolute inset-0 flex flex-col bg-white dark:bg-dark-bg overflow-hidden mx-auto w-full z-20"
            style={{ maxWidth: 430 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
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
            </div>

            {/* ── Avatar area ──────────────────────────────────── */}
            <div className="flex-1 flex flex-col items-center justify-center gap-4 px-4 overflow-hidden">
                {!activeEvent && (
                    <>
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

                        {/* 말풍선 */}
                        <AnimatePresence>
                            {lastReply && (
                                <motion.div
                                    key={lastReply}
                                    initial={{ opacity: 0, y: -6, scale: 0.96 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 4, scale: 0.96 }}
                                    transition={{ duration: 0.2 }}
                                    className="relative max-w-[280px] px-4 py-3 rounded-2xl text-sm font-medium leading-relaxed text-center break-keep"
                                    style={{ backgroundColor: "#F5E9BB", color: "#4A3800" }}
                                >
                                    {/* 말풍선 꼭짓점 (위쪽 화살표) */}
                                    <span
                                        className="absolute -top-2 left-1/2 -translate-x-1/2 w-0 h-0"
                                        style={{
                                            borderLeft: "8px solid transparent",
                                            borderRight: "8px solid transparent",
                                            borderBottom: "8px solid #F5E9BB",
                                        }}
                                    />
                                    {lastReply}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </>
                )}

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

                {!activeEvent && isActive && !isWaiting && (
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
            </div>

            {/* ── Bottom controls ───────────────────────────────── */}
            <div
                className="shrink-0 px-5 flex flex-col gap-3"
                style={{ paddingBottom: "max(2rem, env(safe-area-inset-bottom, 2rem))" }}
            >
                {/* Start / Stop */}
                <motion.button
                    onClick={isActive ? handleStopClick : start}
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
                <WaveformIndicator status={status} />
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
                        <div className="absolute inset-0 bg-black/40" />

                        {/* 로딩 중 */}
                        {activeEvent.loading && (
                            <GameLoadingCard type={activeEvent.type} />
                        )}

                        {!activeEvent.loading && activeEvent.type === "psych" && (
                            <PsychTestPopup
                                question={activeEvent.question}
                                voiceStatus={status}
                                onClose={dismissActive}
                                registerSpeechHandler={registerSpeechHandler}
                                unregisterSpeechHandler={unregisterSpeechHandler}
                                submitPsychTestResult={submitPsychTestResult}
                                persona={persona}
                                avatarState={avatarState}
                                forceCommit={forceCommit}
                                isWaiting={isWaiting}
                            />
                        )}

                        {!activeEvent.loading && activeEvent.type === "balance" && activeEvent.questions && (
                            <BalanceGamePopup
                                questions={activeEvent.questions}
                                voiceStatus={status}
                                onClose={dismissActive}
                                persona={persona}
                                avatarState={avatarState}
                                forceCommit={forceCommit}
                                isWaiting={isWaiting}
                                registerSpeechHandler={registerSpeechHandler}
                                unregisterSpeechHandler={unregisterSpeechHandler}
                                submitBalanceGameResult={submitBalanceGameResult}
                                pauseVAD={pauseVAD}
                                resumeVAD={resumeVAD}
                            />
                        )}

                        {!activeEvent.loading && activeEvent.type === "quiz" && (
                            <QuizPopup
                                questionId={activeEvent.questionId}
                                question={activeEvent.question}
                                choices={activeEvent.choices}
                                voiceStatus={status}
                                onClose={dismissActive}
                                registerSpeechHandler={registerSpeechHandler}
                                unregisterSpeechHandler={unregisterSpeechHandler}
                                submitQuizResult={submitQuizResult}
                                persona={persona}
                                avatarState={avatarState}
                                forceCommit={forceCommit}
                                isWaiting={isWaiting}
                            />
                        )}
                    </motion.div>
                )}
                {showStopModal && (
                    <ActionModal
                        title={"AI CUPID의 현재 세션을\n종료하시겠습니까?"}
                        onConfirmText="예"
                        onCancelText="아니오"
                        onConfirm={confirmStop}
                        onCancel={() => setShowStopModal(false)}
                    />
                )}
            </AnimatePresence>
        </motion.div>
    );
}
