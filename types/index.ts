// App-level phase machine
export type AppPhase = "landing" | "transitioning" | "session";

// User profile collected at registration
export interface UserProfile {
    userId: string;
    name: string;
    gender: "male" | "female";
    age: number;
    interests: string[];
    mbti: string;
    bio: string;
    profileImage?: string; // base64 data URL
}

// Avatar animation state machine
export type AvatarState = "idle" | "listening" | "speaking" | "thinking";

// Mood system
export type Mood = "neutral" | "happy" | "hype" | "serious" | "dramatic";

// AI Persona definition
export interface Persona {
    id: string;
    name: string;
    description: string;
    accentColor: string;
    avatarGradient: string;
    emoji: string;
    images: {
        listening: string;
        thinking: string;
        speaking: string;
    };
}

// Game event (퀴즈 / 심리테스트 / 밸런스 게임) — 스펙 확정 후 상세 타입 추가
export interface GameEvent {
    type: "quiz" | "psych" | "balance";
    questionId?: string; // for quiz
    question: string;
    choices: string[];
    loading?: boolean; // true while API response is pending
    // for balance game sequence
    questions?: {
        text: string;
        options: string[];
        audio?: string;
        mime_type?: string;
    }[];
}

// Session settings
export interface SessionSettings {
    selectedPersonaId: string;
    avatarState: AvatarState;
}

// Matched partner (소개팅 상대)
export interface MatchedUser {
    userId: string;
    name: string;
    age: number;
    gender: "male" | "female";
    mbti: string;
    interests: string[];
    bio: string;
    profileImage?: string;
}
