"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { ChevronLeft, Camera } from "lucide-react";
import { useAppContext } from "@/context/AppContext";
import type { UserProfile } from "@/types";

// ── Constants ─────────────────────────────────────────────────────
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
    { a: "E", b: "I", labelA: "외향형 E", labelB: "내향형 I" },
    { a: "S", b: "N", labelA: "감각형 S", labelB: "직관형 N" },
    { a: "T", b: "F", labelA: "사고형 T", labelB: "감정형 F" },
    { a: "J", b: "P", labelA: "판단형 J", labelB: "인식형 P" },
];

const MAX_BIO = 200;

const slideVariants = {
    enter: (d: number) => ({ x: d > 0 ? 60 : -60, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? -60 : 60, opacity: 0 }),
};

// ── Main component ────────────────────────────────────────────────
export function RegisterScreen() {
    const router = useRouter();
    const { dispatch } = useAppContext();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [step, setStep] = useState(0);
    const [dir, setDir] = useState(1);

    // Step 0 — 계정 정보
    const [userId, setUserId] = useState("");
    const [password, setPassword] = useState("");
    const [passwordConfirm, setPasswordConfirm] = useState("");

    // Step 1 — 프로필 정보
    const [name, setName] = useState("");
    const [profileImage, setProfileImage] = useState<string | null>(null);
    const [gender, setGender] = useState<"male" | "female" | null>(null);
    const [age, setAge] = useState(25);
    const [interests, setInterests] = useState<string[]>([]);

    // Step 2 — 추가 정보
    const [mbtiAxes, setMbtiAxes] = useState(["E", "S", "T", "J"]);
    const [bio, setBio] = useState("");

    const goNext = () => { setDir(1); setStep(s => s + 1); };
    const goBack = () => { setDir(-1); setStep(s => s - 1); };

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

    const pwMatch = passwordConfirm === "" || password === passwordConfirm;
    const step0Valid = userId.trim().length >= 2 && password.length >= 4 && password === passwordConfirm;
    const step1Valid = name.trim().length > 0 && gender !== null && interests.length > 0;

    const handleSubmit = () => {
        const profile: UserProfile = {
            userId: userId.trim(),
            name: name.trim(),
            gender: gender!,
            age,
            interests,
            mbti: mbtiAxes.join(""),
            bio: bio.trim(),
            profileImage: profileImage ?? undefined,
        };
        dispatch({ type: "SET_USER_PROFILE", payload: profile });
        router.push("/match");
    };

    const isLastStep = step === 2;

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
                {step > 0 ? (
                    <motion.button
                        onClick={goBack}
                        className="flex items-center gap-1 text-sm font-semibold text-primary"
                        whileTap={{ scale: 0.92 }}
                    >
                        <ChevronLeft className="w-4 h-4" />
                        이전
                    </motion.button>
                ) : (
                    <motion.button
                        onClick={() => router.push("/login")}
                        className="flex items-center gap-1 text-sm font-semibold text-primary"
                        whileTap={{ scale: 0.92 }}
                    >
                        <ChevronLeft className="w-4 h-4" />
                        로그인
                    </motion.button>
                )}
                <span className="font-black text-base text-[#1A1A1A] dark:text-[#F0F0F0] tracking-tight">
                    AI CUPID
                </span>
                <div className="w-14" />
            </div>

            {/* Progress bar */}
            <div className="shrink-0 flex gap-2 px-5 pb-5">
                {[0, 1, 2].map(i => (
                    <div
                        key={i}
                        className="h-1.5 flex-1 rounded-full transition-all duration-300"
                        style={{ backgroundColor: i <= step ? "#86E3E3" : "#E5E7EB" }}
                    />
                ))}
            </div>

            {/* Step content */}
            <div className="flex-1 relative overflow-hidden">
                <AnimatePresence mode="wait" custom={dir}>
                    <motion.div
                        key={step}
                        custom={dir}
                        variants={slideVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ duration: 0.22, ease: "easeInOut" }}
                        className="absolute inset-0 overflow-y-auto px-5 pb-4"
                    >
                        {step === 0 && (
                            <Step0Account
                                userId={userId} setUserId={setUserId}
                                password={password} setPassword={setPassword}
                                passwordConfirm={passwordConfirm} setPasswordConfirm={setPasswordConfirm}
                                pwMatch={pwMatch}
                            />
                        )}
                        {step === 1 && (
                            <Step1Profile
                                name={name} setName={setName}
                                profileImage={profileImage}
                                onImageClick={() => fileInputRef.current?.click()}
                                gender={gender} setGender={setGender}
                                age={age} setAge={setAge}
                                interests={interests} toggleInterest={toggleInterest}
                            />
                        )}
                        {step === 2 && (
                            <Step2Extra
                                mbtiAxes={mbtiAxes} toggleMbti={toggleMbti}
                                bio={bio} setBio={setBio}
                            />
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Hidden file input */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImagePick}
            />

            {/* Bottom buttons */}
            <div
                className="shrink-0 px-5 pt-3"
                style={{ paddingBottom: "max(2rem, env(safe-area-inset-bottom, 2rem))" }}
            >
                {step === 0 ? (
                    <motion.button
                        onClick={goNext}
                        disabled={!step0Valid}
                        className="w-full py-4 rounded-2xl font-black text-base disabled:opacity-40 disabled:cursor-not-allowed"
                        style={{ backgroundColor: "#86E3E3", color: "#0A4040" }}
                        whileTap={{ scale: 0.97 }}
                    >
                        다음 →
                    </motion.button>
                ) : (
                    <div className="grid grid-cols-2 gap-3">
                        <motion.button
                            onClick={goBack}
                            className="py-4 rounded-2xl font-black text-base"
                            style={{
                                backgroundColor: "transparent",
                                color: "#86E3E3",
                                border: "2.5px solid #86E3E3",
                            }}
                            whileTap={{ scale: 0.97 }}
                        >
                            ← 이전
                        </motion.button>
                        <motion.button
                            onClick={isLastStep ? handleSubmit : goNext}
                            disabled={step === 1 ? !step1Valid : false}
                            className="py-4 rounded-2xl font-black text-base disabled:opacity-40 disabled:cursor-not-allowed"
                            style={{ backgroundColor: "#86E3E3", color: "#0A4040" }}
                            whileTap={{ scale: 0.97 }}
                        >
                            {isLastStep ? "완료 ✓" : "다음 →"}
                        </motion.button>
                    </div>
                )}
            </div>
        </div>
    );
}

// ── Step 0: 계정 정보 ─────────────────────────────────────────────
interface Step0Props {
    userId: string; setUserId: (v: string) => void;
    password: string; setPassword: (v: string) => void;
    passwordConfirm: string; setPasswordConfirm: (v: string) => void;
    pwMatch: boolean;
}

function Step0Account({ userId, setUserId, password, setPassword, passwordConfirm, setPasswordConfirm, pwMatch }: Step0Props) {
    const inputClass = "w-full px-4 py-4 rounded-2xl text-base font-semibold outline-none bg-[#F6FAFA] dark:bg-[#2C2C2E] text-[#1A1A1A] dark:text-[#F0F0F0] placeholder:text-[#1A1A1A]/30 dark:placeholder:text-white/25";

    return (
        <div className="flex flex-col gap-6 pt-2">
            <div>
                <p className="text-xs font-bold tracking-widest uppercase mb-1" style={{ color: "#86E3E3" }}>STEP 1</p>
                <h2 className="font-black text-2xl text-[#1A1A1A] dark:text-[#F0F0F0] leading-tight">
                    계정을<br />만들어보세요
                </h2>
            </div>

            <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-[#1A1A1A] dark:text-[#F0F0F0]">아이디</label>
                <input
                    type="text"
                    value={userId}
                    onChange={e => setUserId(e.target.value)}
                    placeholder="아이디 (2자 이상)"
                    autoComplete="username"
                    className={inputClass}
                    style={{ border: "2px solid", borderColor: userId.length >= 2 ? "#86E3E3" : "transparent" }}
                />
            </div>

            <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-[#1A1A1A] dark:text-[#F0F0F0]">비밀번호</label>
                <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="비밀번호 (4자 이상)"
                    autoComplete="new-password"
                    className={inputClass}
                    style={{ border: "2px solid", borderColor: password.length >= 4 ? "#86E3E3" : "transparent" }}
                />
            </div>

            <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-[#1A1A1A] dark:text-[#F0F0F0]">비밀번호 확인</label>
                <input
                    type="password"
                    value={passwordConfirm}
                    onChange={e => setPasswordConfirm(e.target.value)}
                    placeholder="비밀번호를 다시 입력해주세요"
                    autoComplete="new-password"
                    className={inputClass}
                    style={{
                        border: "2px solid",
                        borderColor: !pwMatch ? "#EF4444" : passwordConfirm && pwMatch ? "#86E3E3" : "transparent",
                    }}
                />
                {!pwMatch && (
                    <p className="text-xs font-semibold" style={{ color: "#EF4444" }}>
                        비밀번호가 일치하지 않습니다
                    </p>
                )}
            </div>
        </div>
    );
}

// ── Step 1: 프로필 정보 ───────────────────────────────────────────
interface Step1Props {
    name: string; setName: (v: string) => void;
    profileImage: string | null; onImageClick: () => void;
    gender: "male" | "female" | null; setGender: (v: "male" | "female") => void;
    age: number; setAge: (v: number) => void;
    interests: string[]; toggleInterest: (label: string) => void;
}

function Step1Profile({ name, setName, profileImage, onImageClick, gender, setGender, age, setAge, interests, toggleInterest }: Step1Props) {
    const inputClass = "w-full px-4 py-4 rounded-2xl text-base font-semibold outline-none bg-[#F6FAFA] dark:bg-[#2C2C2E] text-[#1A1A1A] dark:text-[#F0F0F0] placeholder:text-[#1A1A1A]/30 dark:placeholder:text-white/25";

    return (
        <div className="flex flex-col gap-6 pt-2">
            <div>
                <p className="text-xs font-bold tracking-widest uppercase mb-1" style={{ color: "#86E3E3" }}>STEP 2</p>
                <h2 className="font-black text-2xl text-[#1A1A1A] dark:text-[#F0F0F0] leading-tight">
                    프로필을<br />설정해주세요
                </h2>
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
                    className={inputClass}
                    style={{ border: "2px solid", borderColor: name ? "#86E3E3" : "transparent" }}
                />
            </div>

            {/* 프로필 사진 */}
            <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-[#1A1A1A] dark:text-[#F0F0F0]">프로필</label>
                <button
                    onClick={onImageClick}
                    className="relative self-start"
                    style={{ width: 88, height: 88 }}
                >
                    {/* Circle */}
                    <div
                        className="w-full h-full rounded-full overflow-hidden flex items-center justify-center"
                        style={{
                            backgroundColor: "#F0FAFA",
                            border: "2.5px solid",
                            borderColor: profileImage ? "#86E3E3" : "#E5E7EB",
                        }}
                    >
                        {profileImage ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={profileImage}
                                alt="프로필"
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <Camera className="w-7 h-7" style={{ color: "#86E3E3" }} />
                        )}
                    </div>
                    {/* Edit badge */}
                    <div
                        className="absolute bottom-0 right-0 w-6 h-6 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: "#86E3E3" }}
                    >
                        <Camera className="w-3.5 h-3.5 text-white" />
                    </div>
                </button>
            </div>

            {/* 성별 */}
            <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-[#1A1A1A] dark:text-[#F0F0F0]">성별</label>
                <div className="grid grid-cols-2 gap-3">
                    {(["male", "female"] as const).map(g => (
                        <button
                            key={g}
                            onClick={() => setGender(g)}
                            className="py-4 rounded-2xl font-black text-base transition-all"
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

            {/* 나이 */}
            <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-[#1A1A1A] dark:text-[#F0F0F0]">나이</label>
                <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-[#1A1A1A]/50 dark:text-white/40">만</span>
                    <div
                        className="flex items-center gap-0 rounded-2xl overflow-hidden"
                        style={{ backgroundColor: "#F6FAFA", border: "2px solid #86E3E3" }}
                    >
                        <button
                            onClick={() => setAge(a => Math.max(1, a - 1))}
                            className="px-4 py-3 font-black text-xl transition-colors active:bg-[#B8F0F0]"
                            style={{ color: "#86E3E3" }}
                        >
                            −
                        </button>
                        <span className="px-3 font-black text-xl text-[#1A1A1A] dark:text-[#F0F0F0] min-w-[3ch] text-center">
                            {age}
                        </span>
                        <button
                            onClick={() => setAge(a => Math.min(99, a + 1))}
                            className="px-4 py-3 font-black text-xl transition-colors active:bg-[#B8F0F0]"
                            style={{ color: "#86E3E3" }}
                        >
                            +
                        </button>
                    </div>
                    <span className="text-sm font-bold text-[#1A1A1A]/50 dark:text-white/40">세</span>
                </div>
            </div>

            {/* 관심사 */}
            <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-[#1A1A1A] dark:text-[#F0F0F0]">
                    관심사{" "}
                    <span className="text-[#1A1A1A]/40 dark:text-white/30 font-normal">(중복 선택 가능)</span>
                </label>
                <div className="flex flex-wrap gap-2">
                    {INTERESTS.map(({ label, emoji }) => {
                        const selected = interests.includes(label);
                        return (
                            <button
                                key={label}
                                onClick={() => toggleInterest(label)}
                                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl font-bold text-sm transition-all"
                                style={{
                                    backgroundColor: selected ? "#86E3E3" : "#F6FAFA",
                                    color: selected ? "#0A4040" : "#6B7280",
                                    border: "2px solid",
                                    borderColor: selected ? "#86E3E3" : "transparent",
                                }}
                            >
                                <span>{emoji}</span>
                                <span>{label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

// ── Step 2: 추가 정보 ─────────────────────────────────────────────
interface Step2Props {
    mbtiAxes: string[]; toggleMbti: (axis: number, value: string) => void;
    bio: string; setBio: (v: string) => void;
}

function Step2Extra({ mbtiAxes, toggleMbti, bio, setBio }: Step2Props) {
    return (
        <div className="flex flex-col gap-6 pt-2">
            <div>
                <p className="text-xs font-bold tracking-widest uppercase mb-1" style={{ color: "#86E3E3" }}>STEP 3</p>
                <h2 className="font-black text-2xl text-[#1A1A1A] dark:text-[#F0F0F0] leading-tight">
                    나를 더<br />알려주세요
                </h2>
            </div>

            {/* MBTI */}
            <div className="flex flex-col gap-3">
                <label className="text-sm font-bold text-[#1A1A1A] dark:text-[#F0F0F0]">
                    MBTI{" "}
                    <span className="font-black" style={{ color: "#86E3E3" }}>{mbtiAxes.join("")}</span>
                </label>
                {MBTI_AXES.map((axis, i) => (
                    <div key={i} className="grid grid-cols-2 gap-2">
                        {[{ val: axis.a, label: axis.labelA }, { val: axis.b, label: axis.labelB }].map(opt => (
                            <button
                                key={opt.val}
                                onClick={() => toggleMbti(i, opt.val)}
                                className="py-3 rounded-2xl font-bold text-sm transition-all"
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

            {/* 자기소개 */}
            <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-[#1A1A1A] dark:text-[#F0F0F0]">
                    자기소개{" "}
                    <span className="text-[#1A1A1A]/40 dark:text-white/30 font-normal">(선택)</span>
                </label>
                <textarea
                    value={bio}
                    onChange={e => setBio(e.target.value.slice(0, MAX_BIO))}
                    placeholder="간단하게 자신을 소개해주세요. AI 큐피드가 더 잘 맞춰드릴 수 있어요!"
                    rows={5}
                    className="w-full px-4 py-3.5 rounded-2xl text-sm font-medium outline-none resize-none bg-[#F6FAFA] dark:bg-[#2C2C2E] text-[#1A1A1A] dark:text-[#F0F0F0] placeholder:text-[#1A1A1A]/30 dark:placeholder:text-white/25 leading-relaxed"
                    style={{
                        border: "2px solid",
                        borderColor: bio ? "#86E3E3" : "transparent",
                    }}
                />
                <p className="text-right text-xs text-[#1A1A1A]/30 dark:text-white/25 font-mono">
                    {bio.length} / {MAX_BIO}
                </p>
            </div>
        </div>
    );
}
