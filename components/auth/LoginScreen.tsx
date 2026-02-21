"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAppContext } from "@/context/AppContext";

export function LoginScreen() {
    const router = useRouter();
    const { dispatch } = useAppContext();

    const [userId, setUserId] = useState("");
    const [password, setPassword] = useState("");

    const handleLogin = () => {
        if (!userId.trim() || !password) return;
        // TODO: 실제 로그인 API 연동 (README 참고)
        // 현재는 mock 처리 — 아이디/이름을 같이 사용
        dispatch({
            type: "SET_USER_PROFILE",
            payload: {
                userId: userId.trim(),
                name: userId.trim(),
                gender: "male",
                age: 0,
                interests: [],
                mbti: "",
                bio: "",
            },
        });
        router.push("/match");
    };

    const handleRegister = () => {
        router.push("/register");
    };

    const loginValid = userId.trim().length > 0 && password.length > 0;

    return (
        <div
            className="relative flex flex-col bg-white dark:bg-dark-bg overflow-hidden mx-auto w-full"
            style={{ height: "100dvh", maxWidth: 430 }}
        >
            {/* Top branding */}
            <div
                className="shrink-0 flex flex-col items-center justify-center gap-2"
                style={{ paddingTop: "max(3.5rem, env(safe-area-inset-top, 3.5rem))", paddingBottom: "2.5rem" }}
            >
                <div
                    className="px-4 py-1.5 rounded-full text-xs font-black tracking-widest uppercase"
                    style={{ backgroundColor: "#B8F0F0", color: "#0A4040" }}
                >
                    AI CUPID
                </div>
                <h1 className="font-black text-2xl text-[#1A1A1A] dark:text-[#F0F0F0] tracking-tight">
                    다시 만나서 반가워요
                </h1>
                <p className="text-sm text-[#1A1A1A]/45 dark:text-white/35">
                    로그인하고 큐피드를 만나보세요
                </p>
            </div>

            {/* Form */}
            <div className="flex-1 flex flex-col gap-5 px-5">
                {/* 아이디 */}
                <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold text-[#1A1A1A] dark:text-[#F0F0F0]">아이디</label>
                    <input
                        type="text"
                        value={userId}
                        onChange={e => setUserId(e.target.value)}
                        placeholder="아이디를 입력해주세요"
                        autoComplete="username"
                        className="w-full px-4 py-4 rounded-2xl text-base font-semibold outline-none bg-[#F6FAFA] dark:bg-[#2C2C2E] text-[#1A1A1A] dark:text-[#F0F0F0] placeholder:text-[#1A1A1A]/30 dark:placeholder:text-white/25"
                        style={{
                            border: "2px solid",
                            borderColor: userId ? "#86E3E3" : "transparent",
                        }}
                    />
                </div>

                {/* 비밀번호 */}
                <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold text-[#1A1A1A] dark:text-[#F0F0F0]">비밀번호</label>
                    <input
                        type="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && loginValid && handleLogin()}
                        placeholder="비밀번호를 입력해주세요"
                        autoComplete="current-password"
                        className="w-full px-4 py-4 rounded-2xl text-base font-semibold outline-none bg-[#F6FAFA] dark:bg-[#2C2C2E] text-[#1A1A1A] dark:text-[#F0F0F0] placeholder:text-[#1A1A1A]/30 dark:placeholder:text-white/25"
                        style={{
                            border: "2px solid",
                            borderColor: password ? "#86E3E3" : "transparent",
                        }}
                    />
                </div>
            </div>

            {/* Buttons */}
            <div
                className="shrink-0 px-5 flex flex-col gap-3"
                style={{ paddingBottom: "max(2rem, env(safe-area-inset-bottom, 2rem))" }}
            >
                <div className="grid grid-cols-2 gap-3">
                    <motion.button
                        onClick={handleRegister}
                        className="py-4 rounded-2xl font-black text-base"
                        style={{
                            backgroundColor: "transparent",
                            color: "#86E3E3",
                            border: "2.5px solid #86E3E3",
                        }}
                        whileTap={{ scale: 0.97 }}
                    >
                        회원가입
                    </motion.button>
                    <motion.button
                        onClick={handleLogin}
                        disabled={!loginValid}
                        className="py-4 rounded-2xl font-black text-base disabled:opacity-40 disabled:cursor-not-allowed"
                        style={{ backgroundColor: "#86E3E3", color: "#0A4040" }}
                        whileTap={{ scale: 0.97 }}
                    >
                        로그인
                    </motion.button>
                </div>
            </div>
        </div>
    );
}
