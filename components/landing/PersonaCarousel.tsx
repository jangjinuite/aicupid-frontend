"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Persona } from "@/types";

interface PersonaCarouselProps {
    personas: Persona[];
    selectedId: string;
    onSelect: (id: string) => void;
    onStart?: () => void;
}

export function PersonaCarousel({
    personas,
    selectedId,
    onSelect,
    onStart,
}: PersonaCarouselProps) {
    const currentIndex = personas.findIndex((p) => p.id === selectedId);
    const [direction, setDirection] = useState(0);

    const goTo = (index: number, dir: number) => {
        setDirection(dir);
        onSelect(personas[index].id);
    };

    const goPrev = () => {
        const prevIndex = (currentIndex - 1 + personas.length) % personas.length;
        goTo(prevIndex, -1);
    };

    const goNext = () => {
        const nextIndex = (currentIndex + 1) % personas.length;
        goTo(nextIndex, 1);
    };

    const slideVariants = {
        enter: (dir: number) => ({ x: dir > 0 ? 50 : -50, opacity: 0 }),
        center: { x: 0, opacity: 1 },
        exit: (dir: number) => ({ x: dir > 0 ? -50 : 50, opacity: 0 }),
    };

    const persona = personas[currentIndex] ?? personas[0];

    return (
        <div className="w-full max-w-xs flex flex-col items-center gap-8">
            <div className="flex items-center gap-4 w-full">
                {/* Left arrow */}
                <motion.button
                    onClick={goPrev}
                    className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center border border-white/10 text-white/30 hover:text-white/60 hover:border-white/25 transition-colors"
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.92 }}
                >
                    <ChevronLeft className="w-4 h-4" />
                </motion.button>

                {/* Persona card */}
                <div className="flex-1 overflow-hidden">
                    <AnimatePresence mode="wait" custom={direction}>
                        <motion.div
                            key={persona.id}
                            custom={direction}
                            variants={slideVariants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{ duration: 0.2, ease: "easeOut" }}
                            className="flex flex-col items-center gap-4 cursor-pointer"
                            onClick={() => onStart?.()}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <motion.div
                                className="w-28 h-28 rounded-full flex items-center justify-center border border-white/15"
                                style={{ background: "rgba(255,255,255,0.04)" }}
                                whileHover={{
                                    borderColor: "rgba(255,255,255,0.25)",
                                    boxShadow: "0 0 30px rgba(255,255,255,0.1)",
                                }}
                                transition={{ duration: 0.2 }}
                            >
                                <span className="text-5xl select-none">{persona.emoji}</span>
                            </motion.div>

                            <div className="text-center">
                                <p className="text-white/80 font-medium text-lg">{persona.name}</p>
                                <p className="text-white/35 text-sm mt-1">{persona.description}</p>
                            </div>

                            <motion.p
                                className="text-white/25 text-xs tracking-widest uppercase"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.3 }}
                            >
                                탭하여 시작
                            </motion.p>
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Right arrow */}
                <motion.button
                    onClick={goNext}
                    className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center border border-white/10 text-white/30 hover:text-white/60 hover:border-white/25 transition-colors"
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.92 }}
                >
                    <ChevronRight className="w-4 h-4" />
                </motion.button>
            </div>

            {/* Dot indicators */}
            <div className="flex items-center gap-2">
                {personas.map((p, i) => (
                    <motion.button
                        key={p.id}
                        onClick={() => goTo(i, i > currentIndex ? 1 : -1)}
                        className="rounded-full"
                        animate={{
                            width: i === currentIndex ? 20 : 6,
                            height: 6,
                            backgroundColor:
                                i === currentIndex
                                    ? "rgba(255,255,255,0.65)"
                                    : "rgba(255,255,255,0.15)",
                        }}
                        transition={{ duration: 0.2 }}
                    />
                ))}
            </div>
        </div>
    );
}
