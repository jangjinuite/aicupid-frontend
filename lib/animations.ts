import type { Variants } from "framer-motion";

// Avatar entrance
export const avatarVariants: Variants = {
    hidden: { scale: 0.85, opacity: 0, y: 30 },
    visible: {
        scale: 1,
        opacity: 1,
        y: 0,
        transition: { type: "spring", stiffness: 200, damping: 24, delay: 0.1 },
    },
    exit: { scale: 0.85, opacity: 0, y: -30 },
};

// Avatar ring pulse per state
export const speakingRingVariants: Variants = {
    idle: { scale: 1, opacity: 0 },
    speaking: {
        scale: [1, 1.12, 1],
        opacity: [0.6, 1, 0.6],
        transition: { duration: 0.9, repeat: Infinity, ease: "easeInOut" },
    },
    listening: {
        scale: [1, 1.06, 1],
        opacity: [0.3, 0.7, 0.3],
        transition: { duration: 1.1, repeat: Infinity, ease: "easeInOut" },
    },
    thinking: {
        scale: [1, 1.04, 1.08, 1.04, 1],
        opacity: [0.2, 0.4, 0.2, 0.4, 0.2],
        transition: { duration: 2.2, repeat: Infinity, ease: "easeInOut" },
    },
};

// Backdrop fade (wrapper around modals)
export const popupVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.18 } },
    exit: { opacity: 0, transition: { duration: 0.14 } },
};

// Center modal card scale-in
export const modalCardVariants: Variants = {
    hidden: { scale: 0.88, opacity: 0, y: 12 },
    visible: {
        scale: 1,
        opacity: 1,
        y: 0,
        transition: { type: "spring", stiffness: 340, damping: 28 },
    },
    exit: {
        scale: 0.88,
        opacity: 0,
        y: 12,
        transition: { duration: 0.14, ease: "easeIn" },
    },
};

// Persona card slide
export const slideVariants: Variants = {
    enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
};

// Screen fade
export const fadeVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.25 } },
    exit: { opacity: 0, transition: { duration: 0.2 } },
};
