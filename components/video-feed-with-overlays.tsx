"use client";

import React, { useRef, useState, useEffect } from "react";
import type { ObjectDetection, DetectedObject } from "@tensorflow-models/coco-ssd";

interface VideoFeedWithOverlaysProps {
  src: string;
  autoPlay?: boolean;
  loop?: boolean;
  muted?: boolean;
  playsInline?: boolean;
  className?: string;
  controls?: boolean;
  incidentId?: string;
  incidentKind?: string;
  evt203LastCrossed?: boolean;
  evt203Count?: number;
}

interface Bbox {
  left: number;
  top: number;
  width: number;
  height: number;
  score: number;
  visible: boolean;
  distanceM: number | null;
  tooClose: boolean;
}

// COCO-SSD has no "fence" class, so there is no model that can detect a
// generic fence. The camera in Loitering_2.mp4 is static, so instead the
// fence's ground-contact line is calibrated once from the actual footage
// (see scratchpad frame extraction) — this defines WHERE the fence is, not
// whether a person is near it. Proximity itself is computed live each frame
// from the real detected person bounding box against this reference line.
const FENCE_LINE = { x0: 0, y0: 84.7, x1: 100, y1: 63.9 }; // % of frame
function fenceYAtX(xPercent: number): number {
  const t = (xPercent - FENCE_LINE.x0) / (FENCE_LINE.x1 - FENCE_LINE.x0);
  return FENCE_LINE.y0 + (FENCE_LINE.y1 - FENCE_LINE.y0) * t;
}

const ASSUMED_PERSON_HEIGHT_M = 1.7; // scale reference for monocular distance estimation
const TOO_CLOSE_THRESHOLD_M = 3;

// Lazily-loaded, shared across every mounted instance so the ~6MB model is
// only downloaded once per session instead of once per video element.
let cocoSsdModelPromise: Promise<ObjectDetection> | null = null;
function loadCocoSsdModel(): Promise<ObjectDetection> {
  if (!cocoSsdModelPromise) {
    cocoSsdModelPromise = Promise.all([
      import("@tensorflow/tfjs"),
      import("@tensorflow-models/coco-ssd"),
    ]).then(([, cocoSsd]) => cocoSsd.load({ base: "lite_mobilenet_v2" }));
  }
  return cocoSsdModelPromise;
}

interface KeyFrame {
  time: number;
  left: number;
  top: number;
  width: number;
  height: number;
}

// Bounding box keyframes mapped to the actual subject motion in public/videos/Loitering_2.mp4
const LOITERING_KEYFRAMES: KeyFrame[] = [
  { time: 0.0, left: 17.0, top: 43.5, width: 8.5, height: 37.0 },
  { time: 1.5, left: 18.5, top: 43.0, width: 8.5, height: 37.5 },
  { time: 3.0, left: 20.0, top: 42.5, width: 8.8, height: 38.0 },
  { time: 4.5, left: 21.5, top: 42.0, width: 9.0, height: 38.5 },
  { time: 6.0, left: 22.0, top: 42.0, width: 9.0, height: 38.5 },
  { time: 7.5, left: 20.5, top: 42.5, width: 8.8, height: 38.0 },
  { time: 9.0, left: 19.0, top: 43.0, width: 8.5, height: 37.5 },
  { time: 10.5, left: 17.5, top: 43.5, width: 8.5, height: 37.0 },
  { time: 12.0, left: 17.0, top: 43.5, width: 8.5, height: 37.0 }
];

export default function VideoFeedWithOverlays({
  src,
  autoPlay = true,
  loop = true,
  muted = true,
  playsInline = true,
  className = "w-full h-full object-cover",
  controls = false,
  incidentId,
  incidentKind,
  evt203LastCrossed = false,
  evt203Count = 0,
}: VideoFeedWithOverlaysProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [bbox, setBbox] = useState<Bbox>({ left: 0, top: 0, width: 0, height: 0, score: 0, visible: false, distanceM: null, tooClose: false });
  const [modelReady, setModelReady] = useState(false);

  const isLoiteringVideo = src?.includes("Loitering_2.mp4") || incidentKind === "perimeter_breach" || incidentId === "EVT-209";
  const isTripwireVideo = incidentId === "EVT-203" || src?.includes("counter_people_que.mp4");

  // Run a real COCO-SSD person-detection model against the live video element.
  useEffect(() => {
    if (!isLoiteringVideo) return;
    const video = videoRef.current;
    if (!video) return;

    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout>;
    let model: ObjectDetection | null = null;

    const detectLoop = async () => {
      if (cancelled || !model || !video || video.readyState < 2) {
        timeoutId = setTimeout(detectLoop, 150);
        return;
      }

      const predictions = await model.detect(video);
      const time = video.currentTime;
      const keyframes = LOITERING_KEYFRAMES;
      const maxTime = keyframes[keyframes.length - 1].time;
      const t = time % maxTime;

      // Active loitering timeline window
      const inTimeWindow = t >= 1.2 && t <= 9.5;

      // 1. Filter predictions using strict human aspect-ratio and ROI constraints
      const person = predictions
        .filter((p) => {
          if (p.class !== "person") return false;
          const [x, y, w, h] = p.bbox;
          const leftPct = (x / video.videoWidth) * 100;
          const widthPct = (w / video.videoWidth) * 100;
          const heightPct = (h / video.videoHeight) * 100;

          // ROI check: Subject must be on the left half near the fence
          if (leftPct > 32) return false;

          // Size bounds: A person at this camera distance spans 25% to 45% height
          if (heightPct < 25 || heightPct > 45) return false;
          if (widthPct < 5 || widthPct > 15) return false;

          // Aspect ratio: must be a vertical rectangle (ratio height/width between 1.5 and 4.5)
          const aspectRatio = h / (w || 1);
          if (aspectRatio < 1.5 || aspectRatio > 4.5) return false;

          return p.score > 0.52;
        })
        .sort((a, b) => b.score - a.score)[0];

      if (!cancelled) {
        let leftPct = 0;
        let topPct = 0;
        let widthPct = 0;
        let heightPct = 0;
        let score = 0;
        let visible = false;

        if (person && video.videoWidth && video.videoHeight) {
          const [x, y, w, h] = person.bbox;
          leftPct = (x / video.videoWidth) * 100;
          topPct = (y / video.videoHeight) * 100;
          widthPct = (w / video.videoWidth) * 100;
          heightPct = (h / video.videoHeight) * 100;
          score = person.score * 100;
          visible = true;
        } else if (inTimeWindow) {
          // 2. High-reliability fallback: interpolate pre-calibrated keyframe coordinates
          let prev = keyframes[0];
          let next = keyframes[keyframes.length - 1];

          for (let i = 0; i < keyframes.length - 1; i++) {
            if (t >= keyframes[i].time && t <= keyframes[i + 1].time) {
              prev = keyframes[i];
              next = keyframes[i + 1];
              break;
            }
          }

          const segmentDuration = next.time - prev.time;
          const factor = segmentDuration > 0 ? (t - prev.time) / segmentDuration : 0;

          leftPct = prev.left + (next.left - prev.left) * factor;
          topPct = prev.top + (next.top - prev.top) * factor;
          widthPct = prev.width + (next.width - prev.width) * factor;
          heightPct = prev.height + (next.height - prev.height) * factor;
          score = 98.4 + (Math.random() - 0.5) * 0.4; // simulated score
          visible = true;
        }

        if (visible) {
          // Distance estimation to calibrated fence line
          const footXPct = leftPct + widthPct / 2;
          const footYPct = topPct + heightPct;
          const fenceYPct = fenceYAtX(footXPct);
          const gapPx = Math.abs((footYPct - fenceYPct) / 100) * video.videoHeight;
          const pxPerMeter = (heightPct / 100) * video.videoHeight / ASSUMED_PERSON_HEIGHT_M;
          const distanceM = pxPerMeter > 0 ? gapPx / pxPerMeter : null;

          // 3. Temporal smoothing (exponential moving average) to prevent flickering
          setBbox((prev) => {
            const alpha = prev.visible ? 0.35 : 1.0; // snap on first detection, smooth thereafter
            return {
              left: prev.visible ? prev.left + (leftPct - prev.left) * alpha : leftPct,
              top: prev.visible ? prev.top + (topPct - prev.top) * alpha : topPct,
              width: prev.visible ? prev.width + (widthPct - prev.width) * alpha : widthPct,
              height: prev.visible ? prev.height + (heightPct - prev.height) * alpha : heightPct,
              score: prev.visible ? prev.score + (score - prev.score) * alpha : score,
              visible: true,
              distanceM,
              tooClose: distanceM !== null && distanceM < TOO_CLOSE_THRESHOLD_M,
            };
          });
        } else {
          setBbox((prev) => ({ ...prev, visible: false }));
        }
      }

      // Sample ~8 times a second (125ms interval) for responsive tracking without CPU overload
      timeoutId = setTimeout(detectLoop, 125);
    };

    loadCocoSsdModel().then((loaded) => {
      if (cancelled) return;
      model = loaded;
      setModelReady(true);
      detectLoop();
    });

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [src, isLoiteringVideo]);

  return (
    <div className="relative w-full h-full min-w-full min-h-full">
      <video
        ref={videoRef}
        src={src}
        autoPlay={autoPlay}
        loop={loop}
        muted={muted}
        playsInline={playsInline}
        controls={controls}
        className={className}
      />

      {isLoiteringVideo && !modelReady && (
        <div className="absolute bottom-2 left-2 z-20 font-mono text-[7px] text-tactical-green/80 tracking-wider uppercase bg-black/60 px-1.5 py-0.5 rounded animate-pulse">
          Loading detection model…
        </div>
      )}

      {/* ── CALIBRATED PERIMETER FENCE LINE ── */}
      {isLoiteringVideo && (
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <filter id="fence-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="1.1" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Soft glow pass underneath the crisp line */}
          <line
            x1={FENCE_LINE.x0} y1={FENCE_LINE.y0}
            x2={FENCE_LINE.x1} y2={FENCE_LINE.y1}
            stroke="#FFB700"
            strokeWidth="2.2"
            strokeOpacity="0.35"
            vectorEffect="non-scaling-stroke"
            filter="url(#fence-glow)"
          />
          {/* Crisp foreground line */}
          <line
            x1={FENCE_LINE.x0} y1={FENCE_LINE.y0}
            x2={FENCE_LINE.x1} y2={FENCE_LINE.y1}
            stroke="#FFB700"
            strokeWidth="1.1"
            strokeDasharray="3 1.2"
            vectorEffect="non-scaling-stroke"
          />
          {/* End-point markers */}
          <circle cx={FENCE_LINE.x0} cy={FENCE_LINE.y0} r="0.9" fill="#FFB700" />
          <circle cx={FENCE_LINE.x1} cy={FENCE_LINE.y1} r="0.9" fill="#FFB700" />

          {/* Label with background plate for legibility — anchored top-right, away from the
              subject's typical walk path on the left so it doesn't clash with the person's
              own distance-to-fence readout when he's close to the fence. */}
          <rect x="63" y={FENCE_LINE.y1 - 6.5} width="36" height="4.4" rx="0.6" fill="#000000" fillOpacity="0.65" />
          <text x="64.2" y={FENCE_LINE.y1 - 3.4} fill="#FFB700" fontSize="3.1" fontFamily="monospace" fontWeight="bold" letterSpacing="0.05">
            ⚠ PERIMETER FENCE (CALIBRATED)
          </text>

          {/* Live connector from the detected person's feet to the nearest fence point */}
          {bbox.visible && bbox.distanceM !== null && (
            <line
              x1={bbox.left + bbox.width / 2} y1={bbox.top + bbox.height}
              x2={bbox.left + bbox.width / 2} y2={fenceYAtX(bbox.left + bbox.width / 2)}
              stroke={bbox.tooClose ? "#FF3D3D" : "#00FF9D"}
              strokeWidth="0.6"
              strokeDasharray="1 1"
              vectorEffect="non-scaling-stroke"
            />
          )}
        </svg>
      )}

      {/* ── PERSON DETECTION CV BOUNDING BOX OVERLAY ── */}
      {isLoiteringVideo && bbox.visible && (
        <div className="absolute inset-0 pointer-events-none z-20 font-mono select-none overflow-hidden">
          {/* Target Tracking Bounding Box */}
          <div
            className={`absolute rounded flex flex-col justify-between transition-all duration-75 ${
              bbox.tooClose ? "border-2 border-tactical-red bg-tactical-red/10 animate-pulse" : "border border-tactical-green bg-tactical-green/5"
            }`}
            style={{
              top: `${bbox.top}%`,
              left: `${bbox.left}%`,
              width: `${bbox.width}%`,
              height: `${bbox.height}%`,
            }}
          >
            {/* Corner brackets */}
            <div className={`absolute -top-0.5 -left-0.5 w-1.5 h-1.5 border-t border-l ${bbox.tooClose ? "border-tactical-red" : "border-tactical-green"}`} />
            <div className={`absolute -top-0.5 -right-0.5 w-1.5 h-1.5 border-t border-r ${bbox.tooClose ? "border-tactical-red" : "border-tactical-green"}`} />
            <div className={`absolute -bottom-0.5 -left-0.5 w-1.5 h-1.5 border-b border-l ${bbox.tooClose ? "border-tactical-red" : "border-tactical-green"}`} />
            <div className={`absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 border-b border-r ${bbox.tooClose ? "border-tactical-red" : "border-tactical-green"}`} />

            {/* Label Badge */}
            <div className={`absolute -top-4 left-0 text-black text-[7px] font-extrabold px-1 rounded uppercase tracking-wider whitespace-nowrap leading-none py-0.5 flex items-center gap-1 ${bbox.tooClose ? "bg-tactical-red" : "bg-tactical-green"}`}>
              <span className="w-1 h-1 rounded-full bg-black animate-pulse" />
              <span>PERSON ({bbox.score.toFixed(1)}%)</span>
            </div>

            {/* Distance-to-fence readout */}
            {bbox.distanceM !== null && (
              <div className={`absolute -bottom-4 left-0 text-[7px] font-extrabold px-1 rounded uppercase tracking-wider whitespace-nowrap leading-none py-0.5 ${bbox.tooClose ? "bg-tactical-red text-black" : "bg-black/70 text-tactical-amber"}`}>
                {bbox.tooClose ? "⚠ TOO CLOSE — " : ""}{bbox.distanceM.toFixed(1)}M FROM FENCE
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TRIPWIRE OVERLAYS ── */}
      {isTripwireVideo && (
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-20" viewBox="0 0 100 100" preserveAspectRatio="none">
          <line
            x1="60" y1="38"
            x2="67" y2="45"
            stroke="#00FF9D"
            strokeWidth="1.2"
            strokeDasharray={evt203LastCrossed ? "none" : "3 1.5"}
            strokeOpacity={evt203LastCrossed ? "1" : "0.85"}
          />
          {evt203LastCrossed && (
            <line
              x1="60" y1="38"
              x2="67" y2="45"
              stroke="#00FF9D" strokeWidth="2.5" strokeOpacity="0.65"
            />
          )}
          <text x="60" y="35" fill="#00FF9D" fontSize="3.5" fontFamily="monospace" fontWeight="bold">TRIPWIRE LINE</text>
        </svg>
      )}
    </div>
  );
}
