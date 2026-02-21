"use client";

import { useState, useEffect } from "react";

import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAppContext } from "@/context/AppContext";
import { ActionModal } from "@/components/shared/ActionModal";
import type { MatchedUser, UserProfile } from "@/types";
import { useAudioQueue } from "@/hooks/useAudioQueue";

// ── Mini profile card ─────────────────────────────────────────────
function MiniProfile({ user, label }: { user: UserProfile | MatchedUser; label: string }) {
    const profileImage = "profileImage" in user ? user.profileImage : undefined;
    return (
        <div className="flex flex-col items-center gap-2">
            <div
                className="w-16 h-16 rounded-full overflow-hidden flex items-center justify-center"
                style={{ backgroundColor: "#F0FAFA", border: "2.5px solid #86E3E3" }}
            >
                {profileImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={profileImage} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                    <span className="text-2xl">
                        {"gender" in user && user.gender === "female" ? "👩" : "👨"}
                    </span>
                )}
            </div>
            <div className="text-center">
                <p className="font-black text-sm text-[#1A1A1A] dark:text-[#F0F0F0]">{user.name}</p>
                <p className="text-xs text-[#1A1A1A]/40 dark:text-white/30">{user.mbti}</p>
            </div>
            <span
                className="text-xs font-bold px-2.5 py-1 rounded-full"
                style={{ backgroundColor: "#F5E9BB", color: "#4A3800" }}
            >
                {label}
            </span>
        </div>
    );
}

// ── Main component ────────────────────────────────────────────────
export function SummaryScreen() {
    const router = useRouter();
    const { state, dispatch } = useAppContext();
    const { userProfile, matchedUser, sessionSummary, lastSessionId } = state;

    const { playResponse, close: closeAudio } = useAudioQueue();
    const [actionMessage, setActionMessage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [chemistryIndex, setChemistryIndex] = useState<number>(75);

    useEffect(() => {
        if (!lastSessionId) {
            setIsLoading(false);
            return;
        }

        const fetchSummary = async () => {
            try {
                const res = await fetch("https://aicupid-backend-production.up.railway.app/api/chemistry-result", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ session_id: lastSessionId }),
                });
                if (!res.ok) throw new Error("API call failed");
                const data = await res.json();

                if (data.summary) {
                    dispatch({ type: "SET_SESSION_SUMMARY", payload: data.summary });
                }
                setChemistryIndex(data.chemistry_index ?? 75);

                if (data.audio) {
                    playResponse(data.audio, data.mime_type || "audio/wav");
                }
            } catch (e) {
                console.error(e);
            } finally {
                setIsLoading(false);
            }
        };

        fetchSummary();

        return () => {
            closeAudio();
        };
    }, [lastSessionId, dispatch, playResponse, closeAudio]);

    const handleFriendOnly = () => {
        setActionMessage("친구 제안을 보냈습니다!");
    };

    const handleAfter = () => {
        setActionMessage("애프터 신청을 보냈습니다!");
    };

    const confirmAction = () => {
        setActionMessage(null);
        resetAndGoHome();
    };

    const resetAndGoHome = () => {
        dispatch({ type: "SET_SESSION_SUMMARY", payload: "" });
        dispatch({ type: "GO_LANDING" });
        router.push("/");
    };

    // Fallback summary text (실제 구현 시 AI 생성 텍스트로 교체)
    const summaryText = sessionSummary || generateMockSummary(userProfile, matchedUser);

    return (
        <div
            className="relative flex flex-col bg-white dark:bg-dark-bg overflow-hidden mx-auto w-full"
            style={{ height: "100dvh", maxWidth: 430 }}
        >
            {/* Header */}
            <div
                className="shrink-0 flex items-center justify-between px-5"
                style={{ paddingTop: "max(2.5rem, env(safe-area-inset-top, 2.5rem))", paddingBottom: "1rem" }}
            >
                <span
                    className="text-xs font-bold tracking-widest uppercase"
                    style={{ color: "#86E3E3" }}
                >
                    AI CUPID
                </span>
                <span className="font-black text-base text-[#1A1A1A] dark:text-[#F0F0F0] tracking-tight">
                    오늘의 소개팅 요약
                </span>
                <div className="w-16" />
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto px-5 flex flex-col gap-5 pb-4">

                {/* Two profiles */}
                {userProfile && matchedUser && (
                    <div
                        className="w-full flex items-center justify-around py-5 px-4 rounded-3xl"
                        style={{ backgroundColor: "#F6FAFA", border: "1.5px solid #B8F0F0" }}
                    >
                        <MiniProfile user={userProfile} label="나" />
                        <div className="flex flex-col items-center gap-1">
                            <span className="text-2xl">💕</span>
                            <span className="text-xs font-bold text-primary">VS</span>
                        </div>
                        <MiniProfile user={matchedUser} label="상대" />
                    </div>
                )}

                {/* Summary label */}
                <div>
                    <p className="text-xs font-bold tracking-widest uppercase mb-2" style={{ color: "#86E3E3" }}>요약</p>
                </div>

                {/* Summary card */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="w-full rounded-3xl p-5 overflow-hidden flex flex-col items-center justify-center"
                    style={{
                        backgroundColor: "#F6FAFA",
                        border: "1.5px solid #B8F0F0",
                        minHeight: 200,
                    }}
                >
                    {isLoading ? (
                        <div className="flex flex-col items-center gap-2 text-[#1A1A1A]/40 dark:text-white/30">
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                                className="w-8 h-8 rounded-full border-4 border-t-transparent border-[#86E3E3]"
                            />
                            <span className="text-sm font-bold">결과 분석 중...</span>
                        </div>
                    ) : (
                        <p className="text-sm font-medium text-[#1A1A1A] dark:text-[#F0F0F0] leading-relaxed whitespace-pre-line break-words w-full text-left">
                            {summaryText}
                        </p>
                    )}
                </motion.div>

                {/* Compatibility badge */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                    className="flex items-center justify-center gap-3 py-4 rounded-3xl"
                    style={{ backgroundColor: "#FDCFF7", border: "1.5px solid #FAA2EE" }}
                >
                    <span className="text-2xl">💘</span>
                    <div className="text-center">
                        <p className="font-black text-base text-[#4A0A40]">큐피드 케미 지수</p>
                        <p className="font-black text-3xl text-[#FAA2EE]">
                            {isLoading ? "..." : chemistryIndex}%
                        </p>
                    </div>
                    <span className="text-2xl">💘</span>
                </motion.div>
            </div>

            {/* Action buttons */}
            <div
                className="shrink-0 px-5 pt-3"
                style={{ paddingBottom: "max(2rem, env(safe-area-inset-bottom, 2rem))" }}
            >
                <div className="grid grid-cols-2 gap-3">
                    <motion.button
                        onClick={handleFriendOnly}
                        className="py-4 rounded-2xl font-black text-sm leading-tight"
                        style={{
                            backgroundColor: "transparent",
                            color: "#86E3E3",
                            border: "2.5px solid #86E3E3",
                        }}
                        whileTap={{ scale: 0.97 }}
                    >
                        친구만 하자고<br />제안하기
                    </motion.button>
                    <motion.button
                        onClick={handleAfter}
                        className="py-4 rounded-2xl font-black text-sm leading-tight"
                        style={{ backgroundColor: "#FAA2EE", color: "#4A0A40" }}
                        whileTap={{ scale: 0.97 }}
                    >
                        애프터<br />신청하기
                    </motion.button>
                </div>
            </div>

            {/* Action Popup */}
            <AnimatePresence>
                {actionMessage && (
                    <ActionModal
                        title={actionMessage}
                        onConfirmText="확인"
                        onConfirm={confirmAction}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

// ── Mock helpers (실제 구현 시 AI API로 교체) ─────────────────────
function generateMockSummary(
    me: UserProfile | null,
    partner: MatchedUser | null
): string {
    if (!me || !partner) {
        return "오늘의 소개팅 대화 요약이 여기에 표시됩니다.\n\nAI 큐피드가 두 분의 대화를 분석해서 공통 관심사, 대화 스타일, 케미 포인트를 정리해 드립니다.";
    }

    const commonInterests = me.interests.filter(i => partner.interests.includes(i));
    const commonStr = commonInterests.length > 0
        ? `공통 관심사: ${commonInterests.join(", ")}`
        : "서로 다른 취향을 가졌지만 흥미로운 대화를 나눴어요!";

    return `${me.name}님과 ${partner.name}님의 오늘 소개팅 요약입니다.\n\n${commonStr}\n\n${me.name}님(${me.mbti})과 ${partner.name}님(${partner.mbti})은 서로의 다른 매력에 끌렸어요. 대화를 통해 서로의 일상과 가치관을 나눴고, AI 큐피드가 두 분의 케미를 분석했습니다.\n\n💡 오늘 인상적이었던 순간들이 아래 버튼을 통해 상대에게 전달됩니다.`;
}

function mockCompatibility(
    me: UserProfile | null,
    partner: MatchedUser | null
): number {
    if (!me || !partner) return 75;
    const common = me.interests.filter(i => partner.interests.includes(i)).length;
    const base = 60 + common * 8;
    return Math.min(99, base);
}
