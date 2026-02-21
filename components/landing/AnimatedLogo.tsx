"use client";

import { motion } from "framer-motion";
import { logoVariants } from "@/lib/animations";
import type { AppPhase } from "@/types";

interface AnimatedLogoProps {
    phase: AppPhase;
}

export function AnimatedLogo({ phase }: AnimatedLogoProps) {
    return (
        <motion.div
            className="relative flex flex-col items-center gap-5"
            variants={logoVariants}
            animate={phase === "transitioning" ? "shrinkOut" : "center"}
            initial="center"
        >
            <div className="relative">
                <div className="relative w-32 h-32 rounded-full flex items-center justify-center">
                    {/* Rotating conic border */}
                    <div className="absolute inset-0 rounded-full overflow-hidden">
                        <div
                            className="absolute inset-[-2px] rounded-full animate-spin-slow"
                            style={{
                                background:
                                    "conic-gradient(from 0deg, transparent 0%, rgba(255,255,255,0.12) 25%, rgba(255,255,255,0.45) 50%, rgba(255,255,255,0.65) 65%, rgba(255,255,255,0.20) 75%, transparent 100%)",
                            }}
                        />
                        <div
                            className="absolute inset-[2px] rounded-full"
                            style={{ background: "#080808" }}
                        />
                    </div>
                    {/* Logo text */}
                    <span
                        className="relative z-10 text-3xl font-bold tracking-widest text-white/85"
                        style={{ fontFamily: "Space Grotesk, system-ui, sans-serif" }}
                    >
                        MC
                    </span>
                </div>
            </div>
            {/* Title */}
            <div className="text-center">
                <h1
                    className="text-4xl font-bold tracking-tight text-white/85"
                    style={{ fontFamily: "Space Grotesk, system-ui, sans-serif" }}
                >
                    AI MC
                </h1>
                <p className="text-white/30 text-xs mt-1.5 tracking-widest uppercase">
                    AI 기반 사회자
                </p>
            </div>
        </motion.div>
    );
}
