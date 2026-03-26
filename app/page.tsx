"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Radio,
  Crosshair,
  ShieldCheck,
  GraduationCap,
  Users,
  Bell,
  Bot,
  ArrowRight,
  Satellite,
} from "lucide-react";

const modules = [
  { icon: Crosshair, title: "QRF Response", desc: "GPS-tracked rapid response teams" },
  { icon: ShieldCheck, title: "Guard Compliance", desc: "Licence & certification monitoring" },
  { icon: GraduationCap, title: "Training Mgmt", desc: "Eligibility filtering & expiry alerts" },
  { icon: Users, title: "Deployment", desc: "Real-time guard deployment board" },
  { icon: Bell, title: "Alert System", desc: "WhatsApp notifications & escalation" },
  { icon: Bot, title: "AI Assistant", desc: "Natural language ops intelligence" },
];

export default function LandingPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div className="min-h-screen bg-[#06080D] text-foreground flex flex-col tactical-grid relative overflow-hidden">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-tactical-green/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[300px] bg-tactical-cyan/3 rounded-full blur-[100px]" />
      </div>

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-5 border-b border-border/30">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-md bg-tactical-green/15 border border-tactical-green/30">
            <Radio className="h-4.5 w-4.5 text-tactical-green" />
          </div>
          <div>
            <span className="font-mono text-sm font-bold tracking-[0.2em] text-tactical-green">
              ISSM
            </span>
            <span className="font-mono text-[10px] text-muted-foreground ml-3 tracking-wider">
              SECURITY OPERATIONS PLATFORM
            </span>
          </div>
        </div>
        <Link
          href="/dashboard"
          className="flex items-center gap-2 px-4 py-2 rounded-md bg-tactical-green text-[#06080D] font-mono text-xs font-bold tracking-wider hover:bg-tactical-green/90 transition-colors"
        >
          ENTER COMMAND CENTER
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </nav>

      {/* Hero */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-8 py-20">
        <div
          className={`text-center max-w-3xl mx-auto ${
            mounted ? "fade-in-up" : "opacity-0"
          }`}
          style={{ animationDelay: "100ms" }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-tactical-green/20 bg-tactical-green/5 mb-8">
            <Satellite className="h-3 w-3 text-tactical-green" />
            <span className="font-mono text-[10px] text-tactical-green tracking-wider">
              INTEGRATED SECURITY SYSTEMS MANAGEMENT
            </span>
          </div>

          <h1 className="text-5xl md:text-6xl font-bold tracking-tight leading-[1.1] mb-6">
            <span className="text-foreground">Command Your</span>
            <br />
            <span className="text-tactical-green">Security Operations</span>
          </h1>

          <p className="text-lg text-muted-foreground font-mono leading-relaxed max-w-xl mx-auto mb-10">
            Real-time threat response, guard compliance monitoring, AI-assisted
            intelligence — unified in a single tactical platform.
          </p>

          <div className="flex items-center justify-center gap-4">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 px-6 py-3 rounded-md bg-tactical-green text-[#06080D] font-mono text-sm font-bold tracking-wider hover:bg-tactical-green/90 transition-all pulse-glow"
            >
              LAUNCH DASHBOARD
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/dashboard/ai-assistant"
              className="flex items-center gap-2 px-6 py-3 rounded-md border border-border/60 text-muted-foreground font-mono text-sm tracking-wider hover:border-tactical-green/40 hover:text-tactical-green transition-colors"
            >
              <Bot className="h-4 w-4" />
              TRY AI ASSISTANT
            </Link>
          </div>
        </div>

        {/* Module Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-w-3xl mx-auto mt-20 w-full">
          {modules.map((mod, i) => (
            <div
              key={mod.title}
              className={`glow-border corner-accent rounded-lg p-4 bg-card/50 backdrop-blur noise-texture ${
                mounted ? "fade-in-up" : "opacity-0"
              }`}
              style={{ animationDelay: `${400 + i * 100}ms` }}
            >
              <mod.icon className="h-5 w-5 text-tactical-green mb-3" />
              <h3 className="font-semibold text-sm mb-1">{mod.title}</h3>
              <p className="font-mono text-[10px] text-muted-foreground leading-relaxed">
                {mod.desc}
              </p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border/20 px-8 py-4 flex items-center justify-between">
        <span className="font-mono text-[10px] text-muted-foreground/50">
          ISSM SEC OPS v0.1.0 — PROOF OF CONCEPT
        </span>
        <span className="font-mono text-[10px] text-muted-foreground/50">
          CLASSIFIED — AUTHORIZED PERSONNEL ONLY
        </span>
      </footer>
    </div>
  );
}
