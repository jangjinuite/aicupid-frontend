"use client";

import {
    createContext,
    useContext,
    useReducer,
    type ReactNode,
    type Dispatch,
} from "react";
import type { AppPhase, AvatarState, SessionSettings } from "@/types";
import { PERSONAS } from "@/lib/mockData";

interface AppState {
    phase: AppPhase;
    sessionSettings: SessionSettings;
}

type AppAction =
    | { type: "START_TRANSITION" }
    | { type: "SESSION_READY" }
    | { type: "GO_LANDING" }
    | { type: "SET_PERSONA"; payload: string }
    | { type: "SET_AVATAR_STATE"; payload: AvatarState };

const initialState: AppState = {
    phase: "landing",
    sessionSettings: {
        selectedPersonaId: PERSONAS[0].id,
        avatarState: "idle",
    },
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
