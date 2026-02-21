"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { X, Camera } from "lucide-react";
import type { UserProfile } from "@/types";

const INTERESTS = [
    { label: "영화", emoji: "🎬" },
    { label: "스포츠", emoji: "⚽" },
    { label: "게임", emoji: "🎮" },
    { label: "음악", emoji: "🎵" },
    { label: "여행", emoji: "✈️" },
    { label: "독서", emoji: "📚" },
    { label: "요리", emoji: "🍳" },
    { label: "패션", emoji: "👗" },
    { label: "아웃도어", emoji: "🏃" },
    { label: "연애", emoji: "💕" },
];

const MBTI_AXES = [
    { a: "E", b: "I", labelA: "E", labelB: "I" },
    { a: "S", b: "N", labelA: "S", labelB: "N" },
    { a: "T", b: "F", labelA: "T", labelB: "F" },
    { a: "J", b: "P", labelA: "J", labelB: "P" },
];

const MAX_BIO = 200;

interface ProfileEditModalProps {
    initialProfile: UserProfile;
    onSave: (profile: UserProfile) => void;
    onClose: () => void;
}

export function ProfileEditModal({ initialProfile, onSave, onClose }: ProfileEditModalProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [name, setName] = useState(initialProfile.name);
    const [profileImage, setProfileImage] = useState<string | null>(initialProfile.profileImage ?? null);
    const [gender, setGender] = useState<"male" | "female">(initialProfile.gender);
    const [age, setAge] = useState(initialProfile.age);
    const [interests, setInterests] = useState<string[]>(initialProfile.interests);

    // Parse initial MBTI string into array
    const [mbtiAxes, setMbtiAxes] = useState<(string | null)[]>([
        initialProfile.mbti[0] || null,
        initialProfile.mbti[1] || null,
        initialProfile.mbti[2] || null,
        initialProfile.mbti[3] || null,
    ]);
    const [bio, setBio] = useState(initialProfile.bio);
    const [showErrors, setShowErrors] = useState(false);

    const handleImagePick = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = ev => setProfileImage(ev.target?.result as string);
        reader.readAsDataURL(file);
    };

    const toggleInterest = (label: string) =>
        setInterests(prev =>
            prev.includes(label) ? prev.filter(i => i !== label) : [...prev, label]
        );

    const toggleMbti = (axis: number, value: string) =>
        setMbtiAxes(prev => { const n = [...prev]; n[axis] = value; return n; });

    const isValid = name.trim().length > 0 && interests.length > 0 && mbtiAxes.every(v => v !== null) && bio.trim().length > 0;

    const handleSave = () => {
        if (!isValid) {
            setShowErrors(true);
            return;
        }

        onSave({
            ...initialProfile,
            name: name.trim(),
            gender,
            age,
            interests,
            mbti: (mbtiAxes as string[]).join(""),
            bio: bio.trim(),
            profileImage: profileImage ?? undefined,
        });
    };

    const inputClass = "w-full px-4 py-4 rounded-2xl text-base font-semibold outline-none bg-[#F6FAFA] dark:bg-[#2C2C2E] text-[#1A1A1A] dark:text-[#F0F0F0] placeholder:text-[#1A1A1A]/30 dark:placeholder:text-white/25";
    const DEFAULT_PROFILE_IMAGE = "/assets/profile_default.png";

    return (
        <motion.div
            className="absolute inset-0 z-50 flex items-center justify-center p-5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

            <motion.div
                className="relative w-full bg-white dark:bg-dark-bg rounded-[32px] overflow-hidden flex flex-col shadow-2xl"
                style={{ maxHeight: "85vh", maxWidth: 400 }}
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
            >
                {/* Header */}
                <div className="shrink-0 flex items-center justify-between px-6 py-5 border-b border-[#E5E7EB] dark:border-white/10">
                    <h3 className="font-black text-lg text-[#1A1A1A] dark:text-[#F0F0F0]">
                        마이페이지
                    </h3>
                    <button onClick={onClose} className="p-1">
                        <X className="w-5 h-5 text-[#1A1A1A]/60 dark:text-white/50" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-6">
                    {/* 프로필 사진 (선택) */}
                    <div className="flex flex-col items-center gap-2">
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="relative"
                            style={{ width: 88, height: 88 }}
                        >
                            <div
                                className="w-full h-full rounded-full overflow-hidden flex items-center justify-center"
                                style={{
                                    backgroundColor: "#F0FAFA",
                                    border: "2.5px solid",
                                    borderColor: profileImage ? "#86E3E3" : "#E5E7EB",
                                }}
                            >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={profileImage ?? DEFAULT_PROFILE_IMAGE}
                                    alt="프로필"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div
                                className="absolute bottom-0 right-0 w-7 h-7 rounded-full flex items-center justify-center shadow-sm"
                                style={{ backgroundColor: "#86E3E3", border: "2px solid white" }}
                            >
                                <Camera className="w-4 h-4 text-white" />
                            </div>
                        </button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleImagePick}
                        />
                    </div>

                    {/* 이름 */}
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-bold text-[#1A1A1A] dark:text-[#F0F0F0]">이름</label>
                        <input
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="이름을 입력해주세요"
                            maxLength={10}
                            className={`${inputClass} ${showErrors && !name ? "error-pulse" : ""}`}
                            style={{ border: "2px solid", borderColor: name ? "#86E3E3" : "transparent" }}
                        />
                    </div>

                    {/* 성별 / 나이 */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-bold text-[#1A1A1A] dark:text-[#F0F0F0]">성별</label>
                            <div className="grid grid-cols-2 gap-2">
                                {(["male", "female"] as const).map(g => (
                                    <button
                                        key={g}
                                        onClick={() => setGender(g)}
                                        className={`py-3 rounded-2xl font-black text-sm transition-all`}
                                        style={{
                                            backgroundColor: gender === g ? "#86E3E3" : "#F6FAFA",
                                            color: gender === g ? "#0A4040" : "#6B7280",
                                            border: "2px solid",
                                            borderColor: gender === g ? "#86E3E3" : "transparent",
                                        }}
                                    >
                                        {g === "male" ? "남" : "여"}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-bold text-[#1A1A1A] dark:text-[#F0F0F0]">나이</label>
                            <div className="flex items-center gap-1">
                                <span className="text-sm font-bold text-[#1A1A1A]/50 dark:text-white/40">만</span>
                                <div
                                    className="flex-1 flex items-center justify-between rounded-2xl overflow-hidden px-1"
                                    style={{ backgroundColor: "#F6FAFA", border: "2px solid #86E3E3" }}
                                >
                                    <button
                                        onClick={() => setAge(Math.max(1, age - 1))}
                                        className="p-2 font-black transition-colors active:bg-[#B8F0F0]"
                                        style={{ color: "#86E3E3" }}
                                    >
                                        −
                                    </button>
                                    <span className="font-black text-base text-[#1A1A1A] dark:text-[#F0F0F0]">
                                        {age}
                                    </span>
                                    <button
                                        onClick={() => setAge(Math.max(100, age + 1))}
                                        className="p-2 font-black transition-colors active:bg-[#B8F0F0]"
                                        style={{ color: "#86E3E3" }}
                                    >
                                        +
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* MBTI */}
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-bold text-[#1A1A1A] dark:text-[#F0F0F0]">
                            MBTI{" "}
                            <span className="font-black" style={{ color: "#86E3E3" }}>{mbtiAxes.filter(Boolean).join("") || "?"}</span>
                            {showErrors && mbtiAxes.some(v => !v) && (
                                <span className="ml-2 text-xs font-semibold" style={{ color: "#EF4444" }}>필수 입력</span>
                            )}
                        </label>
                        <div className="grid grid-cols-4 gap-2">
                            {MBTI_AXES.map((axis, i) => (
                                <div key={i} className="flex flex-col gap-1.5">
                                    {[{ val: axis.a, label: axis.labelA }, { val: axis.b, label: axis.labelB }].map(opt => (
                                        <button
                                            key={opt.val}
                                            onClick={() => toggleMbti(i, opt.val)}
                                            className={`py-2 rounded-xl font-bold text-sm transition-all ${showErrors && !mbtiAxes[i] ? "error-pulse" : ""}`}
                                            style={{
                                                backgroundColor: mbtiAxes[i] === opt.val ? "#86E3E3" : "#F6FAFA",
                                                color: mbtiAxes[i] === opt.val ? "#0A4040" : "#6B7280",
                                                border: "2px solid",
                                                borderColor: mbtiAxes[i] === opt.val ? "#86E3E3" : "transparent",
                                            }}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 관심사 */}
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-bold text-[#1A1A1A] dark:text-[#F0F0F0]">
                            관심사
                            {showErrors && interests.length === 0 && (
                                <span className="ml-2 text-xs font-semibold" style={{ color: "#EF4444" }}>최소 1개 선택</span>
                            )}
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {INTERESTS.map(({ label, emoji }) => {
                                const selected = interests.includes(label);
                                return (
                                    <button
                                        key={label}
                                        onClick={() => toggleInterest(label)}
                                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold text-xs transition-all ${showErrors && interests.length === 0 ? "error-pulse" : ""}`}
                                        style={{
                                            backgroundColor: selected ? "#86E3E3" : "#F6FAFA",
                                            color: selected ? "#0A4040" : "#6B7280",
                                            border: "2px solid",
                                            borderColor: selected ? "#86E3E3" : "transparent",
                                        }}
                                    >
                                        <span>{emoji} </span>
                                        <span>{label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* 자기소개 */}
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-bold text-[#1A1A1A] dark:text-[#F0F0F0]">
                            자기소개
                            {showErrors && bio.trim().length === 0 && (
                                <span className="ml-2 text-xs font-semibold" style={{ color: "#EF4444" }}>필수 입력</span>
                            )}
                        </label>
                        <textarea
                            value={bio}
                            onChange={e => setBio(e.target.value.slice(0, MAX_BIO))}
                            placeholder="간단하게 자신을 소개해주세요."
                            rows={3}
                            className={`w-full px-4 py-3 rounded-2xl text-sm font-medium outline-none resize-none bg-[#F6FAFA] dark:bg-[#2C2C2E] text-[#1A1A1A] dark:text-[#F0F0F0] placeholder:text-[#1A1A1A]/30 dark:placeholder:text-white/25 leading-relaxed ${showErrors && bio.trim().length === 0 ? "error-pulse" : ""}`}
                            style={{
                                border: "2px solid",
                                borderColor: showErrors && bio.trim().length === 0 ? "#EF4444" : bio ? "#86E3E3" : "transparent",
                            }}
                        />
                    </div>
                </div>

                {/* Footer Buttons */}
                <div className="shrink-0 p-5 pt-0">
                    <motion.button
                        onClick={handleSave}
                        className="w-full py-4 rounded-2xl font-black text-base"
                        style={{ backgroundColor: "#86E3E3", color: "#0A4040" }}
                        whileTap={{ scale: 0.97 }}
                    >
                        저장하기
                    </motion.button>
                </div>
            </motion.div>
        </motion.div>
    );
}
