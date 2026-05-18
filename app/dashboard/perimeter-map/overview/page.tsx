"use client";

import dynamic from "next/dynamic";

const PTBMapCanvas = dynamic(() => import("@/components/ptb-map-canvas"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[520px] flex items-center justify-center bg-card border border-border/40 rounded-xl">
      <span className="font-mono text-xs text-muted-foreground tracking-wider animate-pulse">BOOTING TERMINAL SECURITY WORKSPACE...</span>
    </div>
  ),
});

export default function PerimeterOverviewPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Passenger Terminal Building (PTB) — Level 1</h1>
        <p className="text-sm text-muted-foreground font-mono mt-1">
          Tactical interior monitoring grid with active camera feeds, patrols, and security barriers
        </p>
      </div>

      <div className="w-full">
        <PTBMapCanvas />
      </div>
    </div>
  );
}
