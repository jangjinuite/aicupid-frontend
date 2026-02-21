"use client";

import { motion } from "framer-motion";
import { Mic } from "lucide-react";
import { micButtonVariants } from "@/lib/animations";

interface MicButtonProps {
    onClick: () => void;
    isTransitioning: boolean;
}

export function MicButton({ onClick, isTransitioning }: MicButtonProps) {
    return (
        <motion.div
            className="flex flex-col items-center gap-4"
            variants={micButtonVariants}
            animate={isTransitioning ? "hidden" : "visible"}
            initial="visible"
        >
            <div className="relative">
                {/* Outer ping ring */}
                <div
                    className="absolute inset-0 rounded-full animate-ping-slow"
                    style={{
                        background: "rgba(255,255,255,0.06)",
                        transform: "scale(1.6)",
                    }}
                />
                {/* Middle pulse ring */}
                <div
                    className="absolute inset-0 rounded-full animate-pulse-slow"
                    style={{
                        background: "rgba(255,255,255,0.04)",
                        transform: "scale(1.3)",
                    }}
                />
                {/* Main button */}
                <motion.button
                    onClick={onClick}
                    disabled={isTransitioning}
                    className="relative z-10 w-20 h-20 rounded-full flex items-center justify-center cursor-pointer disabled:cursor-not-allowed border border-white/20"
                    style={{
                        background: "#1a1a1a",
                        boxShadow:
                            "0 0 28px rgba(255,255,255,0.08), inset 0 1px 0 rgba(255,255,255,0.10)",
                    }}
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.94 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                >
                    <Mic className="w-8 h-8 text-white/70" strokeWidth={2} />
                </motion.button>
            </div>
            <p className="text-white/25 text-xs tracking-widest uppercase">
                탭하여 시작
            </p>
        </motion.div>
    );
}
