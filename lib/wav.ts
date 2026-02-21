/**
 * Float32Array (16kHz, mono, [-1, 1]) → RIFF/WAV ArrayBuffer
 * 포맷: PCM 16-bit little-endian, 1채널, 16000Hz
 *
 * RIFF/WAV 헤더 레이아웃 (44바이트):
 *   0  RIFF
 *   4  파일 크기 - 8
 *   8  WAVE
 *  12  fmt
 *  16  fmt 청크 크기 = 16
 *  20  오디오 포맷 = 1 (PCM)
 *  22  채널 수 = 1
 *  24  샘플레이트 = 16000
 *  28  바이트레이트 = 32000
 *  32  블록 얼라인 = 2
 *  34  비트 심도 = 16
 *  36  data
 *  40  PCM 데이터 바이트 길이
 *  44  PCM 샘플 데이터
 */
export function encodeWAV(samples: Float32Array, sampleRate = 16000): ArrayBuffer {
  const numSamples = samples.length;
  const bytesPerSample = 2;
  const numChannels = 1;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataByteLength = numSamples * bytesPerSample;
  const headerByteLength = 44;
  const totalByteLength = headerByteLength + dataByteLength;

  const buffer = new ArrayBuffer(totalByteLength);
  const view = new DataView(buffer);

  function writeString(offset: number, s: string) {
    for (let i = 0; i < s.length; i++) {
      view.setUint8(offset + i, s.charCodeAt(i));
    }
  }

  writeString(0, "RIFF");
  view.setUint32(4, totalByteLength - 8, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bytesPerSample * 8, true);
  writeString(36, "data");
  view.setUint32(40, dataByteLength, true);

  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    const clamped = Math.max(-1, Math.min(1, samples[i]));
    const int16 = clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff;
    view.setInt16(offset, int16, true);
    offset += 2;
  }

  return buffer;
}
