"use client";

import { motion } from "framer-motion";
import type { VoiceStatus } from "@/hooks/useVoiceCapture";

interface VoiceBarProps {
    status: VoiceStatus;
    wsConnected: boolean;
}

const STATUS_CONFIG = {
    idle: { label: "마이크 꺼짐", dot: "#9CA3AF", bar: "#9CA3AF" },
    listening: { label: "듣는 중", dot: "#86E3E3", bar: "#86E3E3" },
    speaking: { label: "녹음 중", dot: "#FAA2EE", bar: "#FAA2EE" },
    ai_speaking: { label: "AI 응답 중", dot: "#E6D08E", bar: "#E6D08E" },
    waiting: { label: "처리 중...", dot: "#E6D08E", bar: "#E6D08E" },
} satisfies Record<VoiceStatus, { label: string; dot: string; bar: string }>;

const MINI_PATTERNS = [
    [0.2, 1.0, 0.4, 0.8, 0.15],
    [0.5, 0.2, 0.9, 0.3, 0.7],
    [0.3, 0.8, 0.15, 0.95, 0.4],
    [0.7, 0.3, 0.6, 0.1, 0.8],
    [0.1, 0.7, 0.5, 0.9, 0.2],
    [0.6, 0.15, 0.85, 0.4, 0.65],
    [0.25, 0.9, 0.35, 0.7, 0.1],
];

export function WaveformIndicator({ status, wsConnected }: VoiceBarProps) {
    const cfg = STATUS_CONFIG[status];
    const isActive = status === "speaking" || status === "listening";

    return (
        <div className="w-full px-5 py-3 rounded-2xl bg-surface dark:bg-dark-card flex items-center gap-3 border border-[#86E3E3]/20">
            {/* Status dot */}
            <div
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{
                    backgroundColor: cfg.dot,
                    boxShadow: isActive ? `0 0 8px ${cfg.dot}` : "none",
                }}
            />

            {/* Label */}
            <span className="text-sm font-semibold text-[#1A1A1A] dark:text-[#F0F0F0] flex-shrink-0">
                {cfg.label}
            </span>

            {/* Mini EQ bars */}
            <div className="flex-1 flex items-center justify-end gap-[3px] h-6">
                {MINI_PATTERNS.map((pattern, i) => (
                    <motion.div
                        key={i}
                        className="rounded-full"
                        style={{ width: 3, backgroundColor: cfg.bar }}
                        animate={
                            isActive
                                ? {
                                    height: pattern.map((v) => Math.max(3, 24 * v)),
                                    opacity: 0.85,
                                    transition: {
                                        duration: status === "speaking" ? 0.55 : 1.2,
                                        repeat: Infinity,
                                        ease: "easeInOut",
                                        delay: i * 0.07,
                                    },
                                }
                                : {
                                    height: 3,
                                    opacity: 0.3,
                                    transition: { duration: 0.3 },
                                }
                        }
                    />
                ))}
            </div>

            {/* WS indicator */}
            <div
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{
                    backgroundColor: wsConnected ? "#86E3E3" : "#9CA3AF",
                    opacity: wsConnected ? 1 : 0.4,
                }}
            />
        </div>
    );
}
