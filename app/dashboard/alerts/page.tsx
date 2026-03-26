"use client";

import { useEffect, useState } from "react";
import {
  Bell,
  Send,
  CheckCheck,
  Check,
  Eye,
  AlertTriangle,
  Clock,
  ChevronRight,
  ArrowUpRight,
  MessageSquare,
  Phone,
} from "lucide-react";

type DeliveryStatus = "sent" | "delivered" | "read" | "failed";
type AlertType = "incident" | "compliance" | "training" | "coverage" | "escalation" | "manual";

const messages: {
  id: string;
  type: AlertType;
  recipient: string;
  recipientPhone: string;
  message: string;
  sentAt: string;
  deliveryStatus: DeliveryStatus;
  deliveredAt?: string;
  readAt?: string;
  escalated: boolean;
  triggeredBy: string;
}[] = [
  { id: "MSG-047", type: "incident", recipient: "Duty Manager", recipientPhone: "+92 300 1234567", message: "INC-047: Confirmed Code Amber at Site Bravo. QRF Bravo dispatched. ETA 8 min.", sentAt: "14:32:01", deliveryStatus: "read", deliveredAt: "14:32:03", readAt: "14:32:15", escalated: false, triggeredBy: "MOD-01 (QRF)" },
  { id: "MSG-046", type: "incident", recipient: "QRF Bravo Lead", recipientPhone: "+92 301 9876543", message: "DISPATCH: INC-047 at Site Bravo (F-6 Markaz). Code Amber. Respond immediately.", sentAt: "14:32:02", deliveryStatus: "delivered", deliveredAt: "14:32:04", escalated: false, triggeredBy: "MOD-01 (QRF)" },
  { id: "MSG-045", type: "compliance", recipient: "Admin Officer", recipientPhone: "+92 333 4567890", message: "COMPLIANCE ALERT: Guard Bilal Khan (G-002) licence expires in 12 days. Renewal required.", sentAt: "14:28:00", deliveryStatus: "read", deliveredAt: "14:28:02", readAt: "14:30:45", escalated: false, triggeredBy: "MOD-02 (Compliance)" },
  { id: "MSG-044", type: "escalation", recipient: "Shift Supervisor", recipientPhone: "+92 300 5551234", message: "ESCALATION: INC-046 alert (MSG-040) unread by Duty Manager after 5 min. Escalating.", sentAt: "14:03:00", deliveryStatus: "read", deliveredAt: "14:03:01", readAt: "14:03:22", escalated: true, triggeredBy: "MOD-05 (Escalation)" },
  { id: "MSG-043", type: "coverage", recipient: "Duty Supervisor", recipientPhone: "+92 312 8887777", message: "COVERAGE GAP: Post 'Rear Gate' at Site Charlie uncovered. Expected guard did not report. Replacement needed.", sentAt: "13:45:00", deliveryStatus: "read", deliveredAt: "13:45:02", readAt: "13:45:30", escalated: false, triggeredBy: "MOD-04 (Deployment)" },
  { id: "MSG-042", type: "training", recipient: "Training Admin", recipientPhone: "+92 321 4445566", message: "TRAINING EXPIRY: Usman Raza (G-003) Armed Response cert expires in 36 days. Schedule renewal.", sentAt: "09:00:00", deliveryStatus: "delivered", deliveredAt: "09:00:03", escalated: false, triggeredBy: "MOD-03 (Training)" },
  { id: "MSG-041", type: "manual", recipient: "Client Sector 7", recipientPhone: "+92 300 7776655", message: "Security update: Increased patrol frequency in your sector effective today. Contact ops for details.", sentAt: "08:45:00", deliveryStatus: "read", deliveredAt: "08:45:02", readAt: "09:12:00", escalated: false, triggeredBy: "Manual (OP-01)" },
  { id: "MSG-040", type: "incident", recipient: "Duty Manager", recipientPhone: "+92 300 1234567", message: "INC-046: Code Green at Site Alpha. Routine alarm verification required.", sentAt: "13:58:00", deliveryStatus: "failed", escalated: true, triggeredBy: "MOD-01 (QRF)" },
];

const deliveryIcons: Record<DeliveryStatus, typeof Check> = {
  sent: Send,
  delivered: Check,
  read: CheckCheck,
  failed: AlertTriangle,
};

const deliveryColors: Record<DeliveryStatus, string> = {
  sent: "text-muted-foreground",
  delivered: "text-tactical-cyan",
  read: "text-tactical-green",
  failed: "text-tactical-red",
};

const typeColors: Record<AlertType, string> = {
  incident: "text-tactical-red",
  compliance: "text-tactical-amber",
  training: "text-tactical-amber",
  coverage: "text-[#A78BFA]",
  escalation: "text-tactical-red",
  manual: "text-tactical-cyan",
};

const typeBg: Record<AlertType, string> = {
  incident: "bg-tactical-red/10 border-tactical-red/30",
  compliance: "bg-tactical-amber/10 border-tactical-amber/30",
  training: "bg-tactical-amber/10 border-tactical-amber/30",
  coverage: "bg-[#A78BFA]/10 border-[#A78BFA]/30",
  escalation: "bg-tactical-red/10 border-tactical-red/30",
  manual: "bg-tactical-cyan/10 border-tactical-cyan/30",
};

export default function AlertsPage() {
  const [mounted, setMounted] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  useEffect(() => setMounted(true), []);

  const filtered = messages.filter((m) => typeFilter === "all" || m.type === typeFilter);

  const counts = {
    total: messages.length,
    read: messages.filter((m) => m.deliveryStatus === "read").length,
    delivered: messages.filter((m) => m.deliveryStatus === "delivered").length,
    failed: messages.filter((m) => m.deliveryStatus === "failed").length,
    escalated: messages.filter((m) => m.escalated).length,
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-md bg-tactical-red/10 border border-tactical-red/30">
            <Bell className="h-5 w-5 text-tactical-red" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">WhatsApp Alert System</h1>
            <p className="text-xs text-muted-foreground font-mono">MOD-05 — Notifications, Delivery Tracking & Escalation</p>
          </div>
        </div>
        <button className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-tactical-green/10 border border-tactical-green/30 text-tactical-green font-mono text-[10px] tracking-wide hover:bg-tactical-green/20 transition-colors">
          <MessageSquare className="h-3.5 w-3.5" />
          COMPOSE MESSAGE
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-3">
        {[
          { label: "Total Sent", value: counts.total, color: "text-foreground" },
          { label: "Read", value: counts.read, color: "text-tactical-green" },
          { label: "Delivered", value: counts.delivered, color: "text-tactical-cyan" },
          { label: "Failed", value: counts.failed, color: "text-tactical-red" },
          { label: "Escalated", value: counts.escalated, color: "text-tactical-amber" },
        ].map((s, i) => (
          <div key={s.label} className={`glow-border rounded-lg p-3 bg-card noise-texture ${mounted ? "fade-in-up" : "opacity-0"}`} style={{ animationDelay: `${i * 50}ms` }}>
            <span className="font-mono text-[9px] tracking-[0.15em] text-muted-foreground uppercase block">{s.label}</span>
            <p className={`text-xl font-bold font-mono mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Type filter */}
      <div className="flex items-center gap-2 flex-wrap">
        {["all", "incident", "compliance", "training", "coverage", "escalation", "manual"].map((f) => (
          <button key={f} onClick={() => setTypeFilter(f)} className={`font-mono text-[9px] tracking-wider px-2.5 py-1.5 rounded transition-colors uppercase ${typeFilter === f ? "bg-tactical-red/15 text-tactical-red border border-tactical-red/30" : "text-muted-foreground hover:text-foreground border border-border/50"}`}>
            {f}
          </button>
        ))}
      </div>

      {/* Message Log */}
      <div className={`glow-border rounded-lg bg-card noise-texture overflow-hidden ${mounted ? "fade-in-up" : "opacity-0"}`} style={{ animationDelay: "300ms" }}>
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border/40">
          <MessageSquare className="h-3.5 w-3.5 text-tactical-red" />
          <span className="font-mono text-[10px] tracking-[0.15em] text-muted-foreground uppercase">Message Log</span>
        </div>
        <div className="divide-y divide-border/30">
          {filtered.map((msg) => {
            const StatusIcon = deliveryIcons[msg.deliveryStatus];
            return (
              <div key={msg.id} className="px-4 py-3 hover:bg-accent/20 transition-colors">
                <div className="flex items-start justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] text-muted-foreground">{msg.id}</span>
                    <span className={`font-mono text-[9px] tracking-wider px-1.5 py-0.5 rounded border uppercase ${typeBg[msg.type]} ${typeColors[msg.type]}`}>{msg.type}</span>
                    {msg.escalated && (
                      <span className="font-mono text-[9px] tracking-wider px-1.5 py-0.5 rounded border border-tactical-red/30 bg-tactical-red/10 text-tactical-red flex items-center gap-1">
                        <ArrowUpRight className="h-2.5 w-2.5" />
                        ESCALATED
                      </span>
                    )}
                  </div>
                  <span className="font-mono text-[10px] text-muted-foreground tabular-nums">{msg.sentAt}</span>
                </div>

                <p className="font-mono text-[11px] text-foreground/80 leading-relaxed mb-2">{msg.message}</p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-[9px] font-mono text-muted-foreground">
                    <span className="flex items-center gap-1"><Phone className="h-2.5 w-2.5" />{msg.recipient}</span>
                    <span className="text-muted-foreground/30">|</span>
                    <span>{msg.recipientPhone}</span>
                    <span className="text-muted-foreground/30">|</span>
                    <span>{msg.triggeredBy}</span>
                  </div>

                  {/* Delivery timeline */}
                  <div className="flex items-center gap-2">
                    <div className={`flex items-center gap-1 ${deliveryColors[msg.deliveryStatus]}`}>
                      <StatusIcon className="h-3 w-3" />
                      <span className="font-mono text-[9px] tracking-wider uppercase">{msg.deliveryStatus}</span>
                    </div>
                    {msg.deliveredAt && (
                      <span className="font-mono text-[8px] text-muted-foreground/60 tabular-nums">D:{msg.deliveredAt}</span>
                    )}
                    {msg.readAt && (
                      <span className="font-mono text-[8px] text-tactical-green/60 tabular-nums">R:{msg.readAt}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Escalation Chain */}
      <div className={`glow-border rounded-lg bg-card noise-texture p-4 ${mounted ? "fade-in-up" : "opacity-0"}`} style={{ animationDelay: "400ms" }}>
        <span className="font-mono text-[10px] tracking-[0.15em] text-muted-foreground uppercase block mb-3">Escalation Chain</span>
        <div className="flex items-center gap-1 flex-wrap">
          {[
            { label: "Recipient (5 min)", active: true },
            { label: "Shift Supervisor (5 min)", active: true },
            { label: "Duty Manager (10 min)", active: false },
            { label: "Ops Director (final)", active: false },
          ].map((step, i) => (
            <div key={step.label} className="flex items-center gap-1">
              <span className={`font-mono text-[9px] px-2 py-1 rounded border ${step.active ? "border-tactical-red/40 bg-tactical-red/10 text-tactical-red" : "border-border text-muted-foreground"}`}>
                {step.label}
              </span>
              {i < 3 && <ChevronRight className="h-3 w-3 text-muted-foreground/40" />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
