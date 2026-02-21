// App-level phase machine
export type AppPhase = "landing" | "transitioning" | "session";

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
}

// Game event (퀴즈 / 심리테스트 / 밸런스 게임) — 스펙 확정 후 상세 타입 추가
export interface GameEvent {
    type: "quiz" | "psych" | "balance";
    question: string;
    choices: string[];
}

// Session settings
export interface SessionSettings {
    selectedPersonaId: string;
    avatarState: AvatarState;
}
