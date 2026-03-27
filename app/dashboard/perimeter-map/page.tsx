"use client";

import dynamic from "next/dynamic";

const PerimeterMapCanvas = dynamic(() => import("@/components/perimeter-map-canvas"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-card">
      <span className="font-mono text-xs text-muted-foreground tracking-wider">LOADING MAP...</span>
    </div>
  ),
});

export default function PerimeterMapPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Digital Fence &amp; Perimeter Monitoring</h1>
        <p className="text-sm text-muted-foreground font-mono mt-1">
          AI-powered perimeter intrusion detection and zone monitoring
        </p>
      </div>

      <div className="glow-border rounded-xl bg-card noise-texture p-3 md:p-4">
        <div className="relative h-[360px] md:h-[460px] w-full overflow-hidden rounded-lg border border-border/60 bg-black">
          <PerimeterMapCanvas />
        </div>
      </div>
    </div>
  );
}
