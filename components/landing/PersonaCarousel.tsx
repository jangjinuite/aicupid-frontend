"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { slideVariants } from "@/lib/animations";
import type { Persona } from "@/types";

interface PersonaCarouselProps {
    personas: Persona[];
    selectedId: string;
    onSelect: (id: string) => void;
    onStart?: () => void;
}

export function PersonaCarousel({ personas, selectedId, onSelect, onStart }: PersonaCarouselProps) {
    const currentIndex = personas.findIndex((p) => p.id === selectedId);
    const [direction, setDirection] = useState(0);

    const goTo = (index: number, dir: number) => {
        setDirection(dir);
        onSelect(personas[index].id);
    };
    const goPrev = () => goTo((currentIndex - 1 + personas.length) % personas.length, -1);
    const goNext = () => goTo((currentIndex + 1) % personas.length, 1);

    const persona = personas[currentIndex] ?? personas[0];

    return (
        <div className="w-full flex flex-col items-center gap-7">
            {/* Card row */}
            <div className="flex items-center gap-3 w-full">
                {/* Prev */}
                <button
                    onClick={goPrev}
                    className="flex-shrink-0 w-10 h-10 rounded-full border-2 border-primary/30 flex items-center justify-center text-primary hover:border-primary transition-colors"
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>

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
                            className="flex flex-col items-center gap-4"
                        >
                            {/* Avatar */}
                            <motion.div
                                layoutId="avatar"
                                className="w-48 h-48 flex items-center justify-center border-[3px] border-primary overflow-hidden"
                                style={{ background: "#F0FAFA", borderRadius: "50%" }}
                            >
                                {persona.images ? (
                                    <img
                                        src={persona.images.listening}
                                        alt={persona.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <span className="text-5xl select-none">{persona.emoji}</span>
                                )}
                            </motion.div>

                            {/* Name & description */}
                            <div className="text-center">
                                <p className="font-black text-xl text-[#1A1A1A] dark:text-[#F0F0F0] tracking-tight">
                                    {persona.name}
                                </p>
                                <p className="text-sm text-[#1A1A1A]/50 dark:text-white/40 mt-1">
                                    {persona.description}
                                </p>
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Next */}
                <button
                    onClick={goNext}
                    className="flex-shrink-0 w-10 h-10 rounded-full border-2 border-primary/30 flex items-center justify-center text-primary hover:border-primary transition-colors"
                >
                    <ChevronRight className="w-5 h-5" />
                </button>
            </div>

            {/* Dot indicators */}
            <div className="flex items-center gap-2">
                {personas.map((p, i) => (
                    <motion.button
                        key={p.id}
                        onClick={() => goTo(i, i > currentIndex ? 1 : -1)}
                        className="rounded-full"
                        animate={{
                            width: i === currentIndex ? 24 : 8,
                            height: 8,
                            backgroundColor: "#86E3E3",
                            opacity: i === currentIndex ? 1 : 0.25,
                        }}
                        transition={{ duration: 0.2 }}
                    />
                ))}
            </div>

            {/* Start button */}
            <motion.button
                onClick={onStart}
                className="w-full py-4 rounded-2xl font-black text-lg tracking-tight"
                style={{ backgroundColor: "#86E3E3", color: "#0A4040" }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
            >
                시작하기
            </motion.button>
        </div>
    );
}
