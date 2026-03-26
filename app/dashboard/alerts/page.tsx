"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Bell,
  Send,
  CheckCheck,
  Check,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  MessageSquare,
  Phone,
  Plus,
  X,
  User,
  Zap,
  RotateCcw,
} from "lucide-react";

type DeliveryStatus = "sending" | "sent" | "delivered" | "read" | "failed";
type AlertType = "incident" | "compliance" | "training" | "coverage" | "escalation" | "manual";
type Priority = "critical" | "high" | "normal" | "low";

type Message = {
  id: string;
  type: AlertType;
  priority: Priority;
  recipient: string;
  recipientPhone: string;
  message: string;
  sentAt: string;
  deliveryStatus: DeliveryStatus;
  deliveredAt?: string;
  readAt?: string;
  escalated: boolean;
  triggeredBy: string;
};

const initialMessages: Message[] = [
  { id: "MSG-047", type: "incident", priority: "critical", recipient: "Duty Manager", recipientPhone: "+92 300 1234567", message: "INC-047: Confirmed Code Amber at Site Bravo. QRF Bravo dispatched. ETA 8 min.", sentAt: "14:32:01", deliveryStatus: "read", deliveredAt: "14:32:03", readAt: "14:32:15", escalated: false, triggeredBy: "MOD-01 (QRF)" },
  { id: "MSG-046", type: "incident", priority: "critical", recipient: "QRF Bravo Lead", recipientPhone: "+92 301 9876543", message: "DISPATCH: INC-047 at Site Bravo (F-6 Markaz). Code Amber. Respond immediately.", sentAt: "14:32:02", deliveryStatus: "delivered", deliveredAt: "14:32:04", escalated: false, triggeredBy: "MOD-01 (QRF)" },
  { id: "MSG-045", type: "compliance", priority: "high", recipient: "Admin Officer", recipientPhone: "+92 333 4567890", message: "COMPLIANCE ALERT: Guard Bilal Khan (G-002) licence expires in 12 days. Renewal required.", sentAt: "14:28:00", deliveryStatus: "read", deliveredAt: "14:28:02", readAt: "14:30:45", escalated: false, triggeredBy: "MOD-02 (Compliance)" },
  { id: "MSG-044", type: "escalation", priority: "critical", recipient: "Shift Supervisor", recipientPhone: "+92 300 5551234", message: "ESCALATION: INC-046 alert (MSG-040) unread by Duty Manager after 5 min. Escalating.", sentAt: "14:03:00", deliveryStatus: "read", deliveredAt: "14:03:01", readAt: "14:03:22", escalated: true, triggeredBy: "MOD-05 (Escalation)" },
  { id: "MSG-043", type: "coverage", priority: "high", recipient: "Duty Supervisor", recipientPhone: "+92 312 8887777", message: "COVERAGE GAP: Post 'Rear Gate' at Site Charlie uncovered. Expected guard did not report. Replacement needed.", sentAt: "13:45:00", deliveryStatus: "read", deliveredAt: "13:45:02", readAt: "13:45:30", escalated: false, triggeredBy: "MOD-04 (Deployment)" },
  { id: "MSG-042", type: "training", priority: "normal", recipient: "Training Admin", recipientPhone: "+92 321 4445566", message: "TRAINING EXPIRY: Usman Raza (G-003) Armed Response cert expires in 36 days. Schedule renewal.", sentAt: "09:00:00", deliveryStatus: "delivered", deliveredAt: "09:00:03", escalated: false, triggeredBy: "MOD-03 (Training)" },
  { id: "MSG-041", type: "manual", priority: "normal", recipient: "Client Sector 7", recipientPhone: "+92 300 7776655", message: "Security update: Increased patrol frequency in your sector effective today. Contact ops for details.", sentAt: "08:45:00", deliveryStatus: "read", deliveredAt: "08:45:02", readAt: "09:12:00", escalated: false, triggeredBy: "Manual (OP-01)" },
  { id: "MSG-040", type: "incident", priority: "high", recipient: "Duty Manager", recipientPhone: "+92 300 1234567", message: "INC-046: Code Green at Site Alpha. Routine alarm verification required.", sentAt: "13:58:00", deliveryStatus: "failed", escalated: true, triggeredBy: "MOD-01 (QRF)" },
];

const initialContacts = [
  { name: "Duty Manager", phone: "+92 300 1234567" },
  { name: "Shift Supervisor", phone: "+92 300 5551234" },
  { name: "Admin Officer", phone: "+92 333 4567890" },
  { name: "Training Admin", phone: "+92 321 4445566" },
  { name: "QRF Alpha Lead", phone: "+92 301 1112233" },
  { name: "QRF Bravo Lead", phone: "+92 301 9876543" },
  { name: "Duty Supervisor", phone: "+92 312 8887777" },
  { name: "Ops Director", phone: "+92 300 9990001" },
  { name: "Client Sector 7", phone: "+92 300 7776655" },
];

const deliveryIcons: Record<DeliveryStatus, typeof Check> = {
  sending: Clock,
  sent: Send,
  delivered: Check,
  read: CheckCheck,
  failed: AlertTriangle,
};

const deliveryColors: Record<DeliveryStatus, string> = {
  sending: "text-tactical-amber",
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

const priorityConfig: Record<Priority, { color: string; bg: string; border: string }> = {
  critical: { color: "text-tactical-red", bg: "bg-tactical-red/10", border: "border-tactical-red/30" },
  high: { color: "text-tactical-amber", bg: "bg-tactical-amber/10", border: "border-tactical-amber/30" },
  normal: { color: "text-tactical-cyan", bg: "bg-tactical-cyan/10", border: "border-tactical-cyan/30" },
  low: { color: "text-muted-foreground", bg: "bg-muted/50", border: "border-border" },
};

/* ── Auto-Routing Rules ── */
/* Maps alert type → best-fit recipient name (must match a savedContacts entry) */
const autoRouteRules: Record<AlertType, { primary: string; escalation?: string; description: string }> = {
  incident:   { primary: "Duty Manager",    escalation: "Ops Director",      description: "Incidents route to Duty Manager; critical escalates to Ops Director" },
  compliance: { primary: "Admin Officer",   escalation: "Shift Supervisor",  description: "Compliance alerts go to Admin Officer" },
  training:   { primary: "Training Admin",  escalation: "Admin Officer",     description: "Training alerts go to Training Admin" },
  coverage:   { primary: "Duty Supervisor", escalation: "Shift Supervisor",  description: "Coverage gaps route to Duty Supervisor" },
  escalation: { primary: "Shift Supervisor", escalation: "Ops Director",     description: "Escalations go to Shift Supervisor" },
  manual:     { primary: "",                                                 description: "Manual alerts — select recipient yourself" },
};

function timeNow() {
  return new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export default function AlertsPage() {
  const [mounted, setMounted] = useState(false);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [showCompose, setShowCompose] = useState(false);
  const [showAddRecipient, setShowAddRecipient] = useState(false);
  const [savedContacts, setSavedContacts] = useState(initialContacts);
  const [newRecipient, setNewRecipient] = useState({ name: "", phone: "" });
  const [autoRouted, setAutoRouted] = useState(false);
  const [form, setForm] = useState({
    type: "manual" as AlertType,
    priority: "normal" as Priority,
    recipient: "",
    recipientPhone: "",
    message: "",
  });

  /* Auto-route: when type changes, auto-fill the best-fit recipient */
  const applyAutoRoute = useCallback((type: AlertType) => {
    const rule = autoRouteRules[type];
    if (!rule.primary) {
      // manual type — clear auto-route
      setAutoRouted(false);
      return;
    }
    const contact = savedContacts.find((c) => c.name === rule.primary);
    if (contact) {
      setForm((f) => ({ ...f, type, recipient: contact.name, recipientPhone: contact.phone }));
      setAutoRouted(true);
    } else {
      setForm((f) => ({ ...f, type }));
      setAutoRouted(false);
    }
  }, [savedContacts]);

  useEffect(() => setMounted(true), []);

  const filtered = messages.filter((m) => typeFilter === "all" || m.type === typeFilter);

  const counts = {
    total: messages.length,
    read: messages.filter((m) => m.deliveryStatus === "read").length,
    delivered: messages.filter((m) => m.deliveryStatus === "delivered").length,
    failed: messages.filter((m) => m.deliveryStatus === "failed").length,
    escalated: messages.filter((m) => m.escalated).length,
  };

  /* Pick a saved contact */
  const selectContact = (contact: { name: string; phone: string }) => {
    setForm((f) => ({ ...f, recipient: contact.name, recipientPhone: contact.phone }));
  };

  /* Send alert with simulated delivery lifecycle */
  const handleSend = useCallback(() => {
    if (!form.recipient || !form.message) return;

    const id = `MSG-${String(messages.length + 40).padStart(3, "0")}`;
    const sentAt = timeNow();

    const newMsg: Message = {
      id,
      type: form.type,
      priority: form.priority,
      recipient: form.recipient,
      recipientPhone: form.recipientPhone || "+92 XXX XXXXXXX",
      message: form.message,
      sentAt,
      deliveryStatus: "sending",
      escalated: false,
      triggeredBy: "Manual (OP-01)",
    };

    setMessages((prev) => [newMsg, ...prev]);
    setForm({ type: "manual", priority: "normal", recipient: "", recipientPhone: "", message: "" });
    setShowCompose(false);

    /* Simulate delivery lifecycle: sending → sent → delivered → read */
    setTimeout(() => {
      setMessages((prev) =>
        prev.map((m) => (m.id === id ? { ...m, deliveryStatus: "sent" as DeliveryStatus } : m))
      );
    }, 800);

    setTimeout(() => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === id
            ? { ...m, deliveryStatus: "delivered" as DeliveryStatus, deliveredAt: timeNow() }
            : m
        )
      );
    }, 2500);

    setTimeout(() => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === id
            ? { ...m, deliveryStatus: "read" as DeliveryStatus, readAt: timeNow() }
            : m
        )
      );
    }, 6000);
  }, [form, messages.length]);

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
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddRecipient(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-tactical-cyan/10 border border-tactical-cyan/30 text-tactical-cyan font-mono text-[10px] font-bold tracking-wide hover:bg-tactical-cyan/20 transition-colors"
          >
            <User className="h-3.5 w-3.5" />
            ADD RECIPIENT
          </button>
          <button
            onClick={() => setShowCompose(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-tactical-green text-[#06080D] font-mono text-[10px] font-bold tracking-wide hover:bg-tactical-green/90 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            CREATE ALERT
          </button>
        </div>
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
          <span className="font-mono text-[9px] text-muted-foreground ml-auto">{filtered.length} messages</span>
        </div>
        <div className="divide-y divide-border/30">
          {filtered.map((msg) => {
            const StatusIcon = deliveryIcons[msg.deliveryStatus];
            const pc = priorityConfig[msg.priority];
            return (
              <div key={msg.id} className="px-4 py-3 hover:bg-accent/20 transition-colors">
                <div className="flex items-start justify-between mb-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-[10px] text-muted-foreground">{msg.id}</span>
                    <span className={`font-mono text-[9px] tracking-wider px-1.5 py-0.5 rounded border uppercase ${typeBg[msg.type]} ${typeColors[msg.type]}`}>{msg.type}</span>
                    <span className={`font-mono text-[8px] tracking-wider px-1.5 py-0.5 rounded border uppercase ${pc.bg} ${pc.color} ${pc.border}`}>{msg.priority}</span>
                    {msg.escalated && (
                      <span className="font-mono text-[9px] tracking-wider px-1.5 py-0.5 rounded border border-tactical-red/30 bg-tactical-red/10 text-tactical-red flex items-center gap-1">
                        <ArrowUpRight className="h-2.5 w-2.5" />
                        ESCALATED
                      </span>
                    )}
                  </div>
                  <span className="font-mono text-[10px] text-muted-foreground tabular-nums shrink-0 ml-2">{msg.sentAt}</span>
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
                      <StatusIcon className={`h-3 w-3 ${msg.deliveryStatus === "sending" ? "animate-spin" : ""}`} />
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
          {filtered.length === 0 && (
            <div className="px-4 py-8 text-center">
              <p className="font-mono text-xs text-muted-foreground">No messages match this filter.</p>
            </div>
          )}
        </div>
      </div>



      {/* ── CREATE ALERT OVERLAY ── */}
      {showCompose && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowCompose(false)}
          />

          <div className="relative w-full max-w-xl bg-card border border-border rounded-lg shadow-2xl overflow-hidden mx-4">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-border/60">
              <div className="flex items-center gap-2">
                <Send className="h-4 w-4 text-tactical-green" />
                <span className="font-mono text-sm font-bold tracking-wide">Create Alert</span>
              </div>
              <button
                onClick={() => setShowCompose(false)}
                className="p-1.5 rounded-md hover:bg-accent/50 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Form */}
            <div className="p-5 space-y-4">
              {/* Alert Type & Priority */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-mono text-[9px] text-muted-foreground uppercase tracking-wider block mb-1.5">
                    Alert Type
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {(["incident", "compliance", "training", "coverage", "manual"] as AlertType[]).map((t) => (
                      <button
                        key={t}
                        onClick={() => applyAutoRoute(t)}
                        className={`font-mono text-[9px] tracking-wider px-2 py-1.5 rounded border transition-colors uppercase ${
                          form.type === t
                            ? `${typeBg[t]} ${typeColors[t]}`
                            : "text-muted-foreground border-border/50 hover:text-foreground"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="font-mono text-[9px] text-muted-foreground uppercase tracking-wider block mb-1.5">
                    Priority
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {(["critical", "high", "normal", "low"] as Priority[]).map((p) => {
                      const pc = priorityConfig[p];
                      return (
                        <button
                          key={p}
                          onClick={() => setForm((f) => ({ ...f, priority: p }))}
                          className={`font-mono text-[9px] tracking-wider px-2 py-1.5 rounded border transition-colors uppercase ${
                            form.priority === p
                              ? `${pc.bg} ${pc.color} ${pc.border}`
                              : "text-muted-foreground border-border/50 hover:text-foreground"
                          }`}
                        >
                          {p}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Auto-Route indicator */}
              {autoRouted && form.type !== "manual" && (
                <div className="flex items-start gap-2 p-3 rounded-md bg-tactical-green/5 border border-tactical-green/20">
                  <Zap className="h-3.5 w-3.5 text-tactical-green shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-mono text-[10px] text-tactical-green font-bold tracking-wider">AUTO-ROUTED</span>
                      <button
                        onClick={() => {
                          setAutoRouted(false);
                          setForm((f) => ({ ...f, recipient: "", recipientPhone: "" }));
                        }}
                        className="font-mono text-[8px] text-muted-foreground hover:text-foreground flex items-center gap-0.5 transition-colors"
                      >
                        <RotateCcw className="h-2.5 w-2.5" />
                        OVERRIDE
                      </button>
                    </div>
                    <p className="font-mono text-[9px] text-muted-foreground leading-relaxed">
                      {autoRouteRules[form.type].description}
                    </p>
                    <p className="font-mono text-[9px] text-tactical-green mt-1">
                      → {form.recipient} ({form.recipientPhone})
                    </p>
                  </div>
                </div>
              )}

              {/* Routing rules hint — when manual type selected */}
              {form.type === "manual" && (
                <div className="p-3 rounded-md bg-accent/30 border border-border/40">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Zap className="h-3 w-3 text-muted-foreground" />
                    <span className="font-mono text-[9px] text-muted-foreground tracking-wider uppercase">Auto-Route Rules</span>
                  </div>
                  <div className="space-y-1">
                    {(["incident", "compliance", "training", "coverage"] as AlertType[]).map((t) => (
                      <div key={t} className="flex items-center gap-2 font-mono text-[9px]">
                        <span className={`px-1.5 py-0.5 rounded border uppercase tracking-wider ${typeBg[t]} ${typeColors[t]}`}>{t}</span>
                        <span className="text-muted-foreground/40">→</span>
                        <span className="text-foreground">{autoRouteRules[t].primary}</span>
                      </div>
                    ))}
                    <p className="font-mono text-[8px] text-muted-foreground/50 mt-1">Select a non-manual type above to auto-route</p>
                  </div>
                </div>
              )}

              {/* Quick-select contacts — only show when NOT auto-routed so user can override */}
              {!autoRouted && (
                <div>
                  <label className="font-mono text-[9px] text-muted-foreground uppercase tracking-wider block mb-1.5">
                    Recipient — Quick Select
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {savedContacts.map((c) => (
                      <button
                        key={c.phone}
                        onClick={() => selectContact(c)}
                        className={`font-mono text-[9px] px-2 py-1.5 rounded border transition-colors flex items-center gap-1 ${
                          form.recipient === c.name
                            ? "bg-tactical-green/15 text-tactical-green border-tactical-green/40"
                            : "text-muted-foreground border-border/50 hover:text-foreground hover:border-muted-foreground/40"
                        }`}
                      >
                        <User className="h-2.5 w-2.5" />
                        {c.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Recipient & Phone (manual entry) — only when NOT auto-routed */}
              {!autoRouted && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-mono text-[9px] text-muted-foreground uppercase tracking-wider block mb-1">
                      Recipient Name *
                    </label>
                    <input
                      type="text"
                      value={form.recipient}
                      onChange={(e) => setForm((f) => ({ ...f, recipient: e.target.value }))}
                      placeholder="e.g. Duty Manager"
                      className="w-full px-3 py-2 rounded-md bg-secondary border border-border text-xs font-mono placeholder:text-muted-foreground/40 focus:border-tactical-green/50 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="font-mono text-[9px] text-muted-foreground uppercase tracking-wider block mb-1">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      value={form.recipientPhone}
                      onChange={(e) => setForm((f) => ({ ...f, recipientPhone: e.target.value }))}
                      placeholder="+92 3XX XXXXXXX"
                      className="w-full px-3 py-2 rounded-md bg-secondary border border-border text-xs font-mono placeholder:text-muted-foreground/40 focus:border-tactical-green/50 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Message */}
              <div>
                <label className="font-mono text-[9px] text-muted-foreground uppercase tracking-wider block mb-1">
                  Alert Message *
                </label>
                <textarea
                  value={form.message}
                  onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                  placeholder="Type your alert message here..."
                  rows={3}
                  className="w-full px-3 py-2 rounded-md bg-secondary border border-border text-xs font-mono placeholder:text-muted-foreground/40 focus:border-tactical-green/50 focus:outline-none resize-none"
                />
              </div>

              {/* Preview */}
              {form.message && (
                <div className="p-3 rounded-md bg-secondary/50 border border-border/50">
                  <div className="flex items-center gap-2 mb-1.5">
                    <p className="font-mono text-[9px] text-muted-foreground uppercase tracking-wider">Preview</p>
                    {autoRouted && (
                      <span className="font-mono text-[8px] text-tactical-green bg-tactical-green/10 border border-tactical-green/25 px-1.5 py-0.5 rounded flex items-center gap-1">
                        <Zap className="h-2 w-2" /> AUTO-ROUTED
                      </span>
                    )}
                  </div>
                  <div className="flex items-start gap-2">
                    <div className={`mt-0.5 shrink-0 font-mono text-[8px] tracking-wider px-1.5 py-0.5 rounded border uppercase ${typeBg[form.type]} ${typeColors[form.type]}`}>
                      {form.type}
                    </div>
                    <div>
                      <p className="font-mono text-[11px] text-foreground/80 leading-relaxed">{form.message}</p>
                      <p className="font-mono text-[9px] text-muted-foreground mt-1">
                        → {form.recipient || "No recipient"} {form.recipientPhone && `(${form.recipientPhone})`}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-5 py-3 border-t border-border/60 bg-secondary/30">
              <p className="font-mono text-[9px] text-muted-foreground/60">
                Alert will be sent via WhatsApp Business API
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowCompose(false)}
                  className="px-4 py-2 rounded-md font-mono text-[10px] tracking-wider text-muted-foreground hover:text-foreground border border-border hover:border-muted-foreground/40 transition-colors"
                >
                  CANCEL
                </button>
                <button
                  onClick={handleSend}
                  disabled={!form.recipient || !form.message}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-md font-mono text-[10px] font-bold tracking-wider transition-colors ${
                    form.recipient && form.message
                      ? "bg-tactical-green text-[#06080D] hover:bg-tactical-green/90"
                      : "bg-muted text-muted-foreground cursor-not-allowed"
                  }`}
                >
                  <Send className="h-3.5 w-3.5" />
                  SEND ALERT
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── ADD RECIPIENT OVERLAY ── */}
      {showAddRecipient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => { setShowAddRecipient(false); setNewRecipient({ name: "", phone: "" }); }}
          />

          <div className="relative w-full max-w-md bg-card border border-border rounded-lg shadow-2xl overflow-hidden mx-4">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-border/60">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-tactical-cyan" />
                <span className="font-mono text-sm font-bold tracking-wide">Add Recipient</span>
              </div>
              <button
                onClick={() => { setShowAddRecipient(false); setNewRecipient({ name: "", phone: "" }); }}
                className="p-1.5 rounded-md hover:bg-accent/50 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Form */}
            <div className="p-5 space-y-4">
              <div>
                <label className="font-mono text-[9px] text-muted-foreground uppercase tracking-wider block mb-1">
                  Recipient Name *
                </label>
                <input
                  type="text"
                  value={newRecipient.name}
                  onChange={(e) => setNewRecipient((p) => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Security Manager"
                  className="w-full px-3 py-2 rounded-md bg-secondary border border-border text-xs font-mono placeholder:text-muted-foreground/40 focus:border-tactical-cyan/50 focus:outline-none"
                />
              </div>
              <div>
                <label className="font-mono text-[9px] text-muted-foreground uppercase tracking-wider block mb-1">
                  Phone Number *
                </label>
                <input
                  type="text"
                  value={newRecipient.phone}
                  onChange={(e) => setNewRecipient((p) => ({ ...p, phone: e.target.value }))}
                  placeholder="+92 3XX XXXXXXX"
                  className="w-full px-3 py-2 rounded-md bg-secondary border border-border text-xs font-mono placeholder:text-muted-foreground/40 focus:border-tactical-cyan/50 focus:outline-none"
                />
              </div>

              {/* Existing contacts preview */}
              <div>
                <p className="font-mono text-[9px] text-muted-foreground uppercase tracking-wider mb-1.5">Existing Recipients ({savedContacts.length})</p>
                <div className="flex flex-wrap gap-1.5">
                  {savedContacts.map((c) => (
                    <span key={c.phone} className="font-mono text-[9px] px-2 py-1 rounded border border-border/50 text-muted-foreground flex items-center gap-1">
                      <User className="h-2.5 w-2.5" />
                      {c.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-5 py-3 border-t border-border/60 bg-secondary/30">
              <p className="font-mono text-[9px] text-muted-foreground/60">
                Recipient will be available in quick-select when creating alerts
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { setShowAddRecipient(false); setNewRecipient({ name: "", phone: "" }); }}
                  className="px-4 py-2 rounded-md font-mono text-[10px] tracking-wider text-muted-foreground hover:text-foreground border border-border hover:border-muted-foreground/40 transition-colors"
                >
                  CANCEL
                </button>
                <button
                  onClick={() => {
                    if (!newRecipient.name || !newRecipient.phone) return;
                    setSavedContacts((prev) => [...prev, { name: newRecipient.name, phone: newRecipient.phone }]);
                    setNewRecipient({ name: "", phone: "" });
                    setShowAddRecipient(false);
                  }}
                  disabled={!newRecipient.name || !newRecipient.phone}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-md font-mono text-[10px] font-bold tracking-wider transition-colors ${
                    newRecipient.name && newRecipient.phone
                      ? "bg-tactical-cyan text-[#06080D] hover:bg-tactical-cyan/90"
                      : "bg-muted text-muted-foreground cursor-not-allowed"
                  }`}
                >
                  <Plus className="h-3.5 w-3.5" />
                  ADD RECIPIENT
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
