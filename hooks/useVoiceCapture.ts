"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { MicVAD } from "@ricky0123/vad-web";
import { useAudioQueue } from "@/hooks/useAudioQueue";
import { useAppContext } from "@/context/AppContext";
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
  registerSpeechHandler: (handler: (blob: Blob) => void) => void;
  unregisterSpeechHandler: () => void;
  triggerPsychTest: () => Promise<void>;
  submitPsychTestResult: (blob1: Blob, blob2: Blob) => Promise<any>;
  triggerQuiz: () => Promise<void>;
  submitQuizResult: (blob: Blob, questionId: string) => Promise<any>;
  triggerBalanceGame: () => Promise<void>;
  submitBalanceGameResult: (blobs: [Blob, Blob, Blob], questionTexts: [string, string, string]) => Promise<any>;
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
  const { state: appState } = useAppContext();
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
  const customSpeechHandlerRef = useRef<((blob: Blob) => void) | null>(null);

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
        formData.append("user_id_1", appState.userProfile?.userId || "0");
        formData.append("user_id_2", appState.matchedUser?.userId || "0");
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

        await playResponse(audioB64, mimeType, () => {
          pushLog("✓ 오디오 재생 완료", "green");
          isFetchingRef.current = false;
          setStatus((prev) => (prev === "ai_speaking" || prev === "waiting") ? "listening" : prev);
        });
      } else {
        isFetchingRef.current = false;
        setStatus((prev) => (prev === "ai_speaking" || prev === "waiting") ? "listening" : prev);
      }

    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      pushLog(`✗ 통신 오류: ${msg}`, "red");
      setError(msg);
      isFetchingRef.current = false;
      setStatus((prev) => (prev === "ai_speaking" || prev === "waiting") ? "listening" : prev);
    }
  };

  const registerSpeechHandler = useCallback((handler: (blob: Blob) => void) => {
    customSpeechHandlerRef.current = handler;
  }, []);

  const unregisterSpeechHandler = useCallback(() => {
    customSpeechHandlerRef.current = null;
  }, []);

  const triggerPsychTest = useCallback(async () => {
    if (isFetchingRef.current) return;
    if (!activeSessionIdRef.current) {
      pushLog("✗ 진행 중인 세션이 없어 심리테스트를 시작할 수 없어요", "red");
      return;
    }

    isFetchingRef.current = true;
    setStatus("waiting");
    pushLog("▶ 심리테스트 문제 요청 중...", "blue");

    try {
      const formData = new FormData();
      const sampleRate = 16000;
      const silentFloat32 = new Float32Array(sampleRate * 0.5);
      const wavBlob = encodeWAV(silentFloat32, sampleRate);
      formData.append("file", wavBlob, "audio.wav");
      formData.append("session_id", activeSessionIdRef.current);

      const res = await fetch(`${BACKEND_URL}/api/psych-test`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error(`서버 에러 (${res.status})`);
      const data = await res.json();

      const reply = data.reply || data.response || "심리테스트 질문입니다.";
      const audioB64 = data.audio;
      const mimeType = data.mime_type || "audio/wav";

      setGameEvent({ type: "psych", question: reply, choices: [] });

      if (audioB64) {
        pushLog(`◀ 오디오 수신 (${Math.round((audioB64.length * 3) / 4 / 1024)}KB)`, "blue");
        setStatus("ai_speaking");

        await playResponse(audioB64, mimeType, () => {
          isFetchingRef.current = false;
          setStatus((prev) => (prev === "ai_speaking" || prev === "waiting") ? "listening" : prev);
        });
      } else {
        isFetchingRef.current = false;
        setStatus((prev) => (prev === "ai_speaking" || prev === "waiting") ? "listening" : prev);
      }
    } catch (err) {
      pushLog(`✗ 심리테스트 호출 오류: ${err}`, "red");
      isFetchingRef.current = false;
      setStatus((prev) => (prev === "ai_speaking" || prev === "waiting") ? "listening" : prev);
    }
  }, [playResponse, pushLog]);

  const submitPsychTestResult = useCallback(async (blob1: Blob, blob2: Blob) => {
    if (!activeSessionIdRef.current) throw new Error("No active session");

    isFetchingRef.current = true;
    setStatus("waiting");
    pushLog(`▶ 심리테스트 결과 분석 중...`, "blue");

    try {
      const formData = new FormData();
      formData.append("session_id", activeSessionIdRef.current);
      const ext1 = blob1.type.includes("webm") ? "webm" : "wav";
      const ext2 = blob2.type.includes("webm") ? "webm" : "wav";
      formData.append("file_1", blob1, `audio1.${ext1}`);
      formData.append("file_2", blob2, `audio2.${ext2}`);

      const res = await fetch(`${BACKEND_URL}/api/psych-test-result`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error(`서버 에러 (${res.status})`);
      const data = await res.json();

      if (data.audio) {
        setStatus("ai_speaking");

        await playResponse(data.audio, data.mime_type || "audio/wav", () => {
          isFetchingRef.current = false;
          setStatus((prev) => (prev === "ai_speaking" || prev === "waiting") ? "listening" : prev);
        });
      } else {
        isFetchingRef.current = false;
        setStatus((prev) => (prev === "ai_speaking" || prev === "waiting") ? "listening" : prev);
      }

      return data;
    } catch (err) {
      pushLog(`✗ 결과 분석 오류: ${err}`, "red");
      isFetchingRef.current = false;
      setStatus((prev) => (prev === "ai_speaking" || prev === "waiting") ? "listening" : prev);
      throw err;
    }
  }, [playResponse, pushLog]);

  // ── 퀴즈 API ──────────────────────────────────────────────────
  const triggerQuiz = useCallback(async () => {
    if (isFetchingRef.current) return;
    if (!activeSessionIdRef.current) {
      pushLog("✗ 진행 중인 세션이 없어 퀴즈를 시작할 수 없어요", "red");
      return;
    }

    isFetchingRef.current = true;
    setStatus("waiting");
    pushLog("▶ 퀴즈 문제 요청 중...", "blue");

    try {
      const body = new URLSearchParams();
      body.append("session_id", activeSessionIdRef.current);

      const res = await fetch(`${BACKEND_URL}/api/four-choice-quiz`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: body.toString(),
      });

      if (!res.ok) throw new Error(`서버 에러 (${res.status})`);
      const data = await res.json();

      // data = { question_id, text, options(array), audio, mime_type }
      setGameEvent({
        type: "quiz",
        questionId: data.question_id,
        question: data.text,
        choices: data.options || ["A", "B", "C", "D"]
      });

      if (data.audio) {
        pushLog(`◀ 퀴즈 문제 오디오 수신`, "blue");
        setStatus("ai_speaking");

        await playResponse(data.audio, data.mime_type || "audio/wav", () => {
          isFetchingRef.current = false;
          setStatus((prev) => (prev === "ai_speaking" || prev === "waiting") ? "listening" : prev);
        });
      } else {
        isFetchingRef.current = false;
        setStatus((prev) => (prev === "ai_speaking" || prev === "waiting") ? "listening" : prev);
      }

    } catch (err) {
      pushLog(`✗ 퀴즈 호출 오류: ${err}`, "red");
      isFetchingRef.current = false;
      setStatus((prev) => (prev === "ai_speaking" || prev === "waiting") ? "listening" : prev);
    }
  }, [playResponse, pushLog]);

  const submitQuizResult = useCallback(async (blob: Blob, questionId: string) => {
    if (!activeSessionIdRef.current) throw new Error("No active session");

    isFetchingRef.current = true;
    setStatus("waiting");
    pushLog(`▶ 퀴즈 정답 확인 중...`, "blue");

    try {
      const formData = new FormData();
      const ext = blob.type.includes("webm") ? "webm" : "wav";
      formData.append("file", blob, `answer.${ext}`);
      formData.append("question_id", questionId);
      formData.append("session_id", activeSessionIdRef.current);

      const res = await fetch(`${BACKEND_URL}/api/quiz-result`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error(`서버 에러 (${res.status})`);
      const data = await res.json();

      if (data.audio) {
        setStatus("ai_speaking");
        await playResponse(data.audio, data.mime_type || "audio/wav", () => {
          isFetchingRef.current = false;
          setStatus((prev) => (prev === "ai_speaking" || prev === "waiting") ? "listening" : prev);
        });
      } else {
        isFetchingRef.current = false;
        setStatus((prev) => (prev === "ai_speaking" || prev === "waiting") ? "listening" : prev);
      }

      return data;
    } catch (err) {
      pushLog(`✗ 퀴즈 결과 분석 오류: ${err}`, "red");
      isFetchingRef.current = false;
      setStatus((prev) => (prev === "ai_speaking" || prev === "waiting") ? "listening" : prev);
      throw err;
    }
  }, [playResponse, pushLog]);

  // ── 밸런스 게임 API ────────────────────────────────────────────────
  const triggerBalanceGame = useCallback(async () => {
    if (isFetchingRef.current) return;
    if (!activeSessionIdRef.current) {
      pushLog("✗ 진행 중인 세션이 없어 밸런스 게임을 시작할 수 없어요", "red");
      return;
    }

    isFetchingRef.current = true;
    setStatus("waiting");
    pushLog("▶ 밸런스 게임 문제 요청 중...", "blue");

    try {
      const formData = new FormData();
      formData.append("session_id", activeSessionIdRef.current);

      const res = await fetch(`${BACKEND_URL}/api/balance-game-questions`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error(`서버 에러 (${res.status})`);
      const data = await res.json();

      // Expected: { questions: [{ text, options: [A, B], audio, mime_type }, x3] }
      const questions = data.questions as { text: string; options: string[]; audio?: string; mime_type?: string }[];

      setGameEvent({
        type: "balance",
        question: questions[0].text,
        choices: questions[0].options,
        questions,
      });

      if (questions[0].audio) {
        pushLog(`◀ 밸런스 게임 첫 번째 문제 오디오 수신`, "blue");
        setStatus("ai_speaking");
        await playResponse(questions[0].audio, questions[0].mime_type || "audio/wav", () => {
          isFetchingRef.current = false;
          setStatus((prev) => (prev === "ai_speaking" || prev === "waiting") ? "listening" : prev);
        });
      } else {
        isFetchingRef.current = false;
        setStatus((prev) => (prev === "ai_speaking" || prev === "waiting") ? "listening" : prev);
      }
    } catch (err) {
      pushLog(`✗ 밸런스 게임 호출 오류: ${err}`, "red");
      isFetchingRef.current = false;
      setStatus((prev) => (prev === "ai_speaking" || prev === "waiting") ? "listening" : prev);
    }
  }, [playResponse, pushLog]);

  const submitBalanceGameResult = useCallback(async (blobs: [Blob, Blob, Blob], questionTexts: [string, string, string]) => {
    if (!activeSessionIdRef.current) throw new Error("No active session");

    isFetchingRef.current = true;
    setStatus("waiting");
    pushLog(`▶ 밸런스 게임 결과 분석 중...`, "blue");

    try {
      const formData = new FormData();
      formData.append("session_id", activeSessionIdRef.current);
      formData.append("question_text_1", questionTexts[0]);
      formData.append("question_text_2", questionTexts[1]);
      formData.append("question_text_3", questionTexts[2]);
      const ext = (b: Blob) => b.type.includes("webm") ? "webm" : "wav";
      formData.append("file_1", blobs[0], `answer1.${ext(blobs[0])}`);
      formData.append("file_2", blobs[1], `answer2.${ext(blobs[1])}`);
      formData.append("file_3", blobs[2], `answer3.${ext(blobs[2])}`);

      const res = await fetch(`${BACKEND_URL}/api/balance-game-result`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error(`서버 에러 (${res.status})`);
      const data = await res.json();

      if (data.audio) {
        setStatus("ai_speaking");
        await playResponse(data.audio, data.mime_type || "audio/wav", () => {
          isFetchingRef.current = false;
          setStatus((prev) => (prev === "ai_speaking" || prev === "waiting") ? "listening" : prev);
        });
      } else {
        isFetchingRef.current = false;
        setStatus((prev) => (prev === "ai_speaking" || prev === "waiting") ? "listening" : prev);
      }

      return data;
    } catch (err) {
      pushLog(`✗ 밸런스 게임 결과 분석 오류: ${err}`, "red");
      isFetchingRef.current = false;
      setStatus((prev) => (prev === "ai_speaking" || prev === "waiting") ? "listening" : prev);
      throw err;
    }
  }, [playResponse, pushLog]);

  // ── MediaRecorder 제어 로직 ──────────────────────────────────────
  const startMediaRecorder = async () => {
    try {
      if (!audioStreamRef.current) {
        audioStreamRef.current = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          }
        });
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
      positiveSpeechThreshold: 0.90, // 좀 더 확실한 음성만 감지하도록 상향 (기본값보다 높음)
      negativeSpeechThreshold: 0.75, // 빨리 끊기도록 하향 조정

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

        if (customSpeechHandlerRef.current) {
          customSpeechHandlerRef.current(finalBlob);
          // 핸들러가 서버 요청을 시작하지 않았으면(isFetchingRef 여전히 false) 바로 listening 복귀
          if (!isFetchingRef.current) {
            setStatus("listening");
          }
        } else {
          void sendAudioData(finalBlob);
        }
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

    if (customSpeechHandlerRef.current) {
      customSpeechHandlerRef.current(recordedBlob);
      // 핸들러가 서버 요청을 시작하지 않았으면(isFetchingRef 여전히 false) 바로 listening 복귀
      if (!isFetchingRef.current) {
        setStatus("listening");
      }
    } else {
      await sendAudioData(recordedBlob);
    }

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
    registerSpeechHandler, unregisterSpeechHandler,
    triggerPsychTest, submitPsychTestResult,
    triggerQuiz, submitQuizResult,
    triggerBalanceGame, submitBalanceGameResult,
  };
}
