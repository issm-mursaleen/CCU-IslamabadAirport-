"use client";

import { useEffect, useRef, useState } from "react";
import {
  Bot,
  Send,
  Loader2,
  Sparkles,
  Terminal,
  AlertTriangle,
} from "lucide-react";

type Message = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
};

const suggestedQueries = [
  "Which guards on Site Alpha expire this month?",
  "Show all active QRF teams and their locations",
  "How many open incidents today?",
  "Which guards are trained in armed response?",
  "What is the escalation chain for critical alerts?",
  "List all coverage gaps this week",
];

export default function AIAssistantPage() {
  const [mounted, setMounted] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "sys-1",
      role: "system",
      content:
        "ISSM AI Assistant initialized. Connected to security operations knowledge base. Ready to answer queries about QRF teams, guard compliance, training, deployments, and alerts.",
      timestamp: new Date().toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text?: string) => {
    const question = text || input.trim();
    if (!question || loading) return;

    const userMsg: Message = {
      id: `usr-${Date.now()}`,
      role: "user",
      content: question,
      timestamp: new Date().toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages.filter((m) => m.role !== "system"), userMsg].map(
            (m) => ({ role: m.role, content: m.content })
          ),
          question,
        }),
      });

      if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
      }

      const data = await res.json();

      const assistantMsg: Message = {
        id: `ast-${Date.now()}`,
        role: "assistant",
        content: data.answer || "I could not process that query. Please try again.",
        timestamp: new Date().toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: "assistant",
          content:
            "Connection to AI backend failed. Ensure your OPENAI_API_KEY is set in .env and the server is running.",
          timestamp: new Date().toLocaleTimeString("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-md bg-tactical-green/10 border border-tactical-green/30">
            <Bot className="h-5 w-5 text-tactical-green" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">AI Assistant</h1>
            <p className="text-xs text-muted-foreground font-mono">
              MOD-06 — Natural Language Ops Intelligence (RAG)
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-tactical-green-dim border border-tactical-green/20">
          <Sparkles className="h-3.5 w-3.5 text-tactical-green" />
          <span className="font-mono text-[10px] text-tactical-green tracking-wide">
            RAG ENGINE READY
          </span>
        </div>
      </div>

      {/* Chat area */}
      <div
        className={`flex-1 glow-border rounded-lg bg-card noise-texture overflow-hidden flex flex-col min-h-0 ${
          mounted ? "fade-in-up" : "opacity-0"
        }`}
        style={{ animationDelay: "100ms" }}
      >
        {/* Terminal header */}
        <div className="flex items-center gap-2 px-4 py-2 border-b border-border/40 bg-[#0A0E14] shrink-0">
          <Terminal className="h-3.5 w-3.5 text-tactical-green" />
          <span className="font-mono text-[10px] tracking-[0.15em] text-tactical-green/70">
            issm-ai@ops ~ $
          </span>
          <span className="font-mono text-[10px] text-muted-foreground ml-auto">
            knowledge-base.md loaded
          </span>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0">
          {messages.map((msg) => (
            <div key={msg.id}>
              {msg.role === "system" ? (
                <div className="flex items-start gap-2 px-3 py-2 rounded-md bg-tactical-green/5 border border-tactical-green/10">
                  <Sparkles className="h-3.5 w-3.5 text-tactical-green shrink-0 mt-0.5" />
                  <div>
                    <p className="font-mono text-[10px] text-tactical-green/70 mb-0.5">
                      SYSTEM
                    </p>
                    <p className="font-mono text-[11px] text-muted-foreground leading-relaxed">
                      {msg.content}
                    </p>
                  </div>
                </div>
              ) : msg.role === "user" ? (
                <div className="flex justify-end">
                  <div className="max-w-[75%]">
                    <div className="flex items-center justify-end gap-2 mb-1">
                      <span className="font-mono text-[9px] text-muted-foreground tabular-nums">
                        {msg.timestamp}
                      </span>
                      <span className="font-mono text-[10px] text-tactical-cyan font-bold">
                        OPERATOR
                      </span>
                    </div>
                    <div className="px-3 py-2 rounded-lg bg-tactical-cyan/10 border border-tactical-cyan/20">
                      <p className="font-mono text-[11px] text-foreground leading-relaxed">
                        {msg.content}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex justify-start">
                  <div className="max-w-[85%]">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-[10px] text-tactical-green font-bold">
                        AI ASSISTANT
                      </span>
                      <span className="font-mono text-[9px] text-muted-foreground tabular-nums">
                        {msg.timestamp}
                      </span>
                    </div>
                    <div className="px-3 py-2 rounded-lg bg-accent/30 border border-border/40">
                      <p className="font-mono text-[11px] text-foreground/90 leading-relaxed whitespace-pre-wrap">
                        {msg.content}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 px-3 py-2">
              <Loader2 className="h-3.5 w-3.5 text-tactical-green animate-spin" />
              <span className="font-mono text-[10px] text-tactical-green/70 typing-cursor">
                Processing query
              </span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested queries */}
        {messages.length <= 1 && (
          <div className="px-4 pb-3 shrink-0">
            <p className="font-mono text-[9px] text-muted-foreground tracking-wider uppercase mb-2">
              Suggested Queries
            </p>
            <div className="flex flex-wrap gap-1.5">
              {suggestedQueries.map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  className="font-mono text-[10px] px-2.5 py-1.5 rounded-md bg-accent/30 border border-border/50 text-muted-foreground hover:text-tactical-green hover:border-tactical-green/30 transition-colors text-left"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="px-4 py-3 border-t border-border/40 bg-[#0A0E14] shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] text-tactical-green/50 shrink-0">
              {">>>"}
            </span>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Ask about QRF teams, guard compliance, deployments, incidents..."
              className="flex-1 bg-transparent border-none outline-none font-mono text-[11px] text-foreground placeholder:text-muted-foreground/40"
              disabled={loading}
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              className={`p-1.5 rounded transition-colors ${
                input.trim() && !loading
                  ? "text-tactical-green hover:bg-tactical-green/10"
                  : "text-muted-foreground/30"
              }`}
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
