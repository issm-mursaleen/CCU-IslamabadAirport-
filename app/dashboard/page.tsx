"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Crosshair,
  ShieldCheck,
  GraduationCap,
  Users,
  Bell,
  Bot,
  ArrowUpRight,
  Activity,
  Shield,
  AlertTriangle,
  CheckCircle2,
  Clock,
} from "lucide-react";

const modules = [
  {
    id: "MOD-01",
    title: "QRF Response",
    subtitle: "Threat Response & GPS Tracking",
    description:
      "Real-time GPS tracking of QRF teams. Haversine-ranked dispatch by distance and capability.",
    icon: Crosshair,
    href: "/dashboard/qrf",
    accentColor: "text-tactical-green",
    accentBg: "bg-tactical-green/10",
    accentBorder: "border-tactical-green/30",
    status: "LIVE",
    stats: { label: "Teams Active", value: "5" },
  },
  {
    id: "MOD-02",
    title: "Guard Compliance",
    subtitle: "License & Certification Tracking",
    description:
      "Tracks guard licences, CNIC validity, and certifications. Auto-blocks expired guards.",
    icon: ShieldCheck,
    href: "/dashboard/compliance",
    accentColor: "text-tactical-cyan",
    accentBg: "bg-tactical-cyan/10",
    accentBorder: "border-tactical-cyan/30",
    status: "ACTIVE",
    stats: { label: "Compliance Rate", value: "94%" },
  },
  {
    id: "MOD-03",
    title: "Training Mgmt",
    subtitle: "Certification & Eligibility",
    description:
      "Training records per guard. Eligibility filtering by post requirements. Expiry alerts.",
    icon: GraduationCap,
    href: "/dashboard/training",
    accentColor: "text-tactical-amber",
    accentBg: "bg-tactical-amber/10",
    accentBorder: "border-tactical-amber/30",
    status: "ACTIVE",
    stats: { label: "Fully Trained", value: "87%" },
  },
  {
    id: "MOD-04",
    title: "Deployment",
    subtitle: "Guard Deployment & Reserve Pool",
    description:
      "Live deployment board with reserve pool. Quick like-for-like replacement and handover logs.",
    icon: Users,
    href: "/dashboard/deployment",
    accentColor: "text-[#A78BFA]",
    accentBg: "bg-[#A78BFA]/10",
    accentBorder: "border-[#A78BFA]/30",
    status: "ACTIVE",
    stats: { label: "Guards Deployed", value: "40" },
  },
  {
    id: "MOD-05",
    title: "Alert System",
    subtitle: "WhatsApp Notifications & Escalation",
    description:
      "Automated alerts via WhatsApp. Delivery tracking, read receipts, and escalation chains.",
    icon: Bell,
    href: "/dashboard/alerts",
    accentColor: "text-tactical-red",
    accentBg: "bg-tactical-red/10",
    accentBorder: "border-tactical-red/30",
    status: "ACTIVE",
    stats: { label: "Alerts Today", value: "12" },
  },
  {
    id: "MOD-06",
    title: "AI Assistant",
    subtitle: "Natural Language Ops Intelligence",
    description:
      "Query system data in plain English. Proactive suggestions during active incidents.",
    icon: Bot,
    href: "/dashboard/ai-assistant",
    accentColor: "text-tactical-green",
    accentBg: "bg-tactical-green/10",
    accentBorder: "border-tactical-green/30",
    status: "READY",
    stats: { label: "Queries Today", value: "34" },
  },
];

const recentActivity = [
  {
    time: "14:32",
    type: "incident",
    message: "INC-047: Code Amber at Site Bravo — QRF Bravo dispatched",
    icon: AlertTriangle,
    color: "text-tactical-amber",
  },
  {
    time: "14:28",
    type: "compliance",
    message: "Guard Bilal Khan — licence expires in 12 days",
    icon: Clock,
    color: "text-tactical-amber",
  },
  {
    time: "14:15",
    type: "deployment",
    message: "Guard rotation completed at Site Alpha — no coverage gap",
    icon: CheckCircle2,
    color: "text-tactical-green",
  },
  {
    time: "13:58",
    type: "alert",
    message: "Escalation: INC-046 alert unread after 5 min — sent to supervisor",
    icon: AlertTriangle,
    color: "text-tactical-red",
  },
  {
    time: "13:42",
    type: "qrf",
    message: "QRF Alpha back to available — INC-046 marked SECURE",
    icon: CheckCircle2,
    color: "text-tactical-green",
  },
];

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight font-sans">
            Command Center
          </h1>
          <p className="text-sm text-muted-foreground font-mono mt-1">
            ISSM Security Operations — All Modules Overview
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-tactical-green-dim border border-tactical-green/20">
            <Activity className="h-3.5 w-3.5 text-tactical-green" />
            <span className="font-mono text-[11px] text-tactical-green tracking-wide">
              ALL SYSTEMS NOMINAL
            </span>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-4 gap-3">
        {[
          {
            label: "Active Incidents",
            value: "2",
            icon: AlertTriangle,
            color: "text-tactical-amber",
            bg: "bg-tactical-amber-dim",
          },
          {
            label: "QRF Teams Online",
            value: "5/5",
            icon: Crosshair,
            color: "text-tactical-green",
            bg: "bg-tactical-green-dim",
          },
          {
            label: "Guards on Duty",
            value: "40",
            icon: Shield,
            color: "text-tactical-cyan",
            bg: "bg-tactical-cyan-dim",
          },
          {
            label: "Alerts Sent (24h)",
            value: "12",
            icon: Bell,
            color: "text-tactical-red",
            bg: "bg-tactical-red-dim",
          },
        ].map((stat, i) => (
          <div
            key={stat.label}
            className={`glow-border rounded-lg p-4 bg-card noise-texture ${
              mounted ? "fade-in-up" : "opacity-0"
            }`}
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] tracking-[0.15em] text-muted-foreground uppercase">
                {stat.label}
              </span>
              <div className={`p-1.5 rounded-md ${stat.bg}`}>
                <stat.icon className={`h-3.5 w-3.5 ${stat.color}`} />
              </div>
            </div>
            <p className={`text-2xl font-bold font-mono mt-2 ${stat.color}`}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Module Grid */}
      <div>
        <h2 className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground uppercase mb-3">
          System Modules
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {modules.map((mod, i) => (
            <Link
              key={mod.id}
              href={mod.href}
              className={`group glow-border corner-accent rounded-lg p-5 bg-card noise-texture block transition-all hover:translate-y-[-2px] ${
                mounted ? "fade-in-up" : "opacity-0"
              }`}
              style={{
                animationDelay: `${300 + i * 100}ms`,
                borderColor: "var(--border)",
              }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-md ${mod.accentBg} border ${mod.accentBorder}`}
                  >
                    <mod.icon className={`h-4 w-4 ${mod.accentColor}`} />
                  </div>
                  <div>
                    <p className="font-mono text-[10px] text-muted-foreground tracking-wider">
                      {mod.id}
                    </p>
                    <h3 className="font-semibold text-sm tracking-tight">
                      {mod.title}
                    </h3>
                  </div>
                </div>
                <span
                  className={`font-mono text-[9px] tracking-wider px-1.5 py-0.5 rounded border ${
                    mod.status === "LIVE"
                      ? "text-tactical-green bg-tactical-green/10 border-tactical-green/30 blink"
                      : "text-muted-foreground bg-muted/50 border-border"
                  }`}
                >
                  {mod.status}
                </span>
              </div>

              <p className="text-[11px] text-muted-foreground font-mono leading-relaxed mb-4">
                {mod.description}
              </p>

              <div className="flex items-center justify-between pt-3 border-t border-border/50">
                <div>
                  <p className="font-mono text-[9px] text-muted-foreground tracking-wider uppercase">
                    {mod.stats.label}
                  </p>
                  <p
                    className={`font-mono text-lg font-bold ${mod.accentColor}`}
                  >
                    {mod.stats.value}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-muted-foreground group-hover:text-tactical-green transition-colors">
                  <span className="font-mono text-[10px] tracking-wide">
                    OPEN
                  </span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground uppercase mb-3">
          Live Activity Feed
        </h2>
        <div
          className={`glow-border rounded-lg bg-card noise-texture overflow-hidden ${
            mounted ? "fade-in-up" : "opacity-0"
          }`}
          style={{ animationDelay: "900ms" }}
        >
          {recentActivity.map((item, i) => (
            <div
              key={i}
              className={`flex items-start gap-3 px-4 py-3 ${
                i !== recentActivity.length - 1
                  ? "border-b border-border/40"
                  : ""
              } hover:bg-accent/30 transition-colors`}
            >
              <span className="font-mono text-[11px] text-muted-foreground tabular-nums w-11 shrink-0 pt-0.5">
                {item.time}
              </span>
              <item.icon className={`h-4 w-4 ${item.color} shrink-0 mt-0.5`} />
              <p className="font-mono text-[11px] text-foreground/80 leading-relaxed">
                {item.message}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
