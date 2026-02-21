"use client";

import { motion } from "framer-motion";
import type { VoiceStatus } from "@/hooks/useVoiceCapture";

interface EQBarsProps {
    status: VoiceStatus;
    side: "left" | "right";
    count?: number;
}

// Predefined scaleY keyframe patterns (one per bar)
const PATTERNS = [
    [0.08, 1.0, 0.25, 0.75, 0.12, 0.9, 0.3],
    [0.3, 0.55, 0.95, 0.2, 0.8, 0.35, 0.7],
    [0.5, 0.15, 0.85, 0.4, 0.95, 0.25, 0.6],
    [0.15, 0.7, 0.3, 1.0, 0.4, 0.8, 0.18],
    [0.6, 0.2, 0.9, 0.35, 0.7, 0.15, 0.85],
    [0.25, 0.9, 0.45, 0.7, 0.2, 0.95, 0.4],
    [0.8, 0.3, 0.6, 0.15, 0.85, 0.3, 0.65],
    [0.1, 0.75, 0.4, 0.9, 0.25, 0.7, 0.1],
];

// Max px heights tapering away from avatar
const HEIGHTS_NEAR_TO_FAR = [48, 44, 38, 32, 26, 20, 14, 10];

export function EQBars({ status, side, count = 8 }: EQBarsProps) {
    const isUserSpeaking = status === "speaking";
    const isListening = status === "listening";

    // Near-to-far heights → reverse so bars closest to avatar are tallest
    const heights = HEIGHTS_NEAR_TO_FAR.slice(0, count);
    // For right side: near bar comes first; for left side: far bar comes first (visual order)
    const orderedHeights = side === "left" ? [...heights].reverse() : heights;

    return (
        <div
            className="flex items-center gap-[3px]"
            style={{ flexDirection: side === "left" ? "row-reverse" : "row" }}
        >
            {orderedHeights.map((maxH, i) => {
                const pattern = PATTERNS[i % PATTERNS.length];
                const barIdx = side === "left" ? (count - 1 - i) : i;
                const delay = barIdx * 0.055;

                return (
                    <motion.div
                        key={i}
                        className="rounded-full"
                        style={{
                            width: 3,
                            backgroundColor: "#86E3E3",
                            transformOrigin: "center",
                        }}
                        animate={
                            isUserSpeaking
                                ? {
                                    height: pattern.map((v) => Math.max(4, maxH * v)),
                                    opacity: 0.9,
                                    transition: {
                                        duration: 0.65 + barIdx * 0.04,
                                        repeat: Infinity,
                                        ease: "easeInOut",
                                        delay,
                                    },
                                }
                                : isListening
                                ? {
                                    height: [4, maxH * 0.12, 4],
                                    opacity: 0.45,
                                    transition: {
                                        duration: 1.8,
                                        repeat: Infinity,
                                        ease: "easeInOut",
                                        delay: delay * 0.5,
                                    },
                                }
                                : {
                                    height: 3,
                                    opacity: 0.18,
                                    transition: { duration: 0.3 },
                                }
                        }
                    />
                );
            })}
        </div>
    );
}
