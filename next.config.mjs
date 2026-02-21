/** @type {import('next').NextConfig} */
const nextConfig = {
  // React StrictMode causes double useEffect invocation in dev, which calls
  // destroy() on an uninitialized MicVAD → "null stream, audio context, or processor adapter"
  reactStrictMode: false,
  // Cross-Origin-Isolation: SharedArrayBuffer (onnxruntime-web WASM 스레딩) 에 필수
  async headers() {
    return [
      {
        // 모든 페이지에 Cross-Origin-Isolation 적용 (SharedArrayBuffer 필수)
        source: "/(.*)",
        headers: [
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Cross-Origin-Embedder-Policy", value: "require-corp" },
        ],
      },
      {
        // public/ 의 WASM·ONNX·worklet 파일에 CORP 헤더 추가
        // (COEP require-corp 환경에서 same-origin 리소스도 이 헤더가 필요)
        source: "/:file(.*\\.wasm|.*\\.onnx|vad\\.worklet\\.bundle\\.min\\.js)",
        headers: [
          { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
        ],
      },
    ];
  },

  webpack(config, { isServer }) {
    if (!isServer) {
      // @ricky0123/vad-web 이 Node.js 내장 모듈을 참조해 브라우저 번들 실패 방지
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      };
    }
    return config;
  },
};

export default nextConfig;
