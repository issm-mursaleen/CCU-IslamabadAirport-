"use client";

import React from "react";

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
  const isLoiteringVideo = src?.includes("Loitering_2.mp4") || incidentKind === "perimeter_breach" || incidentId === "EVT-209";
  const isTripwireVideo = incidentId === "EVT-203" || src?.includes("counter_people_que.mp4");

  return (
    <div className="relative w-full h-full min-w-full min-h-full">
      <video
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
            className="absolute border border-[#00FF9D] bg-[#00FF9D]/5 rounded animate-cv-track flex flex-col justify-between"
            style={{
              top: "28%",
              left: "30%",
              width: "18%",
              height: "56%",
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
              <span>PERSON (98.6%)</span>
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

      {/* Keyframe animations */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes cvTrack {
            0% { left: 24%; top: 30%; width: 17%; height: 53%; }
            50% { left: 42%; top: 25%; width: 19%; height: 59%; }
            100% { left: 24%; top: 30%; width: 17%; height: 53%; }
          }
          .animate-cv-track {
            animation: cvTrack 7s infinite ease-in-out;
          }
        `
      }} />
    </div>
  );
}
