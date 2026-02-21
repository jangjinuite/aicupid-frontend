"use client";

import { motion } from "framer-motion";
import { speakingRingVariants } from "@/lib/animations";
import { EQBars } from "./EQBars";
import type { AvatarState, Persona } from "@/types";
import type { VoiceStatus } from "@/hooks/useVoiceCapture";

interface AvatarCoreProps {
    avatarState: AvatarState;
    voiceStatus: VoiceStatus;
    persona: Persona;
}

const RING_COLOR: Record<AvatarState, string> = {
    idle: "rgba(134,227,227,0.15)",
    listening: "rgba(134,227,227,0.5)",
    speaking: "rgba(134,227,227,0.9)",
    thinking: "rgba(230,208,142,0.6)",
};

// Avatar size: responsive via clamp (min 150px, scales with vw, max 210px)
const AVATAR_SIZE = "clamp(150px, 46vw, 210px)";

export function AvatarCore({ avatarState, voiceStatus, persona }: AvatarCoreProps) {
    return (
        <div className="flex flex-col items-center gap-4">
            {/* EQ bars + avatar row */}
            <div className="flex items-center gap-[clamp(0.5rem,2vw,1rem)]">
                {/* Left EQ bars */}
                <EQBars status={voiceStatus} side="left" count={7} />

                {/* Avatar circle */}
                <div className="relative flex items-center justify-center">
                    {/* Pulsing ring */}
                    <motion.div
                        className="absolute"
                        style={{
                            inset: -10,
                            borderRadius: "50%",
                            border: `2.5px solid ${RING_COLOR[avatarState]}`,
                        }}
                        variants={speakingRingVariants}
                        animate={avatarState}
                    />

                    {/* Avatar container — responsive size */}
                    <motion.div
                        layoutId="avatar"
                        style={{
                            width: AVATAR_SIZE,
                            height: AVATAR_SIZE,
                            border: "3px solid #86E3E3",
                            background: "#F0FAFA",
                            borderRadius: "50%",
                            overflow: "hidden",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            position: "relative",
                        }}
                    >
                        {persona.image ? (
                            <img
                                src={persona.image}
                                alt={persona.name}
                                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            />
                        ) : (
                            <span
                                className="select-none"
                                style={{ fontSize: "clamp(3rem, 12vw, 4.5rem)" }}
                            >
                                {persona.emoji}
                            </span>
                        )}
                    </motion.div>
                </div>

                {/* Right EQ bars */}
                <EQBars status={voiceStatus} side="right" count={7} />
            </div>

            {/* Persona name */}
            <p className="font-bold text-[clamp(1rem,4vw,1.25rem)] text-[#1A1A1A] dark:text-[#F0F0F0] tracking-tight">
                {persona.name}
            </p>
        </div>
    );
}
