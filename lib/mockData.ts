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
        id: "daguri",
        name: "다구리",
        description: "귀여운 햄스터 외모 속에 숨겨진 뼈 때리는 팩트폭격기",
        accentColor: "rgba(255,160,122,0.70)",
        avatarGradient: "linear-gradient(135deg, #FFEFD5, #FFA07A)",
        emoji: "🐹",
        image: "/assets/daguri.jpeg",
    },
    {
        id: "rudumi",
        name: "루두미",
        description: "차분하고 지적인 분위기를 풍기는 다정한 여우 마스터",
        accentColor: "rgba(135,206,250,0.65)",
        avatarGradient: "linear-gradient(135deg, #F0F8FF, #87CEFA)",
        emoji: "🦊",
        image: "/assets/rudumi.png",
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
