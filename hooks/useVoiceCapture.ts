"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { MicVAD } from "@ricky0123/vad-web";
import { useAudioQueue } from "@/hooks/useAudioQueue";
import type { AvatarState, GameEvent } from "@/types";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000";

export type VoiceStatus = "idle" | "listening" | "speaking" | "ai_speaking" | "waiting";

export interface DebugEvent {
  ts: string;
  label: string;
  color: "green" | "yellow" | "blue" | "red" | "purple";
}

export interface UseVoiceCaptureReturn {
  status: VoiceStatus;
  isWaiting: boolean;
  avatarState: AvatarState;
  loading: boolean;
  error: string | null;
  gameEvent: GameEvent | null;
  debugLog: DebugEvent[];
  start: () => void;
  stop: () => void;
  forceCommit: () => void;
  dismissEvent: () => void;
}

// ── 유틸 ─────────────────────────────────────────────────────

function nowStr(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}.${String(d.getMilliseconds()).padStart(3, "0")}`;
}

/** Float32 PCM → WAV Blob 변환 */
function encodeWAV(samples: Float32Array, sampleRate: number = 16000): Blob {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  const writeString = (view: DataView, offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, 'data');
  view.setUint32(40, samples.length * 2, true);

  // Write PCM samples
  let offset = 44;
  for (let i = 0; i < samples.length; i++, offset += 2) {
    let s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

const MAX_LOG = 40;

// ── Hook ─────────────────────────────────────────────────────

export function useVoiceCapture(): UseVoiceCaptureReturn {
  const [status, setStatus] = useState<VoiceStatus>("idle");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [gameEvent, setGameEvent] = useState<GameEvent | null>(null);
  const [debugLog, setDebugLog] = useState<DebugEvent[]>([]);

  // refs
  const vadRef = useRef<MicVAD | null>(null);
  const destroyedRef = useRef(false);
  const isFetchingRef = useRef(false);

  const { playResponse, close: closeAudio } = useAudioQueue();

  const isWaiting = status === "waiting" || isFetchingRef.current;

  const avatarState: AvatarState = (() => {
    switch (status) {
      case "listening": return "listening";
      case "speaking": return "listening";
      case "ai_speaking": return "speaking";
      case "waiting": return "thinking";
      default: return "idle";
    }
  })();

  // ── 디버그 로그 ──────────────────────────────────────────────
  const pushLog = useCallback((label: string, color: DebugEvent["color"]) => {
    const entry: DebugEvent = { ts: nowStr(), label, color };
    console.log(`[Debug] ${entry.ts} ${label}`);
    setDebugLog((prev) => [entry, ...prev].slice(0, MAX_LOG));
  }, []);

  // ── HTTP POST 통신 ──────────────────────────────────────────
  const sendAudioData = async (audioBlob: Blob) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    setStatus("waiting");
    pushLog(`▶ 서버 전송 중... (${Math.round(audioBlob.size / 1024)}KB)`, "blue");

    try {
      const formData = new FormData();
      formData.append("file", audioBlob, "audio.wav");

      const res = await fetch(`${BACKEND_URL}/api/audio-to-text`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error(`서버 에러 (${res.status})`);
      }

      const data = await res.json();

      const reply = data.reply;
      const audioB64 = data.audio;
      const mimeType = data.mime_type || "audio/wav";

      if (reply) {
        pushLog(`◀ AI 텍스트: ${reply}`, "green");
      }

      if (audioB64) {
        pushLog(`◀ 오디오 수신 (${Math.round((audioB64.length * 3) / 4 / 1024)}KB)`, "blue");
        setStatus("ai_speaking");
        await playResponse(audioB64, mimeType);
        pushLog("✓ 재생 완료", "blue");
      }

    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      pushLog(`✗ 통신 오류: ${msg}`, "red");
      setError(msg);
    } finally {
      isFetchingRef.current = false;
      setStatus((prev) => (prev === "ai_speaking" || prev === "waiting") ? "listening" : prev);
    }
  };

  // ── MicVAD 초기화 ────────────────────────────────────────────
  useEffect(() => {
    destroyedRef.current = false;

    MicVAD.new({
      startOnLoad: false,
      baseAssetPath: "/",
      onnxWASMBasePath: "/",

      onSpeechStart() {
        if (isFetchingRef.current) return; // 서버 요청 중이면 채집 안함
        pushLog("🎙 사용자가 말하기 시작함", "yellow");
        setStatus((prev) => (prev === "listening" ? "speaking" : prev));
      },

      onSpeechEnd(audio: Float32Array) {
        if (isFetchingRef.current) return;
        pushLog("🔇 사용자가 말하기 끝남", "yellow");
        setStatus("waiting");

        // VAD가 제공하는 Float32Array(16kHz)를 WAV Blob으로 변환해서 서버 전송
        const wavBlob = encodeWAV(audio, 16000);
        void sendAudioData(wavBlob);
      },

      onVADMisfire() {
        if (isFetchingRef.current) return;
        pushLog("⚡ 의미 없는 소음(VAD misfire)", "red");
        setStatus((prev) => (prev === "speaking" ? "listening" : prev));
      },
    })
      .then((myvad) => {
        if (destroyedRef.current) { void myvad.destroy(); return; }
        vadRef.current = myvad;
        setLoading(false);
        pushLog("✓ VAD 초기화 완료", "green");
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : String(err);
        pushLog(`✗ VAD 초기화 실패: ${msg}`, "red");
        setError(msg);
        setLoading(false);
      });

    return () => {
      destroyedRef.current = true;
      const vad = vadRef.current;
      if (vad) { vadRef.current = null; void vad.destroy(); }
      closeAudio();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Force commit (아바타 탭) ─────────────────────────────────
  const forceCommit = useCallback(() => {
    if (isFetchingRef.current) return;
    pushLog("👆 아바타 강제 탭! 빈 오디오 전송", "yellow");

    // 0.5초짜리 짧은 빈 소리를 만들어서 강제 전송
    const sampleRate = 16000;
    const durationSec = 0.5;
    const silentFloat32 = new Float32Array(sampleRate * durationSec);
    const wavBlob = encodeWAV(silentFloat32, sampleRate);

    void sendAudioData(wavBlob);
  }, []);

  // ── 세션 시작 / 중지 ─────────────────────────────────────────
  const start = useCallback(() => {
    const vad = vadRef.current;
    if (!vad) return;
    void vad.start();
    setStatus("listening");
    pushLog("▶ 세션 시작", "green");
  }, [pushLog]);

  const stop = useCallback(() => {
    const vad = vadRef.current;
    if (vad) void vad.pause();
    closeAudio();
    setStatus("idle");
    pushLog("■ 세션 중지", "yellow");
  }, [closeAudio, pushLog]);

  const dismissEvent = useCallback(() => setGameEvent(null), []);

  return {
    status, isWaiting, avatarState,
    loading, error, gameEvent, debugLog,
    start, stop, forceCommit, dismissEvent,
  };
}
