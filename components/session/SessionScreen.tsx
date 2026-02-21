"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAppContext } from "@/context/AppContext";
import { useVoiceCapture } from "@/hooks/useVoiceCapture";
import type { WSStatus } from "@/hooks/useVoiceCapture";
import { AvatarCore } from "./AvatarCore";
import { WaveformIndicator } from "./WaveformIndicator";
import { PERSONAS } from "@/lib/mockData";
import { sessionPanelVariants } from "@/lib/animations";
import { ChevronLeft } from "lucide-react";

const WS_COLOR: Record<WSStatus, string> = {
    disconnected: "bg-white/10 text-white/30",
    connecting: "bg-yellow-500/20 text-yellow-300",
    connected: "bg-green-500/20 text-green-300",
    error: "bg-red-500/20 text-red-400",
};

const WS_DOT: Record<WSStatus, string> = {
    disconnected: "bg-white/25",
    connecting: "bg-yellow-400 animate-pulse",
    connected: "bg-green-400",
    error: "bg-red-400",
};

const LOG_COLOR: Record<string, string> = {
    green: "text-green-400",
    yellow: "text-yellow-300",
    blue: "text-blue-300",
    red: "text-red-400",
    purple: "text-purple-400",
};

export function SessionScreen() {
    const router = useRouter();
    const { state, dispatch } = useAppContext();
    const {
        status, wsStatus, isWaiting, avatarState, loading, error, gameEvent, debugLog,
        start, stop, forceCommit,
    } = useVoiceCapture();

    const currentPersona =
        PERSONAS.find((p) => p.id === state.sessionSettings.selectedPersonaId) ?? PERSONAS[0];

    const isActive = status !== "idle";

    const handleBack = () => {
        stop();
        dispatch({ type: "GO_LANDING" });
        router.push("/");
    };

    return (
        <div className="flex flex-col min-h-screen px-4 py-8 gap-4">

            {/* ── 상단 바 ─────────────────────────────────────────── */}
            <div className="flex items-center justify-between max-w-md mx-auto w-full">
                <motion.button
                    onClick={handleBack}
                    className="flex items-center gap-1 text-white/25 hover:text-white/55 transition-colors text-sm"
                    whileHover={{ x: -2 }}
                >
                    <ChevronLeft className="w-4 h-4" />
                    뒤로
                </motion.button>

                {/* WS 상태 배지 */}
                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono ${WS_COLOR[wsStatus]}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${WS_DOT[wsStatus]}`} />
                    {wsStatus}
                </div>

                {/* 시작/중지 버튼 */}
                <motion.button
                    onClick={isActive ? stop : start}
                    disabled={loading || !!error}
                    className={`
            text-xs px-3 py-1.5 rounded-full border transition-all
            disabled:opacity-40 disabled:cursor-not-allowed
            ${isActive
                            ? "border-red-500/30 text-red-400/70 hover:border-red-500/50"
                            : "border-white/10 text-white/30 hover:border-white/25 hover:text-white/55"
                        }
          `}
                    whileTap={{ scale: 0.92 }}
                >
                    {loading ? "로딩 중..." : error ? "오류" : isActive ? "중지" : "시작"}
                </motion.button>
            </div>

            {/* ── VAD 상태 배너 ────────────────────────────────────── */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={status}
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    transition={{ duration: 0.18 }}
                    className={`
            mx-auto px-5 py-2 rounded-full text-sm font-semibold tracking-wider text-center
            ${status === "speaking"
                            ? "bg-yellow-400/15 text-yellow-300 border border-yellow-400/30 shadow-[0_0_20px_rgba(250,204,21,0.15)]"
                            : status === "ai_speaking"
                                ? "bg-blue-400/15 text-blue-300 border border-blue-400/30 shadow-[0_0_20px_rgba(96,165,250,0.15)]"
                                : status === "waiting"
                                    ? "bg-purple-400/15 text-purple-300 border border-purple-400/30 shadow-[0_0_20px_rgba(192,132,252,0.15)]"
                                    : status === "listening"
                                        ? "bg-green-400/10 text-green-300/70 border border-green-400/20"
                                        : "bg-white/5 text-white/20 border border-white/10"
                        }
          `}
                >
                    {status === "idle" && "● IDLE"}
                    {status === "listening" && "◉ LISTENING"}
                    {status === "speaking" && "🎙 SPEECH START — 녹음 중"}
                    {status === "ai_speaking" && "🔊 AI SPEAKING"}
                    {status === "waiting" && "⏳ 답변 대기 중..."}
                </motion.div>
            </AnimatePresence>

            {/* ── 아바타 ──────────────────────────────────────────── */}
            <motion.div
                className="flex-1 flex flex-col items-center justify-center gap-6"
                custom={0} variants={sessionPanelVariants} initial="hidden" animate="visible"
            >
                {/* 아바타 — 탭하면 forceCommit */}
                <motion.button
                    onClick={isActive && !isWaiting ? forceCommit : undefined}
                    className={`flex flex-col items-center gap-3 ${isActive && !isWaiting ? "cursor-pointer" : "cursor-default"}`}
                    whileTap={isActive && !isWaiting ? { scale: 0.96 } : {}}
                >
                    <AvatarCore avatarState={avatarState} persona={currentPersona} layoutId="avatar" />
                    {isActive && !isWaiting && (
                        <p className="text-white/18 text-[10px] tracking-widest uppercase">탭하여 답변 요청</p>
                    )}
                    {isWaiting && (
                        <motion.p
                            className="text-purple-300/60 text-xs tracking-widest"
                            animate={{ opacity: [0.4, 1, 0.4] }}
                            transition={{ duration: 1.4, repeat: Infinity }}
                        >
                            답변 생성 중...
                        </motion.p>
                    )}
                </motion.button>
                <WaveformIndicator avatarState={avatarState} />

                {error && (
                    <p className="text-red-400/70 text-xs text-center max-w-xs font-mono break-words">{error}</p>
                )}

                {/* 게임 이벤트 stub */}
                {gameEvent && (
                    <motion.div
                        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                        className="w-full max-w-sm glass-card px-5 py-4"
                    >
                        <p className="text-white/40 text-xs uppercase tracking-widest mb-2">
                            {gameEvent.type === "quiz" ? "퀴즈" : gameEvent.type === "psych" ? "심리 테스트" : "밸런스 게임"}
                        </p>
                        <p className="text-white/85 text-sm font-medium mb-3">{gameEvent.question}</p>
                        <ul className="flex flex-col gap-1.5">
                            {gameEvent.choices.map((c, i) => (
                                <li key={i} className="text-white/50 text-xs border border-white/10 rounded-lg px-3 py-2">{c}</li>
                            ))}
                        </ul>
                    </motion.div>
                )}
            </motion.div>

            {/* ── 디버그 로그 패널 ─────────────────────────────────── */}
            <div className="w-full max-w-md mx-auto">
                <p className="text-white/15 text-[10px] uppercase tracking-widest mb-1 font-mono">debug log</p>
                <div className="bg-black/40 border border-white/8 rounded-xl p-3 h-44 overflow-y-auto flex flex-col gap-0.5 font-mono">
                    {debugLog.length === 0 ? (
                        <p className="text-white/15 text-xs">— 로그 없음 —</p>
                    ) : (
                        debugLog.map((e, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -4 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.12 }}
                                className="flex items-start gap-2 text-[11px] leading-relaxed"
                            >
                                <span className="text-white/20 flex-shrink-0">{e.ts}</span>
                                <span className={LOG_COLOR[e.color]}>{e.label}</span>
                            </motion.div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
