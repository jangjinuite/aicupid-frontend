import type { Variants } from "framer-motion";

// Landing → Session transition
export const logoVariants: Variants = {
    center: {
        scale: 1,
        opacity: 1,
        y: 0,
        transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] },
    },
    shrinkOut: {
        scale: 0.1,
        opacity: 0,
        y: -80,
        transition: { duration: 0.6, ease: [0.55, 0, 1, 0.45] },
    },
};

export const micButtonVariants: Variants = {
    visible: {
        opacity: 1,
        y: 0,
        transition: { delay: 0.5, duration: 0.5, ease: "easeOut" },
    },
    hidden: {
        opacity: 0,
        y: 40,
        transition: { duration: 0.3 },
    },
};

// Avatar entrance
export const avatarVariants: Variants = {
    hidden: { scale: 0.5, opacity: 0, y: 80 },
    visible: {
        scale: 1,
        opacity: 1,
        y: 0,
        transition: { type: "spring", stiffness: 180, damping: 22, delay: 0.15 },
    },
    exit: { scale: 0.5, opacity: 0, y: -80 },
};

// Pulsing ring for different avatar states
export const speakingRingVariants: Variants = {
    idle: { scale: 1, opacity: 0.2 },
    speaking: {
        scale: [1, 1.18, 1],
        opacity: [0.5, 0.9, 0.5],
        transition: { duration: 1.2, repeat: Infinity, ease: "easeInOut" },
    },
    listening: {
        scale: [1, 1.08, 1],
        opacity: [0.2, 0.6, 0.2],
        transition: { duration: 0.9, repeat: Infinity, ease: "easeInOut" },
    },
    thinking: {
        scale: [1, 1.05, 1.1, 1.05, 1],
        opacity: [0.3, 0.5, 0.3, 0.5, 0.3],
        transition: { duration: 2, repeat: Infinity, ease: "easeInOut" },
    },
};

// Session panel entrance
export const sessionPanelVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
        opacity: 1,
        y: 0,
        transition: { delay: 0.4 + i * 0.1, duration: 0.5, ease: "easeOut" },
    }),
};
