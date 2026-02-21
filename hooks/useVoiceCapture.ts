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
  const activeSessionIdRef = useRef<string | null>(null);

  // MediaRecorder refs (for partial audio capture on forceCommit)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioStreamRef = useRef<MediaStream | null>(null);

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

  // ── HTTP POST 통신 (상태 유지) ──────────────────────────────
  const sendAudioData = async (audioBlob: Blob) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    setStatus("waiting");
    pushLog(`▶ 서버 전송 중... (${Math.round(audioBlob.size / 1024)}KB)`, "blue");

    try {
      const formData = new FormData();
      // 파일 확장자를 Blob의 mime type에 따라 동적으로 설정
      const fileName = audioBlob.type.includes("webm") ? "audio.webm" : "audio.wav";
      formData.append("file", audioBlob, fileName);

      let endpoint = "";
      if (activeSessionIdRef.current) {
        endpoint = `${BACKEND_URL}/api/continue-conversation`;
        formData.append("session_id", activeSessionIdRef.current);
      } else {
        endpoint = `${BACKEND_URL}/api/first-conversation`;
        formData.append("user_id_1", "0");
        formData.append("user_id_2", "0");
      }

      const res = await fetch(endpoint, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error(`서버 에러 (${res.status})`);
      }

      const data = await res.json();

      const newSessionId = data.session_id;
      if (newSessionId && !activeSessionIdRef.current) {
        activeSessionIdRef.current = newSessionId;
        pushLog(`✓ 세션 발급됨: ${newSessionId}`, "green");
      }

      const reply = data.reply;
      const audioB64 = data.audio;
      const mimeType = data.mime_type || "audio/wav";

      if (reply) {
        pushLog(`◀ AI 답변: ${reply}`, "green");
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

  // ── MediaRecorder 제어 로직 ──────────────────────────────────────
  const startMediaRecorder = async () => {
    try {
      if (!audioStreamRef.current) {
        audioStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      }
      const stream = audioStreamRef.current;
      audioChunksRef.current = [];

      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start(100); // Record in 100ms chunks to ensure data availability on quick stops
      pushLog("○ 오디오 레코딩 시작", "green");
    } catch (err) {
      pushLog("✗ 마이크 권한이 제한됨", "red");
    }
  };

  const stopAndProcessMediaRecorder = (): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const mediaRecorder = mediaRecorderRef.current;
      if (!mediaRecorder || mediaRecorder.state === "inactive") {
        resolve(null);
        return;
      }

      const handleStop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        audioChunksRef.current = [];
        resolve(audioBlob);
      };

      mediaRecorder.onstop = handleStop;
      mediaRecorder.stop();
    });
  };

  // ── MicVAD 초기화 ────────────────────────────────────────────
  useEffect(() => {
    destroyedRef.current = false;

    MicVAD.new({
      startOnLoad: false,
      baseAssetPath: "/",
      onnxWASMBasePath: "/",

      onSpeechStart() {
        if (isFetchingRef.current) return;
        pushLog("🎙 사용자가 말하기 시작함", "yellow");
        setStatus((prev) => (prev === "listening" ? "speaking" : prev));
      },

      async onSpeechEnd(audio: Float32Array) {
        if (isFetchingRef.current) return;
        pushLog("🔇 사용자가 말하기 끝남", "yellow");
        setStatus("waiting");

        // VAD가 끝났으므로 진행 중이던 MediaRecorder 녹음본을 뽑아냄
        const recordedWebm = await stopAndProcessMediaRecorder();

        // VAD가 제공하는 백업용 Float32Array(16kHz)를 WAV Blob으로 변환 (보조용)
        const vadWavBlob = encodeWAV(audio, 16000);

        // 브라우저 포맷(WebM)이 있으면 우선 사용하고, 없으면 VAD의 16kHz WAV 사용
        const finalBlob = recordedWebm && recordedWebm.size > 0 ? recordedWebm : vadWavBlob;

        void sendAudioData(finalBlob);
      },

      onVADMisfire() {
        if (isFetchingRef.current) return;
        pushLog("⚡ 의미 없는 소음(VAD misfire)", "red");
        setStatus((prev) => (prev === "speaking" ? "listening" : prev));
        // Misfire면 레코더 초기화
        void stopAndProcessMediaRecorder().then(() => startMediaRecorder());
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

      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach(track => track.stop());
      }

      closeAudio();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Force commit (아바타 탭) ─────────────────────────────────
  const forceCommit = useCallback(async () => {
    if (isFetchingRef.current) return;
    pushLog("👆 아바타 강제 탭! 누적 오디오 전송", "yellow");
    setStatus("waiting");

    // VAD 강제 일시 정지 (진행 중인 VAD 버퍼링 캔슬용)
    const vad = vadRef.current;
    if (vad) void vad.pause();

    // 이때까지 모인 MediaRecorder 녹음본 추출
    let recordedBlob = await stopAndProcessMediaRecorder();

    // 혹시라도 (너무 빨리 눌러서) 0바이트면 짧은 빈 WAV 생성
    if (!recordedBlob || recordedBlob.size === 0) {
      const sampleRate = 16000;
      const durationSec = 0.5;
      const silentFloat32 = new Float32Array(sampleRate * durationSec);
      recordedBlob = encodeWAV(silentFloat32, sampleRate);
      pushLog("빈 오디오(fallback) 생성됨", "yellow");
    }

    await sendAudioData(recordedBlob);

    // 처리가 끝나고 idle/listening 상태로 돌아갈때 VAD 재기동
    if (vadRef.current && !destroyedRef.current) {
      void vadRef.current.start();
      void startMediaRecorder(); // 다음 음성 캡처용으로 레코더 재시작
    }

  }, [sendAudioData, pushLog]);

  // ── 세션 시작 / 중지 ─────────────────────────────────────────
  const start = useCallback(() => {
    const vad = vadRef.current;
    if (!vad) return;
    void vad.start();
    void startMediaRecorder();
    setStatus("listening");
    pushLog("▶ 세션 시작", "green");
  }, [pushLog]);

  const stop = useCallback(() => {
    const vad = vadRef.current;
    if (vad) void vad.pause();

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }

    closeAudio();
    activeSessionIdRef.current = null;
    setStatus("idle");
    pushLog("■ 세션 중지 및 초기화", "yellow");
  }, [closeAudio, pushLog]);

  const dismissEvent = useCallback(() => setGameEvent(null), []);

  return {
    status, isWaiting, avatarState,
    loading, error, gameEvent, debugLog,
    start, stop, forceCommit, dismissEvent,
  };
}
