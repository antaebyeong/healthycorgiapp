"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { CorgiMark } from "@/components/brand/CorgiMark";

const MAX_IMAGE_SIZE = 1280;
const JPEG_QUALITY = 0.8;
const VIDEO_RENDER_RETRY_MS = 800;
const CAMERA_PREVIEW_TIMEOUT_MS = 7000;
const IS_DEVELOPMENT = process.env.NODE_ENV === "development";

type InAppBrowserInfo = {
  isInApp: boolean;
  platform: "ios" | "android" | "other";
};

type CameraMessage = {
  title: string;
  description: string;
};

type CameraDebug = {
  videoWidth: number;
  videoHeight: number;
  readyState: number;
  streamActive: boolean;
};

function detectInAppBrowser(userAgent: string): InAppBrowserInfo {
  const normalized = userAgent.toLowerCase();
  const isInApp =
    normalized.includes("kakaotalk") ||
    normalized.includes("instagram") ||
    normalized.includes("naver") ||
    normalized.includes("fbav") ||
    normalized.includes("fban") ||
    normalized.includes("line/") ||
    normalized.includes("wv");

  const platform = /iphone|ipad|ipod/.test(normalized) ? "ios" : /android/.test(normalized) ? "android" : "other";
  return { isInApp, platform };
}

function getInAppBrowserGuide(info: InAppBrowserInfo): CameraMessage {
  const platformGuide =
    info.platform === "ios"
      ? "오른쪽 아래 또는 공유 메뉴에서 Safari로 열어주세요."
      : info.platform === "android"
        ? "오른쪽 위 메뉴에서 Chrome으로 열어주세요."
        : "기본 브라우저에서 다시 열어주세요.";

  return {
    title: "카메라 인증은 Safari 또는 Chrome에서 이용해주세요.",
    description: `카카오톡 안에서 열면 카메라 권한이 제한될 수 있습니다. ${platformGuide}`
  };
}

function getKoreaDateTime(date = new Date()) {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  }).format(date);
}

function getDownloadFileName(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  })
    .formatToParts(date)
    .reduce<Record<string, string>>((acc, part) => {
      if (part.type !== "literal") {
        acc[part.type] = part.value;
      }
      return acc;
    }, {});

  return `healthycorgi-${parts.year}${parts.month}${parts.day}-${parts.hour}${parts.minute}${parts.second}.jpg`;
}

function getResizedSize(width: number, height: number) {
  const longest = Math.max(width, height);

  if (longest <= MAX_IMAGE_SIZE) {
    return { width, height };
  }

  const scale = MAX_IMAGE_SIZE / longest;
  return {
    width: Math.round(width * scale),
    height: Math.round(height * scale)
  };
}

function isCameraPermissionError(error: unknown) {
  return error instanceof DOMException && (error.name === "NotAllowedError" || error.name === "PermissionDeniedError");
}

function getCameraErrorMessage(error: unknown): CameraMessage {
  if (error instanceof DOMException) {
    if (isCameraPermissionError(error)) {
      return {
        title: "카메라 권한이 필요합니다.",
        description: "브라우저 설정에서 카메라 권한을 허용한 뒤 다시 시도해주세요."
      };
    }

    if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
      return {
        title: "사용 가능한 카메라를 찾을 수 없습니다.",
        description: "모바일 기기에서 다시 시도해주세요."
      };
    }

    if (error.name === "NotReadableError") {
      return {
        title: "카메라를 사용할 수 없습니다.",
        description: "다른 앱에서 카메라를 사용 중일 수 있습니다."
      };
    }
  }

  return {
    title: "카메라를 시작할 수 없습니다.",
    description: "Safari에서 다시 시도해주세요."
  };
}

function drawRoundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  context.beginPath();

  if (typeof context.roundRect === "function") {
    context.roundRect(x, y, width, height, radius);
  } else {
    context.moveTo(x + radius, y);
    context.lineTo(x + width - radius, y);
    context.quadraticCurveTo(x + width, y, x + width, y + radius);
    context.lineTo(x + width, y + height - radius);
    context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    context.lineTo(x + radius, y + height);
    context.quadraticCurveTo(x, y + height, x, y + height - radius);
    context.lineTo(x, y + radius);
    context.quadraticCurveTo(x, y, x + radius, y);
  }

  context.closePath();
  context.fill();
}

function drawWatermark(context: CanvasRenderingContext2D, width: number, height: number, text: string) {
  const padding = Math.max(18, Math.round(width * 0.026));
  const fontSize = Math.max(18, Math.round(width * 0.034));

  context.font = `700 ${fontSize}px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
  context.textAlign = "center";
  context.textBaseline = "middle";

  const metrics = context.measureText(text);
  const boxWidth = Math.min(width - padding * 2, metrics.width + padding * 2);
  const boxHeight = fontSize + padding * 1.25;
  const x = (width - boxWidth) / 2;
  const y = height - padding - boxHeight;
  const radius = Math.max(10, Math.round(fontSize * 0.35));

  context.fillStyle = "rgba(20, 16, 12, 0.74)";
  drawRoundedRect(context, x, y, boxWidth, boxHeight, radius);

  context.fillStyle = "#FFFFFF";
  context.fillText(text, width / 2, y + boxHeight / 2);
}

function waitFrame() {
  return new Promise<void>((resolve) => {
    window.requestAnimationFrame(() => resolve());
  });
}

function wait(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function prepareVideoElement(video: HTMLVideoElement) {
  video.muted = true;
  video.autoplay = true;
  video.playsInline = true;
  video.controls = false;
  video.setAttribute("playsinline", "true");
  video.setAttribute("webkit-playsinline", "true");
}

async function playVideo(video: HTMLVideoElement) {
  prepareVideoElement(video);
  await video.play();
}

async function loadImageFromFile(file: File) {
  if ("createImageBitmap" in window) {
    const image = await createImageBitmap(file);
    return {
      source: image,
      width: image.width,
      height: image.height,
      cleanup: () => image.close()
    };
  }

  const url = URL.createObjectURL(file);
  const image = new Image();
  image.src = url;

  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error("Image load failed"));
  });

  return {
    source: image,
    width: image.naturalWidth,
    height: image.naturalHeight,
    cleanup: () => URL.revokeObjectURL(url)
  };
}

export function CertifyCamera() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const previewBlobRef = useRef<Blob | null>(null);
  const previewTimeoutRef = useRef<number | null>(null);
  const retryTimeoutRef = useRef<number | null>(null);
  const [currentTime, setCurrentTime] = useState(() => getKoreaDateTime());
  const [message, setMessage] = useState("버튼을 눌러 카메라 권한을 요청하세요.");
  const [cameraError, setCameraError] = useState<CameraMessage | null>(null);
  const [hasCameraStream, setHasCameraStream] = useState(false);
  const [isPreviewReady, setIsPreviewReady] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [downloadName, setDownloadName] = useState("healthycorgi-certification.jpg");
  const [uploadedRecordId, setUploadedRecordId] = useState<string | null>(null);
  const [inAppBrowser, setInAppBrowser] = useState<InAppBrowserInfo>({ isInApp: false, platform: "other" });
  const [debug, setDebug] = useState<CameraDebug>({
    videoWidth: 0,
    videoHeight: 0,
    readyState: 0,
    streamActive: false
  });

  const updateDebug = useCallback(() => {
    const video = videoRef.current;
    const stream = streamRef.current;

    setDebug({
      videoWidth: video?.videoWidth || 0,
      videoHeight: video?.videoHeight || 0,
      readyState: video?.readyState || 0,
      streamActive: Boolean(stream?.active)
    });
  }, []);

  const clearPreviewTimers = useCallback(() => {
    if (previewTimeoutRef.current) {
      window.clearTimeout(previewTimeoutRef.current);
      previewTimeoutRef.current = null;
    }

    if (retryTimeoutRef.current) {
      window.clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
  }, []);

  const stopCamera = useCallback(() => {
    clearPreviewTimers();

    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
      videoRef.current.removeAttribute("src");
      videoRef.current.load();
    }

    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setHasCameraStream(false);
    setIsPreviewReady(false);
    updateDebug();
  }, [clearPreviewTimers, updateDebug]);

  const markPreviewReady = useCallback(async () => {
    const video = videoRef.current;

    if (!video) {
      return false;
    }

    prepareVideoElement(video);

    try {
      await video.play();
    } catch {
      // Safari can reject an early play call. The retry path below will call it again.
    }

    updateDebug();

    if (video.videoWidth > 0 && video.videoHeight > 0) {
      clearPreviewTimers();
      setIsPreviewReady(true);
      setMessage("현재 화면을 촬영할 수 있습니다.");
      return true;
    }

    setIsPreviewReady(false);
    setMessage("카메라 화면을 불러오는 중입니다.");
    return false;
  }, [clearPreviewTimers, updateDebug]);

  const retryVideoRender = useCallback(async () => {
    const video = videoRef.current;
    const stream = streamRef.current;

    if (!video || !stream) {
      return;
    }

    if (video.videoWidth > 0 && video.videoHeight > 0) {
      await markPreviewReady();
      return;
    }

    setMessage("카메라 화면을 다시 연결하는 중입니다.");
    prepareVideoElement(video);
    video.pause();
    video.srcObject = null;
    video.load();
    await waitFrame();
    video.srcObject = stream;

    try {
      await playVideo(video);
    } catch {
      // The final timeout displays the user-facing failure state if rendering still fails.
    }

    await waitFrame();
    updateDebug();

    if (video.videoWidth > 0 && video.videoHeight > 0) {
      await markPreviewReady();
    } else {
      setMessage("카메라 화면을 불러오는 중입니다.");
    }
  }, [markPreviewReady, updateDebug]);

  const schedulePreviewChecks = useCallback(() => {
    clearPreviewTimers();

    retryTimeoutRef.current = window.setTimeout(() => {
      void retryVideoRender();
    }, VIDEO_RENDER_RETRY_MS);

    previewTimeoutRef.current = window.setTimeout(() => {
      const video = videoRef.current;

      if (!video || video.videoWidth === 0 || video.videoHeight === 0) {
        stopCamera();
        setCameraError({
          title: "카메라가 켜졌지만 화면을 표시하지 못했습니다.",
          description: "Safari를 새로고침한 뒤 다시 시도해주세요."
        });
        setMessage("카메라가 켜졌지만 화면을 표시하지 못했습니다.");
      }
    }, CAMERA_PREVIEW_TIMEOUT_MS);
  }, [clearPreviewTimers, retryVideoRender, stopCamera]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCurrentTime(getKoreaDateTime());
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    setInAppBrowser(detectInAppBrowser(window.navigator.userAgent));
  }, []);

  useEffect(() => {
    return () => {
      stopCamera();
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl, stopCamera]);

  async function waitForVideoElement() {
    for (let i = 0; i < 12; i += 1) {
      await waitFrame();

      if (videoRef.current) {
        return videoRef.current;
      }
    }

    return null;
  }

  async function connectStreamToVideo(stream: MediaStream) {
    streamRef.current = stream;
    setHasCameraStream(true);
    setIsPreviewReady(false);
    setMessage("카메라 화면을 불러오는 중입니다.");

    const video = await waitForVideoElement();

    if (!video) {
      throw new Error("Video element is not ready");
    }

    prepareVideoElement(video);
    video.srcObject = stream;

    await waitFrame();
    await playVideo(video);
    updateDebug();
    schedulePreviewChecks();

    if (video.videoWidth > 0 && video.videoHeight > 0) {
      await markPreviewReady();
    }
  }

  async function startCamera() {
    setCameraError(null);
    setIsPreviewReady(false);

    if (inAppBrowser.isInApp) {
      const guide = getInAppBrowserGuide(inAppBrowser);
      setCameraError(guide);
      setMessage(guide.title);
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      const errorMessage = {
        title: "사용 가능한 카메라를 찾을 수 없습니다.",
        description: "모바일 기기에서 다시 시도해주세요."
      };
      setCameraError(errorMessage);
      setMessage(errorMessage.title);
      return;
    }

    stopCamera();
    setIsStarting(true);
    setMessage("카메라를 준비하는 중입니다.");

    try {
      let stream: MediaStream;

      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: false
        });
      } catch (firstError) {
        if (isCameraPermissionError(firstError)) {
          throw firstError;
        }

        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
        });
      }

      await connectStreamToVideo(stream);
    } catch (error) {
      stopCamera();
      const errorMessage = getCameraErrorMessage(error);
      setCameraError(errorMessage);
      setMessage(errorMessage.title);
    } finally {
      setIsStarting(false);
    }
  }

  function createPreviewFromSource(source: CanvasImageSource, sourceWidth: number, sourceHeight: number) {
    const capturedAt = new Date();
    const watermark = getKoreaDateTime(capturedAt);
    const { width, height } = getResizedSize(sourceWidth, sourceHeight);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");

    if (!context) {
      setMessage("이미지를 처리하지 못했습니다.");
      return;
    }

    context.drawImage(source, 0, 0, width, height);
    drawWatermark(context, width, height, watermark);

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setMessage("이미지를 생성하지 못했습니다.");
          return;
        }

        if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
        }

        setPreviewUrl(URL.createObjectURL(blob));
        previewBlobRef.current = blob;
        setDownloadName(getDownloadFileName(capturedAt));
        setUploadedRecordId(null);
        setMessage("최종 이미지 안에 날짜/시간 워터마크가 포함되었습니다.");
      },
      "image/jpeg",
      JPEG_QUALITY
    );
  }

  async function capturePhoto() {
    const video = videoRef.current;

    if (!video || !isPreviewReady || video.videoWidth === 0 || video.videoHeight === 0) {
      setMessage("카메라 준비 중입니다.");
      return;
    }

    createPreviewFromSource(video, video.videoWidth, video.videoHeight);
  }

  async function handleDevelopmentFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setMessage("이미지 파일을 선택해주세요.");
      return;
    }

    try {
      setMessage("테스트 이미지를 처리하는 중입니다.");
      const image = await loadImageFromFile(file);
      createPreviewFromSource(image.source, image.width, image.height);
      image.cleanup();
    } catch {
      setMessage("선택한 이미지를 처리하지 못했습니다.");
    }
  }

  function retakePhoto() {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setPreviewUrl(null);
    previewBlobRef.current = null;
    setUploadedRecordId(null);
    setMessage(hasCameraStream ? "다시 촬영할 수 있습니다." : "버튼을 눌러 카메라 권한을 요청하세요.");
  }

  async function uploadPhoto() {
    if (!previewBlobRef.current) {
      setMessage("업로드할 인증 사진을 찾을 수 없습니다.");
      return;
    }

    setIsUploading(true);
    setMessage("인증 사진을 저장하는 중입니다.");

    const formData = new FormData();
    formData.append("image", previewBlobRef.current, downloadName);

    try {
      const response = await fetch("/api/photos/upload", {
        method: "POST",
        body: formData
      });
      const result = (await response.json()) as {
        message?: string;
        record?: {
          id?: string;
        };
      };

      if (!response.ok) {
        setMessage(result.message || "사진 업로드에 실패했습니다. 다시 시도해주세요.");
        return;
      }

      setUploadedRecordId(result.record?.id || "uploaded");
      setMessage(result.message || "사진 인증이 저장되었습니다.");
    } catch {
      setMessage("네트워크 문제로 사진 업로드에 실패했습니다. 연결을 확인해주세요.");
    } finally {
      setIsUploading(false);
    }
  }

  const isCaptureDisabled = isStarting || !isPreviewReady;

  return (
    <section className="space-y-5">
      <div className="app-card px-5 py-4">
        <p className="text-xs font-black text-[#6B7280]">한국 시간</p>
        <p className="mt-1 text-lg font-black text-[#111827]">{currentTime}</p>
      </div>

      {inAppBrowser.isInApp && !previewUrl ? (
        <div className="app-card p-5">
          <p className="text-base font-black text-[#111827]">카메라 인증은 Safari 또는 Chrome에서 이용해주세요.</p>
          <p className="mt-2 text-sm font-semibold leading-6 text-[#6B7280]">
            카카오톡 안에서 열면 카메라 권한이 제한될 수 있습니다.
          </p>
          <p className="mt-2 text-sm font-black text-[#3182F6]">
            {inAppBrowser.platform === "ios"
              ? "오른쪽 아래 또는 공유 메뉴에서 Safari로 열어주세요."
              : inAppBrowser.platform === "android"
                ? "오른쪽 위 메뉴에서 Chrome으로 열어주세요."
                : "기본 브라우저에서 다시 열어주세요."}
          </p>
        </div>
      ) : null}

      <div className="app-card bg-[#111827] p-2">
        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img alt="촬영한 운동 인증 사진 미리보기" className="aspect-[3/4] w-full rounded-[20px] object-contain" src={previewUrl} />
        ) : hasCameraStream ? (
          <div className="relative aspect-[3/4] w-full rounded-[20px] bg-black">
            <video
              autoPlay
              className="block h-full w-full rounded-[20px] bg-black object-cover opacity-100 [visibility:visible]"
              controls={false}
              muted
              onCanPlay={() => {
                void markPreviewReady();
              }}
              onLoadedMetadata={() => {
                void markPreviewReady();
              }}
              onPlaying={() => {
                void markPreviewReady();
              }}
              playsInline
              ref={videoRef}
            />
            {!isPreviewReady ? (
              <div className="pointer-events-none absolute inset-x-3 bottom-3 rounded-[16px] bg-black/60 px-4 py-3 text-center">
                <p className="text-sm font-black leading-6 text-white">카메라 화면을 불러오는 중입니다.</p>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="flex aspect-[3/4] w-full flex-col items-center justify-center rounded-[20px] bg-[#F8FAFF] px-6 text-center">
            <p className="mt-4 text-xl font-black text-[#111827]">카메라 준비</p>
            <p className="mt-2 text-sm font-semibold leading-6 text-[#6B7280]">
              사진으로 인증하기를 누르면 카메라 권한을 요청합니다.
            </p>
          </div>
        )}
      </div>

      <p className="app-card-soft px-5 py-4 text-sm font-semibold leading-6 text-[#6B7280]">{message}</p>

      {IS_DEVELOPMENT && hasCameraStream ? (
        <p className="px-2 text-[11px] font-semibold text-[#9CA3AF]">
          video {debug.videoWidth}x{debug.videoHeight} / readyState {debug.readyState} / stream{" "}
          {debug.streamActive ? "active" : "inactive"}
        </p>
      ) : null}

      {cameraError && !previewUrl ? (
        <div className="app-card p-5">
          <p className="text-base font-black text-[#111827]">{cameraError.title}</p>
          <p className="mt-2 text-sm font-semibold leading-6 text-[#6B7280]">{cameraError.description}</p>
          <button className="app-primary-button mt-4 w-full" disabled={isStarting} onClick={startCamera} type="button">
            다시 시도
          </button>
        </div>
      ) : null}

      {previewUrl ? (
        <div className="grid gap-3">
          {uploadedRecordId ? (
            <div className="app-card p-6 text-center">
              <div className="mx-auto flex justify-center">
                <CorgiMark size="sm" />
              </div>
              <p className="mt-3 text-2xl font-black text-[#111827]">인증 완료</p>
              <p className="mt-2 text-sm leading-6 text-[#6B7280]">오늘 운동 사진이 저장되었습니다.</p>
              <div className="mt-5 grid gap-2">
                <Link className="app-primary-button" href="/attendance">
                  내 출석 현황 보기
                </Link>
                <Link className="app-secondary-button" href="/feed">
                  크루 인증 피드 보기
                </Link>
              </div>
            </div>
          ) : (
            <button className="app-primary-button" disabled={isUploading} onClick={uploadPhoto} type="button">
              {isUploading ? "업로드 중" : "인증 사진 업로드"}
            </button>
          )}
          <a className="app-secondary-button" download={downloadName} href={previewUrl}>
            사진 저장하기
          </a>
          <button className="app-secondary-button" onClick={retakePhoto} type="button">
            다시 촬영
          </button>
        </div>
      ) : (
        <div className="grid gap-3">
          <button
            className="app-primary-button"
            disabled={hasCameraStream ? isCaptureDisabled : isStarting}
            onClick={hasCameraStream ? capturePhoto : startCamera}
            type="button"
          >
            {hasCameraStream ? (isPreviewReady ? "촬영하기" : "카메라 준비 중") : isStarting ? "카메라 준비 중" : "사진으로 인증하기"}
          </button>
          {hasCameraStream ? (
            <button className="app-secondary-button" onClick={stopCamera} type="button">
              카메라 끄기
            </button>
          ) : null}
          {IS_DEVELOPMENT ? (
            <label className="app-secondary-button border border-dashed border-[#BFDBFE]">
              PC 개발 테스트용 이미지 선택
              <input accept="image/*" className="sr-only" onChange={handleDevelopmentFileChange} type="file" />
            </label>
          ) : null}
        </div>
      )}
    </section>
  );
}
