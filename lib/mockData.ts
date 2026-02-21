import type { Persona, Mood, MatchedUser } from "@/types";

// ── Mock users for partner search (DB 연동 전 목업) ───────────────
export const MOCK_USERS: MatchedUser[] = [
    {
        userId: "jisoo123",
        name: "이지수",
        age: 24,
        gender: "female",
        mbti: "ENFP",
        interests: ["영화", "음악", "여행"],
        bio: "안녕하세요! 영화 좋아하는 이지수입니다 :)",
    },
    {
        userId: "minho456",
        name: "박민호",
        age: 27,
        gender: "male",
        mbti: "INTJ",
        interests: ["독서", "게임", "아웃도어"],
        bio: "독서와 게임을 즐기는 박민호입니다.",
    },
    {
        userId: "yuna789",
        name: "김유나",
        age: 25,
        gender: "female",
        mbti: "ISFJ",
        interests: ["요리", "영화", "패션"],
        bio: "요리하는 걸 좋아해요!",
    },
    {
        userId: "junho001",
        name: "최준호",
        age: 26,
        gender: "male",
        mbti: "ESTP",
        interests: ["스포츠", "여행", "음악"],
        bio: "스포츠와 여행을 즐기는 최준호입니다.",
    },
    {
        userId: "somin002",
        name: "박소민",
        age: 23,
        gender: "female",
        mbti: "INFP",
        interests: ["독서", "음악", "영화"],
        bio: "감성적인 박소민입니다 ✨",
    },
    {
        userId: "taehyun003",
        name: "김태현",
        age: 28,
        gender: "male",
        mbti: "ENTJ",
        interests: ["스포츠", "게임", "요리"],
        bio: "열정적인 김태현입니다!",
    },
];

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
