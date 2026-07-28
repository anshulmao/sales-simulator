// Client-only. Converts the MediaRecorder blob (webm/opus in Chrome) into the
// mono 16-bit WAV base64 the voice-scoring model accepts — the chat audio API
// takes wav/mp3, not webm, and the browser has no mp3 encoder, so WAV it is.
//
// 16 kHz mono keeps speech fully intelligible while bounding payload size:
// ~1.9 MB per minute of WAV. MAX_SECONDS caps the request at roughly 5.7 MB
// raw (~7.6 MB as base64) from the START of the call — delivery habits show up
// immediately, so the opening minutes are representative. (Note for deploy:
// hosted platforms with small request-body limits, e.g. Vercel's ~4.5 MB, will
// need this lowered or the upload moved to blob storage.)

const TARGET_RATE = 16000;
const MAX_SECONDS = 180;

export async function blobToWavBase64(blob: Blob): Promise<string | null> {
  try {
    const encoded = await blob.arrayBuffer();

    // Decode at the recording's native rate first, then resample offline.
    const decodeCtx = new AudioContext();
    let decoded: AudioBuffer;
    try {
      decoded = await decodeCtx.decodeAudioData(encoded);
    } finally {
      decodeCtx.close();
    }

    const seconds = Math.min(decoded.duration, MAX_SECONDS);
    const frameCount = Math.max(1, Math.floor(seconds * TARGET_RATE));
    const offline = new OfflineAudioContext(1, frameCount, TARGET_RATE);
    const source = offline.createBufferSource();
    source.buffer = decoded;
    source.connect(offline.destination);
    source.start();
    const rendered = await offline.startRendering();

    return wavBase64FromPcm(rendered.getChannelData(0), TARGET_RATE);
  } catch {
    // Unsupported codec / decode failure — voice analysis is best-effort, the
    // caller simply skips it.
    return null;
  }
}

// Standard 44-byte-header WAV: mono, 16-bit signed PCM.
function wavBase64FromPcm(samples: Float32Array, sampleRate: number): string {
  const dataLength = samples.length * 2;
  const buffer = new ArrayBuffer(44 + dataLength);
  const view = new DataView(buffer);

  const writeString = (offset: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(offset + i, s.charCodeAt(i));
  };

  writeString(0, "RIFF");
  view.setUint32(4, 36 + dataLength, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true); // fmt chunk size
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); // byte rate
  view.setUint16(32, 2, true); // block align
  view.setUint16(34, 16, true); // bits per sample
  writeString(36, "data");
  view.setUint32(40, dataLength, true);

  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }

  // btoa in bounded slices — one giant fromCharCode call overflows the stack.
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(binary);
}
