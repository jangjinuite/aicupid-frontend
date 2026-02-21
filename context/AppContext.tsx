"use client";

import {
    createContext,
    useContext,
    useReducer,
    type ReactNode,
    type Dispatch,
} from "react";
import type { AppPhase, AvatarState, SessionSettings, UserProfile, MatchedUser } from "@/types";
import { PERSONAS } from "@/lib/mockData";

interface AppState {
    phase: AppPhase;
    sessionSettings: SessionSettings;
    userProfile: UserProfile | null;
    matchedUser: MatchedUser | null;
    sessionSummary: string;
    lastSessionId: string | null;
}

type AppAction =
    | { type: "START_TRANSITION" }
    | { type: "SESSION_READY" }
    | { type: "GO_LANDING" }
    | { type: "SET_PERSONA"; payload: string }
    | { type: "SET_AVATAR_STATE"; payload: AvatarState }
    | { type: "SET_USER_PROFILE"; payload: UserProfile }
    | { type: "SET_MATCHED_USER"; payload: MatchedUser }
    | { type: "SET_SESSION_SUMMARY"; payload: string }
    | { type: "SET_LAST_SESSION_ID"; payload: string }
    | { type: "LOGOUT" };

const initialState: AppState = {
    phase: "landing",
    sessionSettings: {
        selectedPersonaId: PERSONAS[0].id,
        avatarState: "idle",
    },
    userProfile: null,
    matchedUser: null,
    sessionSummary: "",
    lastSessionId: null,
};

function appReducer(state: AppState, action: AppAction): AppState {
    switch (action.type) {
        case "START_TRANSITION":
            return { ...state, phase: "transitioning" };
        case "SESSION_READY":
            return { ...state, phase: "session" };
        case "GO_LANDING":
            return {
                ...state,
                phase: "landing",
                sessionSettings: { ...state.sessionSettings, avatarState: "idle" },
            };
        case "SET_PERSONA":
            return {
                ...state,
                sessionSettings: {
                    ...state.sessionSettings,
                    selectedPersonaId: action.payload,
                },
            };
        case "SET_AVATAR_STATE":
            return {
                ...state,
                sessionSettings: {
                    ...state.sessionSettings,
                    avatarState: action.payload,
                },
            };
        case "SET_USER_PROFILE":
            return { ...state, userProfile: action.payload };
        case "SET_MATCHED_USER":
            return { ...state, matchedUser: action.payload };
        case "SET_SESSION_SUMMARY":
            return { ...state, sessionSummary: action.payload };
        case "SET_LAST_SESSION_ID":
            return { ...state, lastSessionId: action.payload };
        case "LOGOUT":
            return { ...initialState };
        default:
            return state;
    }
}

const AppContext = createContext<{
    state: AppState;
    dispatch: Dispatch<AppAction>;
} | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
    const [state, dispatch] = useReducer(appReducer, initialState);
    return (
        <AppContext.Provider value={{ state, dispatch }}>
            {children}
        </AppContext.Provider>
    );
}

export function useAppContext() {
    const ctx = useContext(AppContext);
    if (!ctx) throw new Error("useAppContext must be used within AppProvider");
    return ctx;
}
