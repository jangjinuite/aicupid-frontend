import type { Persona, Mood } from "@/types";

export const PERSONAS: Persona[] = [
    {
        id: "hypebot",
        name: "HypeBot",
        description: "High-energy party host",
        accentColor: "rgba(255,255,255,0.70)",
        avatarGradient: "linear-gradient(135deg, #1c1c1c, #2a2a2a)",
        emoji: "🔥",
    },
    {
        id: "oracle",
        name: "The Oracle",
        description: "Calm, philosophical MC",
        accentColor: "rgba(255,255,255,0.65)",
        avatarGradient: "linear-gradient(135deg, #181818, #242424)",
        emoji: "🔮",
    },
    {
        id: "roastmaster",
        name: "Roastmaster",
        description: "Edgy, comedic host",
        accentColor: "rgba(255,255,255,0.60)",
        avatarGradient: "linear-gradient(135deg, #1a1a1a, #222222)",
        emoji: "😈",
    },
    {
        id: "narrator",
        name: "The Narrator",
        description: "Dramatic storyteller",
        accentColor: "rgba(255,255,255,0.55)",
        avatarGradient: "linear-gradient(135deg, #161616, #202020)",
        emoji: "📖",
    },
];

export const MOOD_LABELS: Record<Mood, string> = {
    neutral: "Neutral",
    happy: "Happy 😊",
    hype: "HYPE 🔥",
    serious: "Serious 🎯",
    dramatic: "Dramatic 🎭",
};

export const MOOD_COLORS: Record<Mood, string> = {
    neutral: "#6b7280",
    happy: "#22c55e",
    hype: "#a855f7",
    serious: "#3b82f6",
    dramatic: "#ef4444",
};
