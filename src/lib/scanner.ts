"use client";

/**
 * Barcode scanning — uses the browser-native BarcodeDetector when available,
 * falls back to @zxing/browser. Both paths report results through the same
 * onResult callback, and both call stop() when the consumer is done.
 */

const NATIVE_FORMATS = [
  "ean_13",
  "ean_8",
  "upc_a",
  "upc_e",
  "code_128",
  "code_39",
] as const;

type NativeFormat = (typeof NATIVE_FORMATS)[number];

interface NativeBarcodeDetector {
  detect(source: CanvasImageSource): Promise<{ rawValue: string }[]>;
}

interface NativeBarcodeDetectorCtor {
  new (options?: { formats: readonly NativeFormat[] }): NativeBarcodeDetector;
}

declare global {
  interface Window {
    BarcodeDetector?: NativeBarcodeDetectorCtor;
  }
}

export interface ScannerHandle {
  stop: () => void;
}

export function hasNativeBarcodeDetector(): boolean {
  return typeof window !== "undefined" && "BarcodeDetector" in window;
}

/**
 * Start scanning for barcodes from the given <video> element. The video must
 * already be playing (caller handles getUserMedia + .play()).
 *
 * `onResult` fires once with the decoded value, then the scanner stops.
 * `onError` fires on unrecoverable errors (e.g. zxing init failure).
 */
export async function startBarcodeScanner(
  video: HTMLVideoElement,
  onResult: (value: string) => void,
  onError?: (err: unknown) => void
): Promise<ScannerHandle> {
  let stopped = false;

  if (hasNativeBarcodeDetector()) {
    const detector = new window.BarcodeDetector!({
      formats: NATIVE_FORMATS,
    });
    let raf = 0;

    const tick = async () => {
      if (stopped) return;
      try {
        // Skip while the video isn't producing frames yet.
        if (video.readyState >= 2) {
          const results = await detector.detect(video);
          if (!stopped && results.length > 0 && results[0].rawValue) {
            stopped = true;
            cancelAnimationFrame(raf);
            onResult(results[0].rawValue);
            return;
          }
        }
      } catch (err) {
        // Some Android Chrome builds throw transient errors mid-detect; keep going.
        onError?.(err);
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);

    return {
      stop: () => {
        stopped = true;
        cancelAnimationFrame(raf);
      },
    };
  }

  // Fallback to zxing — supports the same UPC/EAN/Code 128/39 formats.
  try {
    const { BrowserMultiFormatReader } = await import("@zxing/browser");
    const reader = new BrowserMultiFormatReader();
    const controls = await reader.decodeFromVideoElement(video, (result, err) => {
      if (stopped) return;
      if (result) {
        stopped = true;
        controls.stop();
        onResult(result.getText());
      } else if (err && err.name !== "NotFoundException") {
        onError?.(err);
      }
    });

    return {
      stop: () => {
        stopped = true;
        controls.stop();
      },
    };
  } catch (err) {
    onError?.(err);
    return { stop: () => {} };
  }
}

/**
 * Open a camera stream for the rear-facing lens. Returns the MediaStream so
 * the caller can attach to <video> and clean up via .getTracks().forEach(stop).
 */
export async function openCameraStream(): Promise<MediaStream> {
  return navigator.mediaDevices.getUserMedia({
    video: {
      facingMode: "environment",
      width: { ideal: 1920 },
      height: { ideal: 1080 },
    },
    audio: false,
  });
}

/** Capture a JPEG (base64) frame from a playing <video>. */
export function captureFrame(video: HTMLVideoElement, quality = 0.8): string {
  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context not available");
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", quality);
}

/** Stop all tracks on a MediaStream (idempotent). */
export function stopStream(stream: MediaStream | null) {
  if (!stream) return;
  for (const track of stream.getTracks()) {
    track.stop();
  }
}
