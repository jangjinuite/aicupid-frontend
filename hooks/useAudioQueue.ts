"use client";

import { useRef, useCallback } from "react";

/**
 * 백엔드에서 받은 base64 오디오(WAV/PCM/MP3)를 순서대로 재생하는 훅.
 *
 * - WAV / PCM: AudioContext로 디코딩·스케줄링 (seamless)
 * - MP3 등:    <audio> 엘리먼트로 재생 (간단 폴백)
 */
export function useAudioQueue() {
    const audioCtxRef = useRef<AudioContext | null>(null);
    const nextStartTimeRef = useRef<number>(0);
    const audioElemRef = useRef<HTMLAudioElement | null>(null);
    const isClosedRef = useRef<boolean>(false);

    /** base64 WAV/PCM 청크를 AudioContext 큐에 추가 */
    const enqueueRaw = useCallback((base64: string, mimeType: string) => {
        if (!base64 || isClosedRef.current) return;

        // mimeType에서 샘플레이트 파싱 (예: "audio/pcm;rate=24000")
        const rateMatch = mimeType.match(/rate=(\d+)/);
        const sampleRate = rateMatch ? parseInt(rateMatch[1], 10) : 24000;

        if (!audioCtxRef.current || audioCtxRef.current.state === "closed") {
            audioCtxRef.current = new AudioContext({ sampleRate });
            nextStartTimeRef.current = 0;
        }

        const ctx = audioCtxRef.current;
        const binaryStr = atob(base64);
        const bytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) {
            bytes[i] = binaryStr.charCodeAt(i);
        }

        // Int16 little-endian → Float32
        const numSamples = Math.floor(bytes.length / 2);
        const float32 = new Float32Array(numSamples);
        const view = new DataView(bytes.buffer);
        for (let i = 0; i < numSamples; i++) {
            float32[i] = view.getInt16(i * 2, true) / 32768;
        }

        const buffer = ctx.createBuffer(1, numSamples, sampleRate);
        buffer.copyToChannel(float32, 0);

        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);

        const startAt = Math.max(ctx.currentTime, nextStartTimeRef.current);
        source.start(startAt);
        nextStartTimeRef.current = startAt + buffer.duration;
    }, []);

    /**
     * 백엔드 /process 응답 오디오(base64 WAV)를 재생.
     * WAV 헤더가 포함된 경우 decodeAudioData로 디코딩, 아닌 경우 raw PCM으로 처리.
     */
    const playResponse = useCallback(
        async (base64: string, mimeType: string, onPlayEnded?: () => void) => {
            if (!base64 || isClosedRef.current) {
                if (onPlayEnded) onPlayEnded();
                return;
            }

            const binaryStr = atob(base64);
            const bytes = new Uint8Array(binaryStr.length);
            for (let i = 0; i < binaryStr.length; i++) {
                bytes[i] = binaryStr.charCodeAt(i);
            }

            if (mimeType === "audio/mpeg" || mimeType === "audio/mp3") {
                // MP3: <audio> 엘리먼트로 재생
                const blob = new Blob([bytes], { type: mimeType });
                const url = URL.createObjectURL(blob);
                if (!audioElemRef.current) audioElemRef.current = new Audio();
                audioElemRef.current.src = url;
                audioElemRef.current.onended = () => {
                    URL.revokeObjectURL(url);
                    if (onPlayEnded) onPlayEnded();
                };
                try {
                    await audioElemRef.current.play();
                } catch (e) {
                    console.error("[AudioQueue] mp3 play failed:", e);
                    if (onPlayEnded) onPlayEnded();
                }
                return;
            }

            // WAV / PCM: AudioContext.decodeAudioData 사용
            if (!audioCtxRef.current || audioCtxRef.current.state === "closed") {
                audioCtxRef.current = new AudioContext();
                nextStartTimeRef.current = 0;
            }
            const ctx = audioCtxRef.current;
            if (ctx.state === "suspended") {
                await ctx.resume();
            }

            try {
                const decoded = await ctx.decodeAudioData(bytes.buffer.slice(0));
                const source = ctx.createBufferSource();
                source.buffer = decoded;
                source.connect(ctx.destination);

                if (onPlayEnded) {
                    source.onended = onPlayEnded;
                }

                const startAt = Math.max(ctx.currentTime, nextStartTimeRef.current);
                source.start(startAt);
                nextStartTimeRef.current = startAt + decoded.duration;
            } catch (err) {
                console.warn("[AudioQueue] decodeAudioData failed, falling back to raw PCM", err);
                // WAV 헤더 없이 raw PCM으로 폴백
                enqueueRaw(base64, mimeType);
                if (onPlayEnded) {
                    // Approximate duration based on base64 length (pcm 16 bit 24000hz)
                    // base64 length * 0.75 = bytes. bytes / 2 = samples. samples / 24000 = seconds
                    const approxSeconds = (base64.length * 0.75) / 2 / 24000;
                    setTimeout(onPlayEnded, Math.max(approxSeconds * 1000, 500));
                }
            }
        },
        [enqueueRaw]
    );

    /** AI 턴 종료 시 스케줄 리셋 */
    const flush = useCallback(() => {
        nextStartTimeRef.current = 0;
    }, []);

    const resetClosed = useCallback(() => {
        isClosedRef.current = false;
    }, []);

    /** 세션 종료 시 AudioContext 닫기 */
    const close = useCallback(() => {
        isClosedRef.current = true;
        audioCtxRef.current?.close();
        audioCtxRef.current = null;
        nextStartTimeRef.current = 0;
        if (audioElemRef.current) {
            audioElemRef.current.pause();
            audioElemRef.current.src = "";
        }
    }, []);

    return { playResponse, enqueueRaw, flush, close, resetClosed };
}
