"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

/* ── Types (shared across all modules) ── */
export type DeliveryStatus = "sending" | "sent" | "delivered" | "read" | "failed";
export type AlertType = "incident" | "compliance" | "training" | "coverage" | "escalation" | "manual";
export type Priority = "critical" | "high" | "normal" | "low";

export type AlertMessage = {
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

/* ── Seed data ── */
const seedMessages: AlertMessage[] = [
  { id: "MSG-048", type: "incident", priority: "critical", recipient: "Duty Manager", recipientPhone: "+92 300 1234567", message: "INC-047: Confirmed Code Amber at Site Bravo. QRF Bravo dispatched. ETA 8 min.", sentAt: "14:32:01", deliveryStatus: "read", deliveredAt: "14:32:03", readAt: "14:32:15", escalated: false, triggeredBy: "MOD-01 (QRF)" },
  { id: "MSG-046", type: "incident", priority: "critical", recipient: "QRF Bravo Lead", recipientPhone: "+92 301 9876543", message: "DISPATCH: INC-047 at Site Bravo (F-6 Markaz). Code Amber. Respond immediately.", sentAt: "14:32:02", deliveryStatus: "delivered", deliveredAt: "14:32:04", escalated: false, triggeredBy: "MOD-01 (QRF)" },
  { id: "MSG-045", type: "compliance", priority: "high", recipient: "Admin Officer", recipientPhone: "+92 333 4567890", message: "COMPLIANCE ALERT: Guard Bilal Khan (G-002) licence expires in 12 days. Renewal required.", sentAt: "14:28:00", deliveryStatus: "read", deliveredAt: "14:28:02", readAt: "14:30:45", escalated: false, triggeredBy: "MOD-02 (Compliance)" },
  { id: "MSG-044", type: "escalation", priority: "critical", recipient: "Shift Supervisor", recipientPhone: "+92 300 5551234", message: "ESCALATION: INC-046 alert (MSG-040) unread by Duty Manager after 5 min. Escalating.", sentAt: "14:03:00", deliveryStatus: "read", deliveredAt: "14:03:01", readAt: "14:03:22", escalated: true, triggeredBy: "MOD-05 (Escalation)" },
  { id: "MSG-043", type: "coverage", priority: "high", recipient: "Duty Supervisor", recipientPhone: "+92 312 8887777", message: "COVERAGE GAP: Post 'Rear Gate' at Site Charlie uncovered. Expected guard did not report. Replacement needed.", sentAt: "13:45:00", deliveryStatus: "read", deliveredAt: "13:45:02", readAt: "13:45:30", escalated: false, triggeredBy: "MOD-04 (Deployment)" },
  { id: "MSG-042", type: "training", priority: "normal", recipient: "Training Admin", recipientPhone: "+92 321 4445566", message: "TRAINING EXPIRY: Usman Raza (G-003) Armed Response cert expires in 36 days. Schedule renewal.", sentAt: "09:00:00", deliveryStatus: "delivered", deliveredAt: "09:00:03", escalated: false, triggeredBy: "MOD-03 (Training)" },
  { id: "MSG-041", type: "manual", priority: "normal", recipient: "Client Sector 7", recipientPhone: "+92 300 7776655", message: "Security update: Increased patrol frequency in your sector effective today. Contact ops for details.", sentAt: "08:45:00", deliveryStatus: "read", deliveredAt: "08:45:02", readAt: "09:12:00", escalated: false, triggeredBy: "Manual (OP-01)" },
  { id: "MSG-040", type: "incident", priority: "high", recipient: "Duty Manager", recipientPhone: "+92 300 1234567", message: "INC-046: Code Green at Site Alpha. Routine alarm verification required.", sentAt: "13:58:00", deliveryStatus: "failed", escalated: true, triggeredBy: "MOD-01 (QRF)" },
];

function timeNow() {
  return new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

let msgCounter = seedMessages.length + 40; // continue numbering

/* ── Context shape ── */
type AlertContextType = {
  messages: AlertMessage[];
  setMessages: React.Dispatch<React.SetStateAction<AlertMessage[]>>;
  addAlert: (opts: {
    type: AlertType;
    priority: Priority;
    recipient: string;
    recipientPhone: string;
    message: string;
    triggeredBy: string;
  }) => void;
};

const AlertContext = createContext<AlertContextType | null>(null);

export function AlertProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<AlertMessage[]>(seedMessages);

  const addAlert = useCallback(
    (opts: {
      type: AlertType;
      priority: Priority;
      recipient: string;
      recipientPhone: string;
      message: string;
      triggeredBy: string;
    }) => {
      msgCounter++;
      const id = `MSG-${String(msgCounter).padStart(3, "0")}`;
      const sentAt = timeNow();

      const newMsg: AlertMessage = {
        id,
        type: opts.type,
        priority: opts.priority,
        recipient: opts.recipient,
        recipientPhone: opts.recipientPhone,
        message: opts.message,
        sentAt,
        deliveryStatus: "sending",
        escalated: false,
        triggeredBy: opts.triggeredBy,
      };

      setMessages((prev) => [newMsg, ...prev]);

      /* Simulate delivery lifecycle */
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
    },
    []
  );

  return (
    <AlertContext.Provider value={{ messages, setMessages, addAlert }}>
      {children}
    </AlertContext.Provider>
  );
}

export function useAlerts() {
  const ctx = useContext(AlertContext);
  if (!ctx) throw new Error("useAlerts must be used within AlertProvider");
  return ctx;
}
