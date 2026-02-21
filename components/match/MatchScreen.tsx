"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Search, X, ChevronLeft } from "lucide-react";
import { useAppContext } from "@/context/AppContext";
import { MOCK_USERS } from "@/lib/mockData";
import type { MatchedUser } from "@/types";

// ── Avatar placeholder ────────────────────────────────────────────
function UserAvatar({ user, size = 56 }: { user: MatchedUser; size?: number }) {
    return (
        <div
            className="rounded-full overflow-hidden flex items-center justify-center shrink-0"
            style={{
                width: size,
                height: size,
                backgroundColor: "#F0FAFA",
                border: "2px solid #B8F0F0",
            }}
        >
            {user.profileImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.profileImage} alt={user.name} className="w-full h-full object-cover" />
            ) : (
                <span style={{ fontSize: size * 0.45 }}>
                    {user.gender === "female" ? "👩" : "👨"}
                </span>
            )}
        </div>
    );
}

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
            className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all text-left"
            style={{
                backgroundColor: selected ? "#B8F0F0" : "#F6FAFA",
                border: "2px solid",
                borderColor: selected ? "#86E3E3" : "transparent",
            }}
            whileTap={{ scale: 0.98 }}
        >
            <UserAvatar user={user} size={52} />
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-black text-base text-[#1A1A1A] dark:text-[#F0F0F0]">
                        {user.name}
                    </span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: "#F5E9BB", color: "#4A3800" }}>
                        {user.mbti}
                    </span>
                    <span className="text-xs text-[#1A1A1A]/40 dark:text-white/30">
                        {user.age}세
                    </span>
                </div>
                <p className="text-sm text-[#1A1A1A]/55 dark:text-white/40 truncate">
                    {user.bio || user.interests.join(", ")}
                </p>
            </div>
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
            className="w-full flex items-center gap-4 px-5 py-5 rounded-3xl"
            style={{
                backgroundColor: "#B8F0F0",
                border: "2px solid #86E3E3",
            }}
        >
            <UserAvatar user={user} size={64} />
            <div>
                <div className="flex items-center gap-2 mb-1">
                    <span className="font-black text-lg text-[#0A4040]">{user.name}</span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: "#86E3E3", color: "#0A4040" }}>
                        {user.mbti}
                    </span>
                </div>
                <p className="text-sm text-[#0A4040]/70 leading-snug">
                    {user.bio || user.interests.join(", ")}
                </p>
                <div className="flex gap-1 flex-wrap mt-2">
                    {user.interests.slice(0, 3).map(i => (
                        <span
                            key={i}
                            className="text-xs px-2 py-0.5 rounded-full font-semibold"
                            style={{ backgroundColor: "rgba(255,255,255,0.6)", color: "#0A4040" }}
                        >
                            {i}
                        </span>
                    ))}
                </div>
            </div>
        </motion.div>
    );
}

// ── Main component ────────────────────────────────────────────────
export function MatchScreen() {
    const router = useRouter();
    const { dispatch } = useAppContext();

    const [query, setQuery] = useState("");
    const [selected, setSelected] = useState<MatchedUser | null>(null);
    const [confirming, setConfirming] = useState(false);

    const filtered = useMemo(() => {
        if (!query.trim()) return MOCK_USERS;
        const q = query.toLowerCase();
        return MOCK_USERS.filter(
            u =>
                u.userId.toLowerCase().includes(q) ||
                u.name.toLowerCase().includes(q)
        );
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

    const handleConfirm = () => {
        if (!selected) return;
        dispatch({ type: "SET_MATCHED_USER", payload: selected });
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
                            placeholder="아이디 또는 이름으로 검색"
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
                    {filtered.length === 0 ? (
                        <p className="text-center text-sm text-[#1A1A1A]/40 dark:text-white/30 py-10">
                            검색 결과가 없습니다
                        </p>
                    ) : (
                        filtered.map(user => (
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
        </div>
    );
}
