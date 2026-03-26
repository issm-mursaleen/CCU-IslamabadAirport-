"use client";

import { useEffect, useState } from "react";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Separator } from "@/components/ui/separator";
import { AlertProvider } from "@/components/alert-context";
import { QRFProvider } from "@/components/qrf-context";

function LiveClock() {
  const [time, setTime] = useState("");

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        })
      );
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <span className="font-mono text-xs text-tactical-green tracking-widest tabular-nums">
      {time || "--:--:--"}
    </span>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AlertProvider>
    <QRFProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-12 shrink-0 items-center justify-between gap-2 border-b border-border/60 px-4 bg-card/50 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="-ml-1 text-muted-foreground hover:text-tactical-green transition-colors" />
              <Separator orientation="vertical" className="h-4 bg-border/60" />
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-tactical-green blink" />
                <span className="font-mono text-[10px] tracking-[0.15em] text-muted-foreground uppercase">
                  System Online
                </span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="font-mono text-[10px] text-muted-foreground tracking-wide">
                PKT
              </span>
              <LiveClock />
            </div>
          </header>
          <div className="flex flex-1 flex-col gap-4 p-4 pt-4 tactical-grid min-h-0 overflow-auto">
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </QRFProvider>
    </AlertProvider>
  );
}
