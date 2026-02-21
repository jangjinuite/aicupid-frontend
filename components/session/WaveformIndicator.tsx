"use client";

import { motion } from "framer-motion";
import type { Easing } from "framer-motion";
import type { AvatarState } from "@/types";

interface WaveformIndicatorProps {
    avatarState: AvatarState;
    barCount?: number;
}

const EASE: Easing = "easeInOut";

export function WaveformIndicator({ avatarState, barCount = 16 }: WaveformIndicatorProps) {
    const isActive = avatarState === "listening" || avatarState === "speaking";
    const duration = avatarState === "speaking" ? 0.8 : 1.2;

    return (
        <div className="flex items-end justify-center gap-1 h-10">
            {Array.from({ length: barCount }, (_, i) => (
                <motion.div
                    key={i}
                    className="w-1 rounded-full"
                    style={{
                        height: "100%",
                        transformOrigin: "bottom",
                        backgroundColor: "rgba(255,255,255,0.65)",
                        opacity: isActive ? 1 : 0.2,
                    }}
                    animate={
                        isActive
                            ? {
                                scaleY: [0.2, 0.8, 0.3, 1, 0.4, 0.9, 0.2],
                                transition: {
                                    duration,
                                    repeat: Infinity,
                                    ease: EASE,
                                    delay: i * 0.06,
                                },
                            }
                            : { scaleY: 0.1, transition: { duration: 0.4 } }
                    }
                />
            ))}
        </div>
    );
}
