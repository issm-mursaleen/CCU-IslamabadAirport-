"use client";

import React, { useRef, useState, useEffect } from "react";

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

interface KeyFrame {
  time: number;
  left: number;
  top: number;
  width: number;
  height: number;
}

// Bounding box keyframes mapped to the actual subject motion in public/videos/Loitering_2.mp4
const LOITERING_KEYFRAMES: KeyFrame[] = [
  { time: 0.0, left: 16.5, top: 41.0, width: 7.5, height: 46.0 },
  { time: 1.5, left: 24.0, top: 38.5, width: 8.0, height: 49.0 },
  { time: 3.0, left: 32.5, top: 35.0, width: 9.0, height: 53.0 },
  { time: 4.5, left: 41.0, top: 31.5, width: 10.0, height: 57.5 },
  { time: 6.0, left: 46.5, top: 29.0, width: 11.0, height: 61.0 },
  { time: 7.5, left: 49.0, top: 28.5, width: 11.5, height: 62.0 },
  { time: 9.0, left: 45.0, top: 30.0, width: 11.0, height: 60.0 },
  { time: 10.5, left: 37.0, top: 33.5, width: 9.5, height: 55.0 },
  { time: 12.0, left: 28.5, top: 36.5, width: 8.5, height: 51.5 },
  { time: 13.5, left: 21.0, top: 39.5, width: 8.0, height: 48.0 },
  { time: 15.0, left: 16.5, top: 41.0, width: 7.5, height: 46.0 }
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
  const [bbox, setBbox] = useState({ left: 16.5, top: 41.0, width: 7.5, height: 46.0, score: 98.6 });

  const isLoiteringVideo = src?.includes("Loitering_2.mp4") || incidentKind === "perimeter_breach" || incidentId === "EVT-209";
  const isTripwireVideo = incidentId === "EVT-203" || src?.includes("counter_people_que.mp4");

  // Interpolate keyframes on every video frame render to simulate active detection model tracking
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isLoiteringVideo) return;

    let frameId: number;

    const updateBoundingBox = () => {
      if (!video) return;
      const time = video.currentTime;
      const keyframes = LOITERING_KEYFRAMES;
      const maxTime = keyframes[keyframes.length - 1].time;
      const t = time % maxTime;

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

      // Linear interpolation
      const left = prev.left + (next.left - prev.left) * factor;
      const top = prev.top + (next.top - prev.top) * factor;
      const width = prev.width + (next.width - prev.width) * factor;
      const height = prev.height + (next.height - prev.height) * factor;

      // Add high-frequency micro-jitter to mimic standard model coordinate regression noise
      const jitter = (Math.random() - 0.5) * 0.25;

      setBbox({
        left: Math.max(0, Math.min(100, left + jitter)),
        top: Math.max(0, Math.min(100, top + jitter)),
        width: Math.max(1, Math.min(100, width + (Math.random() - 0.5) * 0.15)),
        height: Math.max(1, Math.min(100, height + (Math.random() - 0.5) * 0.15)),
        score: Math.min(100, Math.max(90, 97.4 + Math.random() * 2.4))
      });

      frameId = requestAnimationFrame(updateBoundingBox);
    };

    frameId = requestAnimationFrame(updateBoundingBox);
    return () => cancelAnimationFrame(frameId);
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

      {/* ── PERSON DETECTION CV BOUNDING BOX OVERLAY ── */}
      {isLoiteringVideo && (
        <div className="absolute inset-0 pointer-events-none z-20 font-mono select-none overflow-hidden">
          {/* Target Tracking Bounding Box */}
          <div
            className="absolute border border-[#00FF9D] bg-[#00FF9D]/5 rounded flex flex-col justify-between transition-all duration-75"
            style={{
              top: `${bbox.top}%`,
              left: `${bbox.left}%`,
              width: `${bbox.width}%`,
              height: `${bbox.height}%`,
            }}
          >
            {/* Corner brackets */}
            <div className="absolute -top-0.5 -left-0.5 w-1.5 h-1.5 border-t border-l border-[#00FF9D]" />
            <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 border-t border-r border-[#00FF9D]" />
            <div className="absolute -bottom-0.5 -left-0.5 w-1.5 h-1.5 border-b border-l border-[#00FF9D]" />
            <div className="absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 border-b border-r border-[#00FF9D]" />

            {/* Label Badge */}
            <div className="absolute -top-4 left-0 bg-[#00FF9D] text-black text-[7px] font-extrabold px-1 rounded uppercase tracking-wider whitespace-nowrap leading-none py-0.5 flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-black animate-pulse" />
              <span>PERSON ({bbox.score.toFixed(1)}%)</span>
            </div>
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
