"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { MicVAD } from "@ricky0123/vad-web";
import { useAudioQueue } from "@/hooks/useAudioQueue";
import type { AvatarState, GameEvent } from "@/types";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000";
const WS_URL = BACKEND_URL.replace(/^http/, "ws") + "/ws/audio";

/** ScriptProcessorNode 버퍼 크기 (samples). 4096 ≈ 85–256 ms */
const CHUNK_SIZE = 4096;

export type VoiceStatus = "idle" | "listening" | "speaking" | "ai_speaking" | "waiting";
export type WSStatus = "disconnected" | "connecting" | "connected" | "error";

export interface DebugEvent {
  ts: string;
  label: string;
  color: "green" | "yellow" | "blue" | "red" | "purple";
}

export interface UseVoiceCaptureReturn {
  status: VoiceStatus;
  wsStatus: WSStatus;
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

/** Float32 PCM → Int16 PCM ArrayBuffer */
function float32ToInt16(samples: Float32Array): ArrayBuffer {
  const buf = new ArrayBuffer(samples.length * 2);
  const view = new DataView(buf);
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return buf;
}

const MAX_LOG = 40;

// ── Hook ─────────────────────────────────────────────────────

export function useVoiceCapture(): UseVoiceCaptureReturn {
  const [status, setStatus] = useState<VoiceStatus>("idle");
  const [wsStatus, setWsStatus] = useState<WSStatus>("disconnected");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [gameEvent, setGameEvent] = useState<GameEvent | null>(null);
  const [debugLog, setDebugLog] = useState<DebugEvent[]>([]);

  // refs — 클로저 갱신 없이 항상 최신값
  const sessionIdRef = useRef<string>(crypto.randomUUID());
  const vadRef = useRef<MicVAD | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const isSpeakingRef = useRef(false);   // VAD onSpeechStart/End 이 토글
  const sampleRateRef = useRef(16000);
  const destroyedRef = useRef(false);
  const chunkCountRef = useRef(0);

  const { playResponse, close: closeAudio } = useAudioQueue();

  const isWaiting = status === "waiting";

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

  // ── WebSocket ────────────────────────────────────────────────
  const openWS = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;
    setWsStatus("connecting");
    pushLog("WS 연결 시도...", "yellow");

    const ws = new WebSocket(`${WS_URL}?session_id=${sessionIdRef.current}`);
    ws.binaryType = "arraybuffer";
    wsRef.current = ws;

    ws.onopen = () => { setWsStatus("connected"); pushLog("✓ WS 연결됨", "green"); };
    ws.onerror = () => { setWsStatus("error"); pushLog("✗ WS 에러", "red"); };
    ws.onclose = (e) => {
      setWsStatus("disconnected");
      pushLog(`WS 종료 (code=${e.code})`, "yellow");
      wsRef.current = null;
    };

    ws.onmessage = async (evt) => {
      if (typeof evt.data !== "string") return;
      let msg: { type: string; data?: string; mime_type?: string; event?: GameEvent; message?: string };
      try { msg = JSON.parse(evt.data); } catch { return; }

      if (msg.type === "audio" && msg.data) {
        const kb = Math.round((msg.data.length * 3) / 4 / 1024);
        pushLog(`◀ 오디오 수신 ${kb}KB (${msg.mime_type})`, "blue");
        setStatus("ai_speaking");
        await playResponse(msg.data, msg.mime_type ?? "audio/wav");
        pushLog("✓ 재생 완료", "blue");
        setStatus((prev) => (prev === "ai_speaking" || prev === "waiting") ? "listening" : prev);
      } else if (msg.type === "event" && msg.event) {
        pushLog(`🎮 게임 이벤트: ${msg.event.type}`, "purple");
        setGameEvent(msg.event);
      } else if (msg.type === "error") {
        pushLog(`✗ 서버 오류: ${msg.message}`, "red");
      }
    };
  }, [playResponse, pushLog]);

  const closeWS = useCallback(() => {
    wsRef.current?.close(1000, "session ended");
    wsRef.current = null;
  }, []);

  // ── ScriptProcessorNode 스트리밍 ─────────────────────────────
  const startStreaming = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true },
      });
      mediaStreamRef.current = stream;

      const ctx = new AudioContext();           // 브라우저 native rate (보통 44100 or 48000)
      audioCtxRef.current = ctx;
      sampleRateRef.current = ctx.sampleRate;
      pushLog(`✓ AudioContext ${ctx.sampleRate}Hz`, "green");

      const source = ctx.createMediaStreamSource(stream);
      const processor = ctx.createScriptProcessor(CHUNK_SIZE, 1, 1);
      processorRef.current = processor;
      chunkCountRef.current = 0;

      processor.onaudioprocess = (e) => {
        if (!isSpeakingRef.current) return;
        const ws = wsRef.current;
        if (!ws || ws.readyState !== WebSocket.OPEN) return;
        const pcm = float32ToInt16(e.inputBuffer.getChannelData(0));
        ws.send(pcm);
        chunkCountRef.current += 1;
      };

      source.connect(processor);
      processor.connect(ctx.destination); // onaudioprocess가 동작하려면 연결 필요
      pushLog("✓ PCM 스트리밍 준비", "green");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      pushLog(`✗ 마이크 오류: ${msg}`, "red");
      setError(msg);
    }
  }, [pushLog]);

  const stopStreaming = useCallback(() => {
    isSpeakingRef.current = false;
    processorRef.current?.disconnect();
    processorRef.current = null;
    void audioCtxRef.current?.close();
    audioCtxRef.current = null;
    mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
    mediaStreamRef.current = null;
  }, []);

  // ── speech_end 전송 공통 헬퍼 ────────────────────────────────
  const sendSpeechEnd = useCallback((isForce = false) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      pushLog(`✗ ${isForce ? "force_commit" : "speech_end"}: WS 미연결`, "red");
      return;
    }
    const chunks = chunkCountRef.current;
    chunkCountRef.current = 0;
    pushLog(`▶ ${isForce ? "force_commit" : "speech_end"} 전송 (청크 ${chunks}개, ${sampleRateRef.current}Hz)`, "green");
    ws.send(JSON.stringify({ type: isForce ? "force_commit" : "speech_end", sample_rate: sampleRateRef.current }));
  }, [pushLog]);

  // ── MicVAD 초기화 ────────────────────────────────────────────
  useEffect(() => {
    destroyedRef.current = false;

    MicVAD.new({
      startOnLoad: false,
      baseAssetPath: "/",
      onnxWASMBasePath: "/",

      onSpeechStart() {
        pushLog("🎙 SPEECH START — 스트리밍 시작", "yellow");
        isSpeakingRef.current = true;
        chunkCountRef.current = 0;
        setStatus((prev) => (prev === "listening" ? "speaking" : prev));
      },

      onSpeechEnd(_audio: Float32Array) {
        // _audio는 무시 — ScriptProcessorNode가 이미 스트리밍함
        isSpeakingRef.current = false;
        pushLog("🔇 SPEECH END — 스트리밍 종료", "yellow");
        setStatus("listening");
        sendSpeechEnd();
      },

      onVADMisfire() {
        isSpeakingRef.current = false;
        chunkCountRef.current = 0;
        pushLog("⚡ VAD misfire", "red");
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
      isSpeakingRef.current = false;
      const vad = vadRef.current;
      if (vad) { vadRef.current = null; void vad.destroy(); }
      stopStreaming();
      closeWS();
      closeAudio();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Force commit (아바타 탭) ─────────────────────────────────
  const forceCommit = useCallback(() => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      pushLog("✗ forceCommit: WS 미연결", "red");
      return;
    }
    pushLog("👆 FORCE COMMIT", "yellow");
    isSpeakingRef.current = false;  // 청크 전송 즉시 중단
    sendSpeechEnd(true); // Send 'force_commit' instead of 'speech_end'
    setStatus("waiting");
  }, [pushLog, sendSpeechEnd]);

  // ── 세션 시작 / 중지 ─────────────────────────────────────────
  const start = useCallback(() => {
    const vad = vadRef.current;
    if (!vad) return;
    openWS();
    void vad.start();
    void startStreaming();
    setStatus("listening");
    pushLog("▶ 세션 시작", "green");
  }, [openWS, startStreaming, pushLog]);

  const stop = useCallback(() => {
    isSpeakingRef.current = false;
    const vad = vadRef.current;
    if (vad) void vad.pause();
    stopStreaming();
    closeWS();
    closeAudio();
    setStatus("idle");
    pushLog("■ 세션 중지", "yellow");
  }, [stopStreaming, closeWS, closeAudio, pushLog]);

  const dismissEvent = useCallback(() => setGameEvent(null), []);

  return {
    status, wsStatus, isWaiting, avatarState,
    loading, error, gameEvent, debugLog,
    start, stop, forceCommit, dismissEvent,
  };
}
