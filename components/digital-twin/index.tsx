"use client";

import dynamic from "next/dynamic";
import { Signal } from "lucide-react";

export const DigitalTwin3D = dynamic(
  () => import("./DigitalTwin").then((m) => m.DigitalTwin),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-card">
        <div className="flex items-center gap-2">
          <Signal className="h-4 w-4 text-tactical-green blink" />
          <span className="font-mono text-xs text-muted-foreground tracking-wider">
            LOADING 3D DIGITAL TWIN...
          </span>
        </div>
      </div>
    ),
  }
);
