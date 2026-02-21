"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Search, X, ChevronLeft } from "lucide-react";
import { useAppContext } from "@/context/AppContext";
import { ProfileEditModal } from "@/components/profile/ProfileEditModal";
import type { MatchedUser } from "@/types";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000";

// ── User list row ─────────────────────────────────────────────────
function UserRow({
    user,
    selected,
    onClick,
}: {
    user: MatchedUser;
    selected: boolean;
    onClick: () => void;
}) {
    return (
        <motion.button
            onClick={onClick}
            className="w-full flex items-center justify-between px-5 py-4 rounded-2xl transition-all text-left"
            style={{
                backgroundColor: selected ? "#B8F0F0" : "#F6FAFA",
                border: "2px solid",
                borderColor: selected ? "#86E3E3" : "transparent",
            }}
            whileTap={{ scale: 0.98 }}
        >
            <span className="font-black text-base text-[#1A1A1A] dark:text-[#F0F0F0]">
                {user.userId}
            </span>
            {selected && (
                <div
                    className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                    style={{ backgroundColor: "#86E3E3" }}
                >
                    <span className="text-xs text-white font-black">✓</span>
                </div>
            )}
        </motion.button>
    );
}

// ── Confirm card ──────────────────────────────────────────────────
function ConfirmCard({ user }: { user: MatchedUser }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full flex items-center px-5 py-5 rounded-3xl"
            style={{
                backgroundColor: "#B8F0F0",
                border: "2px solid #86E3E3",
            }}
        >
            <span className="font-black text-xl text-[#0A4040]">{user.userId}</span>
        </motion.div>
    );
}

// ── Main component ────────────────────────────────────────────────
export function MatchScreen() {
    const router = useRouter();
    const { state, dispatch } = useAppContext();

    const [query, setQuery] = useState("");
    const [selected, setSelected] = useState<MatchedUser | null>(null);
    const [confirming, setConfirming] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [results, setResults] = useState<MatchedUser[]>([]);
    const [searching, setSearching] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(async () => {
            setSearching(true);
            try {
                const token = localStorage.getItem("access_token");
                const params = new URLSearchParams({ skip: "0", limit: "15" });
                if (query.trim()) params.set("userId", query.trim());
                const res = await fetch(`${BACKEND_URL}/api/users/search?${params}`, {
                    headers: token ? { Authorization: `Bearer ${token}` } : {},
                });
                if (!res.ok) throw new Error();
                const data = await res.json();
                setResults(
                    (data.users ?? []).map((u: any) => ({
                        userId: u.userId,
                        name: u.name ?? u.userId,
                        age: u.age ?? 0,
                        gender: u.gender ?? "male",
                        mbti: u.mbti ?? "",
                        interests: u.interests ?? [],
                        bio: "",
                        profileImage: u.profileImage,
                    }))
                );
            } catch {
                setResults([]);
            } finally {
                setSearching(false);
            }
        }, 300);
        return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    }, [query]);

    const handleSelect = (user: MatchedUser) => {
        if (selected?.userId === user.userId) {
            setSelected(null);
            setConfirming(false);
        } else {
            setSelected(user);
            setConfirming(true);
        }
    };

    const handleCancel = () => {
        setSelected(null);
        setConfirming(false);
    };

    const handleConfirm = async () => {
        if (!selected) return;
        // 1) 클라이언트 state에 저장
        dispatch({ type: "SET_MATCHED_USER", payload: selected });
        // 2) 백엔드에 파트너 userId 전달
        try {
            await fetch(`${BACKEND_URL}/session/partner`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ partner_user_id: selected.userId }),
            });
        } catch (e) {
            console.warn("[MatchScreen] 파트너 정보 전달 실패", e);
        }
        router.push("/");
    };

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
                <motion.button
                    onClick={() => router.push("/login")}
                    className="flex items-center gap-1 text-sm font-semibold text-primary"
                    whileTap={{ scale: 0.92 }}
                >
                    <ChevronLeft className="w-4 h-4" />
                    뒤로
                </motion.button>
                <span className="font-black text-base text-[#1A1A1A] dark:text-[#F0F0F0] tracking-tight">
                    AI CUPID
                </span>
                <div className="w-14" />
            </div>

            {/* Title */}
            <div className="shrink-0 px-5 pb-4">
                <h1 className="font-black text-2xl text-[#1A1A1A] dark:text-[#F0F0F0] leading-tight">
                    미팅하는 사람을<br />선택하세요.
                </h1>
            </div>

            {/* Confirm state — selected user card */}
            <AnimatePresence>
                {confirming && selected && (
                    <div className="shrink-0 px-5 pb-4">
                        <ConfirmCard user={selected} />
                    </div>
                )}
            </AnimatePresence>

            {/* Search input */}
            {!confirming && (
                <div className="shrink-0 px-5 pb-4">
                    <p className="text-sm font-bold text-[#1A1A1A] dark:text-[#F0F0F0] mb-2">아이디 검색</p>
                    <div className="relative">
                        <Search
                            className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4"
                            style={{ color: "#86E3E3" }}
                        />
                        <input
                            type="text"
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            placeholder="아이디로 검색"
                            className="w-full pl-10 pr-10 py-4 rounded-2xl text-base font-semibold outline-none bg-[#F6FAFA] dark:bg-[#2C2C2E] text-[#1A1A1A] dark:text-[#F0F0F0] placeholder:text-[#1A1A1A]/30 dark:placeholder:text-white/25"
                            style={{
                                border: "2px solid",
                                borderColor: query ? "#86E3E3" : "transparent",
                            }}
                        />
                        {query && (
                            <button
                                onClick={() => setQuery("")}
                                className="absolute right-4 top-1/2 -translate-y-1/2"
                            >
                                <X className="w-4 h-4 text-[#1A1A1A]/40 dark:text-white/30" />
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* User list */}
            {!confirming && (
                <div className="flex-1 overflow-y-auto px-5 flex flex-col gap-2 pb-4">
                    {searching ? (
                        <p className="text-center text-sm text-[#1A1A1A]/40 dark:text-white/30 py-10">
                            검색 중...
                        </p>
                    ) : results.length === 0 ? (
                        <p className="text-center text-sm text-[#1A1A1A]/40 dark:text-white/30 py-10">
                            검색 결과가 없습니다
                        </p>
                    ) : (
                        results.map(user => (
                            <UserRow
                                key={user.userId}
                                user={user}
                                selected={selected?.userId === user.userId}
                                onClick={() => handleSelect(user)}
                            />
                        ))
                    )}
                </div>
            )}

            {confirming && <div className="flex-1" />}

            {/* Bottom buttons */}
            <div
                className="shrink-0 px-5 pt-3"
                style={{ paddingBottom: "max(2rem, env(safe-area-inset-bottom, 2rem))" }}
            >
                {confirming ? (
                    <div className="grid grid-cols-2 gap-3">
                        <motion.button
                            onClick={handleCancel}
                            className="py-4 rounded-2xl font-black text-base"
                            style={{
                                backgroundColor: "transparent",
                                color: "#86E3E3",
                                border: "2.5px solid #86E3E3",
                            }}
                            whileTap={{ scale: 0.97 }}
                        >
                            취소
                        </motion.button>
                        <motion.button
                            onClick={handleConfirm}
                            className="py-4 rounded-2xl font-black text-base"
                            style={{ backgroundColor: "#86E3E3", color: "#0A4040" }}
                            whileTap={{ scale: 0.97 }}
                        >
                            완료
                        </motion.button>
                    </div>
                ) : (
                    <motion.button
                        onClick={() => selected && setConfirming(true)}
                        disabled={!selected}
                        className="w-full py-4 rounded-2xl font-black text-base disabled:opacity-40 disabled:cursor-not-allowed"
                        style={{ backgroundColor: "#86E3E3", color: "#0A4040" }}
                        whileTap={{ scale: 0.97 }}
                    >
                        선택 완료 →
                    </motion.button>
                )}
            </div>

            {/* Edit Profile Modal Content Overlay */}
            <AnimatePresence>
                {showEditModal && state.userProfile && (
                    <ProfileEditModal
                        initialProfile={state.userProfile}
                        onSave={(updated) => {
                            dispatch({ type: "SET_USER_PROFILE", payload: updated });
                            setShowEditModal(false);
                        }}
                        onClose={() => setShowEditModal(false)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
